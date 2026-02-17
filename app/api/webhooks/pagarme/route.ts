import { NextResponse } from "next/server";
import { validateWebhookSignature, mapOrderStatus } from "@/lib/pagarme";
import { prisma } from "@/lib/prisma";

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
    event?.data?.id ??
    event?.data?.order?.id ??
    event?.data?.order_id ??
    event?.data?.last_transaction?.order_id ??
    null
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const ok = validateWebhookSignature({ rawBody, headers: request.headers });
  if (!ok) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event?.type as string | undefined;

  try {
    const pagarmeOrderId = resolvePagarmeOrderId(event);
    if (!pagarmeOrderId) {
      return NextResponse.json({ received: true, skipped: "missing_order_id" });
    }

    const dbOrder = await prisma.order.findFirst({
      where: { pagarmeOrderId },
      select: {
        id: true,
        status: true,
        giftItemId: true,
        quantity: true,
      },
    });

    if (!dbOrder) {
      return NextResponse.json({ received: true, skipped: "order_not_found" });
    }

    const mapped = mapOrderStatus(event?.data?.status ?? event?.data?.charges?.[0]?.status);
    const nextStatus = toOrderStatus(mapped);

    await prisma.order.update({
      where: { id: dbOrder.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === "PAID" ? new Date() : dbOrder.status === "PAID" ? null : undefined,
        refundedAt: nextStatus === "REFUNDED" ? new Date() : undefined,
      },
    });

    if (nextStatus === "PAID" && dbOrder.status !== "PAID") {
      await prisma.giftItem.update({
        where: { id: dbOrder.giftItemId },
        data: {
          availableQty: { decrement: dbOrder.quantity },
        },
      });

      await prisma.message.updateMany({
        where: { orderId: dbOrder.id },
        data: { isPublic: true },
      });
    }

    if ((eventType === "charge.chargeback" || nextStatus === "REFUNDED") && dbOrder.status === "PAID") {
      await prisma.giftItem.update({
        where: { id: dbOrder.giftItemId },
        data: {
          availableQty: { increment: dbOrder.quantity },
        },
      });

      await prisma.message.updateMany({
        where: { orderId: dbOrder.id },
        data: { isPublic: false },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook Pagar.me:", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
