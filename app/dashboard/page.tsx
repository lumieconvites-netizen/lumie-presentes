import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';
import { getPrimaryGiftListIdForUser } from '@/lib/primary-gift-list';
import { reconcilePendingOrdersForGiftList } from '@/lib/order-status-reconciliation';
import DashboardPageClient, { type DashboardData } from '@/components/dashboard/dashboard-page-client';
import { resolveEffectivePlan } from '@/lib/plans';

export default async function DashboardPage() {
  const ctx = await getActingUserContext();

  let initialData: DashboardData | null = null;

  if (ctx) {
    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);

    if (primaryGiftListId) {
      try {
        await reconcilePendingOrdersForGiftList(primaryGiftListId, {
          throttleKey: `dashboard-page:${primaryGiftListId}`,
          minIntervalMs: 15_000,
          take: 30,
        });
      } catch (error) {
        console.error('Falha ao reconciliar pedidos pendentes em dashboard/page:', error);
      }

      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          slug: true,
          isPublished: true,
          title: true,
          description: true,
        },
      });

      if (giftList) {
        const [userPlan, customDomain, totalGifts, activeGifts, recentMessages, recentPayments, pendingOrdersCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: ctx.effectiveUserId },
            select: { plan: true, planExpiresAt: true },
          }),
          prisma.customDomain.findFirst({
            where: { giftListId: primaryGiftListId },
            orderBy: { createdAt: 'desc' },
            select: { domain: true, status: true },
          }),
          prisma.giftItem.count({
            where: {
              giftListId: primaryGiftListId,
            },
          }),
          prisma.giftItem.count({
            where: {
              giftListId: primaryGiftListId,
              availableQty: { gt: 0 },
            },
          }),
          prisma.message.findMany({
            where: {
              giftListId: primaryGiftListId,
              order: {
                status: { in: ['PAID', 'AUTHORIZED'] },
              },
            },
            select: {
              id: true,
              guestName: true,
              content: true,
              createdAt: true,
              order: {
                select: {
                  giftItem: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          }),
          prisma.order.findMany({
            where: {
              giftListId: primaryGiftListId,
              status: 'PAID',
            },
            select: {
              id: true,
              guestName: true,
              totalAmount: true,
              feeAmount: true,
              createdAt: true,
              giftItem: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          }),
          prisma.order.count({
            where: {
              giftListId: primaryGiftListId,
              status: { in: ['PENDING', 'AUTHORIZED'] },
            },
          }),
        ]);

        initialData = {
          ...giftList,
          plan: resolveEffectivePlan(userPlan),
          customDomain,
          summary: {
            totalGifts,
            activeGifts,
            pendingOrdersCount,
            recentPayments: recentPayments.map((payment) => ({
              ...payment,
              totalAmount: Number(payment.totalAmount),
              feeAmount: Number(payment.feeAmount),
              createdAt: payment.createdAt.toISOString(),
            })),
            recentMessages: recentMessages.map((message) => ({
              ...message,
              createdAt: message.createdAt.toISOString(),
            })),
          },
        };
      }
    }
  }

  return <DashboardPageClient initialData={initialData} />;
}
