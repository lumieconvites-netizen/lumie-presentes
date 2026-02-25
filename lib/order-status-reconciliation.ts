import { mapOrderStatus, getOrder } from "@/lib/pagarme";
import { prisma } from "@/lib/prisma";

type ReconcileCandidate = {
  id: string;
  status: "PENDING" | "AUTHORIZED";
  giftItemId: string;
  quantity: number;
  pagarmeOrderId: string;
};

type ReconcileOptions = {
  take?: number;
  minIntervalMs?: number;
  throttleKey?: string;
};

const processState = globalThis as typeof globalThis & {
  __lumieReconcileLastRunAt?: Map<string, number>;
  __lumieReconcileInFlight?: Map<string, Promise<boolean>>;
};

function getLastRunMap() {
  if (!processState.__lumieReconcileLastRunAt) {
    processState.__lumieReconcileLastRunAt = new Map<string, number>();
  }
  return processState.__lumieReconcileLastRunAt;
}

function getInFlightMap() {
  if (!processState.__lumieReconcileInFlight) {
    processState.__lumieReconcileInFlight = new Map<string, Promise<boolean>>();
  }
  return processState.__lumieReconcileInFlight;
}

function toOrderStatus(status: string) {
  if (status === "paid" || status === "authorized") return "PAID" as const;
  if (status === "refunded") return "REFUNDED" as const;
  if (status === "failed" || status === "canceled") return "REFUSED" as const;
  return "PENDING" as const;
}

function resolveGatewayMappedStatus(order: any) {
  const candidates = [
    order?.status,
    order?.charges?.[0]?.status,
    order?.charges?.[0]?.last_transaction?.status,
    order?.last_transaction?.status,
  ];

  for (const candidate of candidates) {
    const mapped = mapOrderStatus(candidate);
    if (mapped !== "unknown") return mapped;
  }

  return "unknown";
}

async function reconcileSingleOrder(order: ReconcileCandidate) {
  const gatewayOrder = await getOrder(order.pagarmeOrderId);
  const mappedStatus = resolveGatewayMappedStatus(gatewayOrder);
  if (mappedStatus === "unknown") return false;

  const nextStatus = toOrderStatus(mappedStatus);
  if (nextStatus === "PENDING") return false;

  const current = await prisma.order.findUnique({
    where: { id: order.id },
    select: { id: true, status: true, giftItemId: true, quantity: true },
  });
  if (!current) return false;

  if (nextStatus === "PAID") {
    await prisma.$transaction(async (tx) => {
      const transition = await tx.order.updateMany({
        where: { id: current.id, status: { not: "PAID" } },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      if (transition.count > 0) {
        await tx.giftItem.update({
          where: { id: current.giftItemId },
          data: { availableQty: { decrement: current.quantity } },
        });

        await tx.message.updateMany({
          where: { orderId: current.id },
          data: { isPublic: true },
        });
      }
    });
    return current.status !== "PAID";
  }

  if (nextStatus === "REFUNDED" || nextStatus === "REFUSED") {
    if (current.status === nextStatus) return false;
    await prisma.$transaction(async (tx) => {
      if (nextStatus === "REFUNDED") {
        const transition = await tx.order.updateMany({
          where: { id: current.id, status: "PAID" },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
          },
        });
        if (transition.count > 0) {
          await tx.giftItem.update({
            where: { id: current.giftItemId },
            data: { availableQty: { increment: current.quantity } },
          });
          await tx.message.updateMany({
            where: { orderId: current.id },
            data: { isPublic: false },
          });
        }
      } else {
        await tx.order.updateMany({
          where: { id: current.id, status: { in: ["PENDING", "AUTHORIZED"] } },
          data: { status: "REFUSED" },
        });
      }
    });
    return true;
  }

  return false;
}

export async function reconcilePendingOrdersForGiftList(giftListId: string, options?: ReconcileOptions) {
  const hasGateway = Boolean(process.env.WITHDRAW_GATEWAY_URL?.trim());
  if (!process.env.PAGARME_SECRET_KEY && !hasGateway) return false;

  const throttleKey = options?.throttleKey || giftListId;
  const minIntervalMs = Math.max(0, Number(options?.minIntervalMs ?? 0));
  const now = Date.now();
  const lastRunMap = getLastRunMap();
  const inFlightMap = getInFlightMap();

  const currentInFlight = inFlightMap.get(throttleKey);
  if (currentInFlight) {
    return currentInFlight;
  }

  const lastRunAt = lastRunMap.get(throttleKey) ?? 0;
  if (minIntervalMs > 0 && now - lastRunAt < minIntervalMs) {
    return false;
  }

  const task = (async () => {
    lastRunMap.set(throttleKey, Date.now());

    const lookbackDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pendingOrders = await prisma.order.findMany({
      where: {
        giftListId,
        status: { in: ["PENDING", "AUTHORIZED"] },
        pagarmeOrderId: { not: null },
        createdAt: { gte: lookbackDate },
      },
      select: {
        id: true,
        status: true,
        giftItemId: true,
        quantity: true,
        pagarmeOrderId: true,
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, Math.min(Number(options?.take ?? 30), 100)),
    });

    let changed = false;
    for (const pendingOrder of pendingOrders) {
      try {
        const updated = await reconcileSingleOrder({
          id: pendingOrder.id,
          status: pendingOrder.status as "PENDING" | "AUTHORIZED",
          giftItemId: pendingOrder.giftItemId,
          quantity: pendingOrder.quantity,
          pagarmeOrderId: String(pendingOrder.pagarmeOrderId),
        });
        changed = changed || updated;
      } catch (error) {
        console.error("Falha ao reconciliar pedido pendente", {
          localOrderId: pendingOrder.id,
          pagarmeOrderId: pendingOrder.pagarmeOrderId,
          error,
        });
      }
    }

    return changed;
  })();

  inFlightMap.set(throttleKey, task);
  try {
    return await task;
  } finally {
    inFlightMap.delete(throttleKey);
  }
}
