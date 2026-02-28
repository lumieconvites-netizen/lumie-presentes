import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';
import { getPrimaryGiftListIdForUser } from '@/lib/primary-gift-list';
import RecadosPageClient, { type MessageRow } from '@/components/dashboard/recados-page-client';

export default async function RecadosPage() {
  const ctx = await getActingUserContext();
  let initialMessages: MessageRow[] = [];

  if (ctx) {
    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);

    if (primaryGiftListId) {
      const messages = await prisma.message.findMany({
        where: {
          giftListId: primaryGiftListId,
          order: {
            status: { in: ['PAID', 'AUTHORIZED'] },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 120,
        select: {
          id: true,
          guestName: true,
          content: true,
          signature: true,
          isPublic: true,
          isFavorite: true,
          createdAt: true,
          order: {
            select: {
              totalAmount: true,
              giftItem: {
                select: { name: true },
              },
            },
          },
        },
      });

      initialMessages = messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
        order: message.order
          ? {
              ...message.order,
              totalAmount: message.order.totalAmount ? Number(message.order.totalAmount) : undefined,
            }
          : null,
      }));
    }
  }

  return <RecadosPageClient initialMessages={initialMessages} />;
}
