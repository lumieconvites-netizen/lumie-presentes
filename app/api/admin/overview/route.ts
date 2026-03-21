import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { GIFT_MODEL_CATEGORY } from "@/lib/gift-models";
import { reconcileRecentPendingOrders } from "@/lib/order-status-reconciliation";
import { buildCreatedAtWhere, normalizePeriodFilter } from "@/lib/period-filter";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = normalizePeriodFilter(searchParams.get("period"));
  const createdAtWhere = buildCreatedAtWhere(period);

  try {
    await reconcileRecentPendingOrders({
      throttleKey: "admin-overview",
      minIntervalMs: 15_000,
      take: 50,
    });
  } catch (error) {
    console.error("Falha ao reconciliar pedidos pendentes em admin/overview:", error);
  }

  const [
    usersCount,
    adminsCount,
    blockedUsersCount,
    clientsCount,
    partnersCount,
    ambassadorsCount,
    listsCount,
    publishedListsCount,
    templatesCount,
    activeTemplatesCount,
    giftsCount,
    messagesCount,
    ordersCount,
    paidOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "PARTNER" } }),
    prisma.user.count({ where: { role: "AMBASSADOR" } }),
    prisma.giftList.count(),
    prisma.giftList.count({ where: { isPublished: true } }),
    prisma.template.count({ where: { category: { not: GIFT_MODEL_CATEGORY } } }),
    prisma.template.count({ where: { isActive: true, category: { not: GIFT_MODEL_CATEGORY } } }),
    prisma.giftItem.count(),
    prisma.message.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: "PAID", ...(createdAtWhere ? { createdAt: createdAtWhere } : {}) },
      select: { totalAmount: true },
    }),
  ]);

  // Fallback: if EMPLOYEE enum is not available in DB yet, keep admin page functional.
  let employeesCount = 0;
  try {
    employeesCount = await prisma.user.count({ where: { role: "EMPLOYEE" as any } });
  } catch {
    employeesCount = 0;
  }

  const paidTotal = paidOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);

  return NextResponse.json({
    usersCount,
    adminsCount,
    blockedUsersCount,
    clientsCount,
    partnersCount,
    ambassadorsCount,
    employeesCount,
    listsCount,
    publishedListsCount,
    templatesCount,
    activeTemplatesCount,
    giftsCount,
    messagesCount,
    ordersCount,
    paidTotal,
    period,
  });
}
