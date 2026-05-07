import { prisma } from '@/lib/prisma';
import { computePremiumExpiration } from '@/lib/premium-plan';

export async function activatePremiumPlanPurchase(planPurchaseId: string) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.planPurchase.findUnique({
      where: { id: planPurchaseId },
      select: {
        id: true,
        userId: true,
        status: true,
        paidAt: true,
        activatedAt: true,
      },
    });

    if (!purchase) return null;

    const user = await tx.user.findUnique({
      where: { id: purchase.userId },
      select: {
        id: true,
        plan: true,
        planExpiresAt: true,
      },
    });

    if (!user) return null;

    const expiresAt = computePremiumExpiration(user.planExpiresAt);

    await tx.user.update({
      where: { id: user.id },
      data: {
        plan: 'PREMIUM',
        planExpiresAt: expiresAt,
      },
    });

    await tx.planPurchase.update({
      where: { id: purchase.id },
      data: {
        status: 'PAID',
        paidAt: purchase.paidAt ?? new Date(),
        activatedAt: purchase.activatedAt ?? new Date(),
        expiresAt,
      },
    });

    const existingEntitlement = await tx.domainEntitlement.findUnique({
      where: { planPurchaseId: purchase.id },
      select: { id: true, status: true },
    });

    if (existingEntitlement) {
      await tx.domainEntitlement.update({
        where: { id: existingEntitlement.id },
        data: {
          expiresAt,
          releasedAt: existingEntitlement.status === 'EXPIRED' ? null : undefined,
          status: existingEntitlement.status === 'EXPIRED' ? 'AVAILABLE' : undefined,
        },
      });
    } else {
      await tx.domainEntitlement.create({
        data: {
          userId: user.id,
          planPurchaseId: purchase.id,
          status: 'AVAILABLE',
          expiresAt,
        },
      });
    }

    return { expiresAt };
  });
}
