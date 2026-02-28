import { prisma } from "@/lib/prisma";

export async function getPrimaryGiftListIdForUser(userId: string): Promise<string | null> {
  const primary = await prisma.giftList.findFirst({
    where: { userId },
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
    select: { id: true },
  });
  return primary?.id ?? null;
}
