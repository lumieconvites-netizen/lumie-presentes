import { prisma } from '@/lib/prisma';
import { resolveEffectivePlan } from '@/lib/plans';
import { LUMIE_EXCLUSIVE_PRICE_CENTS } from '@/lib/premium-plan';

export async function ensurePremiumDomainEntitlementForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      planExpiresAt: true,
      referredByPartnerId: true,
      referredByAmbassadorId: true,
    },
  });

  if (!user || resolveEffectivePlan(user) !== 'PREMIUM') return null;

  const existingActive = await prisma.domainEntitlement.findFirst({
    where: {
      userId,
      status: { in: ['AVAILABLE', 'RESERVED'] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (existingActive) return existingActive;

  const latestPaidPurchase = await prisma.planPurchase.findFirst({
    where: {
      userId,
      status: 'PAID',
    },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      expiresAt: true,
    },
  });

  if (latestPaidPurchase) {
    const entitlement = await prisma.domainEntitlement.findUnique({
      where: { planPurchaseId: latestPaidPurchase.id },
      select: { id: true },
    });

    if (entitlement) return entitlement;

    return prisma.domainEntitlement.create({
      data: {
        userId,
        planPurchaseId: latestPaidPurchase.id,
        status: 'AVAILABLE',
        expiresAt: latestPaidPurchase.expiresAt ?? user.planExpiresAt ?? null,
      },
      select: { id: true },
    });
  }

  const syntheticPurchase = await prisma.planPurchase.create({
    data: {
      userId,
      partnerUserId: user.referredByPartnerId ?? null,
      ambassadorUserId: user.referredByAmbassadorId ?? null,
      plan: 'PREMIUM',
      amount: LUMIE_EXCLUSIVE_PRICE_CENTS / 100,
      status: 'PAID',
      paymentMethod: 'manual_backfill',
      paidAt: new Date(),
      activatedAt: new Date(),
      expiresAt: user.planExpiresAt ?? null,
    },
    select: { id: true },
  });

  return prisma.domainEntitlement.create({
    data: {
      userId,
      planPurchaseId: syntheticPurchase.id,
      status: 'AVAILABLE',
      expiresAt: user.planExpiresAt ?? null,
    },
    select: { id: true },
  });
}

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
