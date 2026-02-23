import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";
import { calculateSplitFromOrder, cardPaymentMethodWhere, isRealRecipientId } from "@/lib/affiliate-splits";
import { buildCreatedAtWhere, normalizePeriodFilter } from "@/lib/period-filter";

const CARD_LIQUIDATION_WINDOW_DAYS = 45;

function isCardMethod(value?: string | null) {
  const method = String(value ?? "").toLowerCase();
  return method.includes("credit") || method.includes("card") || method.includes("cartao") || method.includes("cartão");
}

function isCardStillPending(params: {
  paymentMethod?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  cutoff: Date;
}) {
  if (!isCardMethod(params.paymentMethod)) return false;
  const referenceDate = params.paidAt ?? params.createdAt;
  return referenceDate >= params.cutoff;
}

export async function GET(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (ctx.effectiveUser.role !== "PARTNER") {
    return NextResponse.json({ error: "Acesso permitido apenas para parceiros." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = normalizePeriodFilter(searchParams.get("period"));
  const createdAtWhere = buildCreatedAtWhere(period);

  const partnerId = ctx.effectiveUserId;
  await ensureDefaultReferralCodesForUser({ id: partnerId, role: "PARTNER" });

  const cardLiquidationCutoff = new Date();
  cardLiquidationCutoff.setDate(cardLiquidationCutoff.getDate() - CARD_LIQUIDATION_WINDOW_DAYS);

  const [partnerUser, codes, referredClients, paidOrders, pendingCardOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        partnerAmbassador: { select: { id: true, name: true, email: true } },
        recipient: { select: { pagarmeRecipientId: true, createdAt: true } },
      },
    }),
    prisma.referralCode.findMany({
      where: { ownerUserId: partnerId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, code: true, type: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT", referredByPartnerId: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { giftLists: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        giftList: { user: { referredByPartnerId: partnerId } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paymentMethod: true,
        baseAmount: true,
        totalAmount: true,
        paidAt: true,
        createdAt: true,
        giftList: {
          select: {
            id: true,
            title: true,
            slug: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                acquisitionSource: true,
                recipient: { select: { pagarmeRecipientId: true, createdAt: true } },
                referredByAmbassador: {
                  select: {
                    recipient: {
                      select: { pagarmeRecipientId: true, createdAt: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: 500,
    }),
    prisma.order.findMany({
      where: {
        AND: [
          ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
          cardPaymentMethodWhere(),
          {
            OR: [
              { status: { in: ["PENDING", "AUTHORIZED"] } },
              { status: "PAID", paidAt: { gte: cardLiquidationCutoff } },
            ],
          },
          { giftList: { user: { referredByPartnerId: partnerId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        giftList: { select: { title: true, slug: true, user: { select: { name: true, email: true } } } },
      },
      take: 100,
    }),
  ]);

  if (!partnerUser) return NextResponse.json({ error: "Parceiro nao encontrado" }, { status: 404 });

  let totalCommissionPaid = 0;
  let totalGrossSales = 0;
  const clientsMap = new Map<string, { id: string; name: string; email: string; sales: number; commission: number; orders: number }>();

  for (const client of referredClients) {
    clientsMap.set(client.id, {
      id: client.id,
      name: client.name || "Sem nome",
      email: client.email,
      sales: 0,
      commission: 0,
      orders: 0,
    });
  }

  for (const order of paidOrders) {
    const totalAmount = Number(order.totalAmount);
    totalGrossSales += totalAmount;
    const user = order.giftList.user;
    const baseAmount = Number(order.baseAmount);

    const clientRecipientReadyAtOrder =
      isRealRecipientId(user.recipient?.pagarmeRecipientId) &&
      Boolean(user.recipient?.createdAt && user.recipient.createdAt <= order.createdAt);
    const partnerRecipientReadyAtOrder =
      isRealRecipientId(partnerUser.recipient?.pagarmeRecipientId) &&
      Boolean(partnerUser.recipient?.createdAt && partnerUser.recipient.createdAt <= order.createdAt);
    const ambassadorRecipientReadyAtOrder =
      isRealRecipientId(user.referredByAmbassador?.recipient?.pagarmeRecipientId) &&
      Boolean(
        user.referredByAmbassador?.recipient?.createdAt &&
          user.referredByAmbassador.recipient.createdAt <= order.createdAt
      );

    const split = calculateSplitFromOrder({
      baseAmount,
      totalAmount,
      acquisitionSource: user.acquisitionSource,
      hasClientRecipient: clientRecipientReadyAtOrder,
      hasPartnerRecipient: partnerRecipientReadyAtOrder,
      hasAmbassadorRecipient: ambassadorRecipientReadyAtOrder,
      paymentMethod: isCardMethod(order.paymentMethod) ? "CREDIT_CARD" : "PIX",
    });

    const commissionGenerated = split.partnerInCents / 100;
    const commissionReceived = isCardStillPending({
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      cutoff: cardLiquidationCutoff,
    })
      ? 0
      : commissionGenerated;

    totalCommissionPaid += commissionReceived;

    const key = user.id;
    const current = clientsMap.get(key) ?? {
      id: user.id,
      name: user.name || "Sem nome",
      email: user.email,
      sales: 0,
      commission: 0,
      orders: 0,
    };
    current.sales += totalAmount;
    current.commission += commissionReceived;
    current.orders += 1;
    clientsMap.set(key, current);
  }

  const pendingCardAmount = pendingCardOrders.reduce((acc, item) => acc + Number(item.totalAmount), 0);
  const codeUsage = await Promise.all(
    codes.map(async (code) => {
      const usersCount = await prisma.user.count({ where: { appliedReferralCode: code.code } });
      return { ...code, usageCount: usersCount };
    })
  );

  return NextResponse.json({
    partner: {
      id: partnerUser.id,
      name: partnerUser.name || "Sem nome",
      email: partnerUser.email,
      ambassador: partnerUser.partnerAmbassador,
    },
    codes: codeUsage,
    kpis: {
      clientsCount: referredClients.length,
      activeClientsCount: referredClients.filter((c) => c._count.giftLists > 0).length,
      grossSales: totalGrossSales,
      totalCommissionPaid,
      totalOrdersPaid: paidOrders.length,
      pendingCardOrders: pendingCardOrders.length,
      pendingCardAmount,
    },
    period,
    clients: Array.from(clientsMap.values()).sort((a, b) => b.commission - a.commission),
    recentPendingCards: pendingCardOrders,
  });
}
