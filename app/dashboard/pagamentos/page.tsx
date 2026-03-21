import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';
import { getPrimaryGiftListIdForUser } from '@/lib/primary-gift-list';
import { reconcilePendingOrdersForGiftList } from '@/lib/order-status-reconciliation';
import PagamentosPageClient, { type OrderRow } from '@/components/dashboard/pagamentos-page-client';

export default async function PagamentosPage() {
  const ctx = await getActingUserContext();
  let initialOrders: OrderRow[] = [];

  if (ctx) {
    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);

    if (primaryGiftListId) {
      try {
        await reconcilePendingOrdersForGiftList(primaryGiftListId, {
          throttleKey: `dashboard-payments:${primaryGiftListId}`,
          minIntervalMs: 15_000,
          take: 30,
        });
      } catch (error) {
        console.error('Falha ao reconciliar pedidos pendentes em dashboard/pagamentos:', error);
      }

      const orders = await prisma.order.findMany({
        where: { giftListId: primaryGiftListId },
        orderBy: { createdAt: 'desc' },
        take: 120,
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          totalAmount: true,
          feeAmount: true,
          status: true,
          createdAt: true,
          giftItem: {
            select: { id: true, name: true },
          },
        },
      });

      initialOrders = orders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        feeAmount: Number(order.feeAmount),
        createdAt: order.createdAt.toISOString(),
      })) as OrderRow[];
    }
  }

  return <PagamentosPageClient initialOrders={initialOrders} />;
}
