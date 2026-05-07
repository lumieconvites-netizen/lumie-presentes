import { prisma } from '@/lib/prisma';

export async function getDomainEntitlementForUser(userId: string) {
  const entitlements = await prisma.domainEntitlement.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      customDomain: {
        select: {
          id: true,
          domain: true,
          status: true,
          expiresAt: true,
        },
      },
      planPurchase: {
        select: {
          id: true,
          status: true,
          expiresAt: true,
        },
      },
    },
  });

  const reserved = entitlements.find((item) => item.status === 'RESERVED');
  const available = entitlements.find((item) => item.status === 'AVAILABLE');
  const active = reserved ?? available ?? null;

  const hasAvailableSlot = entitlements.some((item) => item.status === 'AVAILABLE');
  const hasReservedSlot = entitlements.some((item) => item.status === 'RESERVED');
  const activeCount = entitlements.filter((item) => item.status === 'AVAILABLE' || item.status === 'RESERVED').length;

  return {
    active,
    reserved,
    available,
    hasAvailableSlot,
    hasReservedSlot,
    activeCount,
    entitlements,
  };
}

export async function reserveDomainEntitlementForUser(params: {
  userId: string;
  customDomainId: string;
  expiresAt?: Date | null;
}) {
  const { userId, customDomainId, expiresAt } = params;

  return prisma.$transaction(async (tx) => {
    const reserved = await tx.domainEntitlement.findFirst({
      where: {
        userId,
        status: 'RESERVED',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reserved) {
      return tx.domainEntitlement.update({
        where: { id: reserved.id },
        data: {
          customDomainId,
          reservedAt: reserved.reservedAt ?? new Date(),
          expiresAt: expiresAt ?? reserved.expiresAt,
        },
      });
    }

    const available = await tx.domainEntitlement.findFirst({
      where: {
        userId,
        status: 'AVAILABLE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!available) return null;

    return tx.domainEntitlement.update({
      where: { id: available.id },
      data: {
        status: 'RESERVED',
        customDomainId,
        reservedAt: new Date(),
        expiresAt: expiresAt ?? available.expiresAt,
      },
    });
  });
}

export async function markExpiredDomainEntitlements(userId: string) {
  const now = new Date();
  await prisma.domainEntitlement.updateMany({
    where: {
      userId,
      status: { in: ['AVAILABLE', 'RESERVED'] },
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      releasedAt: now,
    },
  });
}

export function summarizeDomainEntitlement(input: Awaited<ReturnType<typeof getDomainEntitlementForUser>>) {
  const active = input.active;
  return {
    hasAvailableSlot: input.hasAvailableSlot,
    hasReservedSlot: input.hasReservedSlot,
    activeCount: input.activeCount,
    active: active
      ? {
          id: active.id,
          status: active.status,
          expiresAt: active.expiresAt ? active.expiresAt.toISOString() : null,
          reservedAt: active.reservedAt ? active.reservedAt.toISOString() : null,
          customDomain: active.customDomain
            ? {
                id: active.customDomain.id,
                domain: active.customDomain.domain,
                status: active.customDomain.status,
                expiresAt: active.customDomain.expiresAt ? active.customDomain.expiresAt.toISOString() : null,
              }
            : null,
        }
      : null,
  };
}
