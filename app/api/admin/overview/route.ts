import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const [usersCount, adminsCount, blockedUsersCount, listsCount, publishedListsCount, ordersCount, paidOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.giftList.count(),
      prisma.giftList.count({ where: { isPublished: true } }),
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: "PAID" },
        select: { totalAmount: true },
      }),
    ]);

  const paidTotal = paidOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);

  return NextResponse.json({
    usersCount,
    adminsCount,
    blockedUsersCount,
    listsCount,
    publishedListsCount,
    ordersCount,
    paidTotal,
  });
}
