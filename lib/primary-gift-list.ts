import { prisma } from "@/lib/prisma";

export async function getPrimaryGiftListIdForUser(userId: string): Promise<string | null> {
  const published = await prisma.giftList.findFirst({
    where: { userId, isPublished: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (published?.id) return published.id;

  const latest = await prisma.giftList.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  return latest?.id ?? null;
}
