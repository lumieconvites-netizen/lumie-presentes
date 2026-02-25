import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { validateWebhookSignature, mapOrderStatus } from "@/lib/pagarme";
import { prisma } from "@/lib/prisma";
import { claimIdempotencyKey } from "@/lib/idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toOrderStatus(status: string) {
  if (status === "paid" || status === "authorized") return "PAID" as const;
  if (status === "refunded") return "REFUNDED" as const;
  if (status === "failed" || status === "canceled") return "REFUSED" as const;
  return "PENDING" as const;
}

function resolvePagarmeOrderId(event: any): string | null {
  return (
    event?.data?.order?.id ??
    event?.data?.order_id ??
    event?.data?.last_transaction?.order?.id ??
    event?.data?.last_transaction?.order_id ??
    event?.data?.id ??
    null
  );
}

function resolveLocalOrderId(event: any): string | null {
  return (
    event?.data?.metadata?.localOrderId ??
    event?.data?.order?.metadata?.localOrderId ??
    event?.data?.last_transaction?.metadata?.localOrderId ??
    null
  );
}

function resolveMappedStatus(event: any) {
  const candidates = [
    event?.data?.status,
    event?.data?.charges?.[0]?.status,
    event?.data?.charges?.[0]?.last_transaction?.status,
    event?.data?.last_transaction?.status,
  ];

  for (const candidate of candidates) {
    const mapped = mapOrderStatus(candidate);
    if (mapped !== "unknown") return mapped;
  }

  return "unknown";
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const ok = validateWebhookSignature({ rawBody, headers: request.headers });
  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event?.type as string | undefined;
  const eventFingerprint =
    String(event?.id ?? "") ||
    createHash("sha256").update(`${eventType ?? "unknown"}|${rawBody}`).digest("hex");

  const idempotencyClaimed = await claimIdempotencyKey(`webhook:pagarme:${eventFingerprint}`, 60 * 60 * 24);
  if (!idempotencyClaimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const localOrderId = resolveLocalOrderId(event);
    const pagarmeOrderId = resolvePagarmeOrderId(event);

    const dbOrder = await prisma.order.findFirst({
      where: localOrderId
        ? { id: localOrderId }
        : pagarmeOrderId
          ? { pagarmeOrderId }
          : undefined,
      select: {
        id: true,
        status: true,
        giftItemId: true,
        quantity: true,
      },
    });

    if (!localOrderId && !pagarmeOrderId) {
      return NextResponse.json({ received: true, skipped: "missing_order_reference" });
    }

    if (!dbOrder) {
      return NextResponse.json({ received: true, skipped: "order_not_found" });
    }

    const mapped = resolveMappedStatus(event);
    let nextStatus = toOrderStatus(mapped);

    // Evita regressão de estado quando já foi marcado como pago no fluxo síncrono.
    if (dbOrder.status === "PAID" && nextStatus === "PENDING") {
      nextStatus = "PAID";
    }

    await prisma.$transaction(async (tx) => {
      if (nextStatus === "PAID") {
        const transition = await tx.order.updateMany({
          where: { id: dbOrder.id, status: { not: "PAID" } },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });

        if (transition.count > 0) {
          await tx.giftItem.update({
            where: { id: dbOrder.giftItemId },
            data: {
              availableQty: { decrement: dbOrder.quantity },
            },
          });

          await tx.message.updateMany({
            where: { orderId: dbOrder.id },
            data: { isPublic: true },
          });
        }

        return;
      }

      if (eventType === "charge.chargeback" || nextStatus === "REFUNDED") {
        const transition = await tx.order.updateMany({
          where: { id: dbOrder.id, status: "PAID" },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
          },
        });

        if (transition.count > 0) {
          await tx.giftItem.update({
            where: { id: dbOrder.giftItemId },
            data: {
              availableQty: { increment: dbOrder.quantity },
            },
          });

          await tx.message.updateMany({
            where: { orderId: dbOrder.id },
            data: { isPublic: false },
          });
        }

        return;
      }

      await tx.order.update({
        where: { id: dbOrder.id },
        data: {
          status: nextStatus,
        },
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook Pagar.me:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
