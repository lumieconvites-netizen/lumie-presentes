import { prisma } from "@/lib/prisma";

function scoreList(list: {
  isPublished: boolean;
  updatedAt: Date;
  createdAt: Date;
  _count: { orders: number; gifts: number; messages: number };
}) {
  return (
    (list.isPublished ? 1_000_000 : 0) +
    list._count.orders * 10_000 +
    list._count.gifts * 100 +
    list._count.messages
  );
}

export async function getPrimaryGiftListIdForUser(userId: string): Promise<string | null> {
  const lists = await prisma.giftList.findMany({
    where: { userId },
    select: {
      id: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          orders: true,
          gifts: true,
          messages: true,
        },
      },
    },
    take: 50,
  });

  if (!lists.length) return null;

  lists.sort((a, b) => {
    const scoreDiff = scoreList(b) - scoreList(a);
    if (scoreDiff !== 0) return scoreDiff;

    const updatedDiff = b.updatedAt.getTime() - a.updatedAt.getTime();
    if (updatedDiff !== 0) return updatedDiff;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return lists[0]?.id ?? null;
}
