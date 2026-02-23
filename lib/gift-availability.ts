import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const RESERVED_STATUSES: OrderStatus[] = ["PAID", "AUTHORIZED"];

function normalizeTotalQuantity(totalQuantity: number) {
  return Number.isFinite(totalQuantity) ? Math.max(0, Math.trunc(totalQuantity)) : 0;
}

export async function buildEffectiveAvailabilityMap(
  gifts: Array<{ id: string; totalQuantity: number }>
) {
  const map = new Map<string, number>();
  if (!Array.isArray(gifts) || gifts.length === 0) return map;

  const uniqueGiftIds = Array.from(new Set(gifts.map((gift) => gift.id)));
  const reservedRows = await prisma.order.groupBy({
    by: ["giftItemId"],
    where: {
      giftItemId: { in: uniqueGiftIds },
      status: { in: RESERVED_STATUSES },
    },
    _sum: { quantity: true },
  });

  const reservedByGiftId = new Map<string, number>();
  for (const row of reservedRows) {
    reservedByGiftId.set(row.giftItemId, Number(row._sum.quantity ?? 0));
  }

  for (const gift of gifts) {
    const total = normalizeTotalQuantity(gift.totalQuantity);
    const reserved = Math.max(0, Number(reservedByGiftId.get(gift.id) ?? 0));
    map.set(gift.id, Math.max(total - reserved, 0));
  }

  return map;
}

export async function getEffectiveAvailabilityForGift(giftId: string, totalQuantity: number) {
  const map = await buildEffectiveAvailabilityMap([{ id: giftId, totalQuantity }]);
  return map.get(giftId) ?? Math.max(0, normalizeTotalQuantity(totalQuantity));
}
