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
  if (ctx.effectiveUser.role !== "AMBASSADOR") {
    return NextResponse.json({ error: "Acesso permitido apenas para embaixadores." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = normalizePeriodFilter(searchParams.get("period"));
  const createdAtWhere = buildCreatedAtWhere(period);

  const ambassadorId = ctx.effectiveUserId;
  await ensureDefaultReferralCodesForUser({ id: ambassadorId, role: "AMBASSADOR" });

  const cardLiquidationCutoff = new Date();
  cardLiquidationCutoff.setDate(cardLiquidationCutoff.getDate() - CARD_LIQUIDATION_WINDOW_DAYS);

  const [ambassadorUser, codes, referredClients, referredPartners, paidOrders, pendingCardOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ambassadorId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        recipient: { select: { pagarmeRecipientId: true, createdAt: true } },
      },
    }),
    prisma.referralCode.findMany({
      where: { ownerUserId: ambassadorId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, code: true, type: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT", referredByAmbassadorId: ambassadorId },
      select: { id: true, name: true, email: true, createdAt: true, _count: { select: { giftLists: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.user.findMany({
      where: { role: "PARTNER", partnerAmbassadorId: ambassadorId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { referredClientsAsPartner: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.order.findMany({
      where: {
        status: "PAID",
        ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        giftList: { user: { referredByAmbassadorId: ambassadorId } },
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
                referredByPartnerId: true,
                recipient: { select: { pagarmeRecipientId: true, createdAt: true } },
                referredByPartner: {
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
      take: 700,
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
          { giftList: { user: { referredByAmbassadorId: ambassadorId } } },
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

  if (!ambassadorUser) return NextResponse.json({ error: "Embaixador nao encontrado" }, { status: 404 });

  let totalCommissionPaid = 0;
  let totalGrossSales = 0;
  let directClientCommission = 0;
  let viaPartnerCommission = 0;
  const clientsMap = new Map<string, { id: string; name: string; email: string; sales: number; commission: number; orders: number }>();

  const partnersMap = new Map<
    string,
    { id: string; name: string; email: string; clients: number; sales: number; commission: number; orders: number }
  >();

  for (const p of referredPartners) {
    partnersMap.set(p.id, {
      id: p.id,
      name: p.name || "Sem nome",
      email: p.email,
      clients: p._count.referredClientsAsPartner,
      sales: 0,
      commission: 0,
      orders: 0,
    });
  }

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
    const baseAmount = Number(order.baseAmount);
    totalGrossSales += totalAmount;

    const user = order.giftList.user;
    const clientRecipientReadyAtOrder =
      isRealRecipientId(user.recipient?.pagarmeRecipientId) &&
      Boolean(user.recipient?.createdAt && user.recipient.createdAt <= order.createdAt);
    const partnerRecipientReadyAtOrder =
      isRealRecipientId(user.referredByPartner?.recipient?.pagarmeRecipientId) &&
      Boolean(
        user.referredByPartner?.recipient?.createdAt &&
          user.referredByPartner.recipient.createdAt <= order.createdAt
      );
    const ambassadorRecipientReadyAtOrder =
      isRealRecipientId(ambassadorUser.recipient?.pagarmeRecipientId) &&
      Boolean(ambassadorUser.recipient?.createdAt && ambassadorUser.recipient.createdAt <= order.createdAt);

    const split = calculateSplitFromOrder({
      baseAmount,
      totalAmount,
      acquisitionSource: user.acquisitionSource,
      hasClientRecipient: clientRecipientReadyAtOrder,
      hasPartnerRecipient: partnerRecipientReadyAtOrder,
      hasAmbassadorRecipient: ambassadorRecipientReadyAtOrder,
      paymentMethod: isCardMethod(order.paymentMethod) ? "CREDIT_CARD" : "PIX",
    });

    const commissionGenerated = split.ambassadorInCents / 100;
    const commissionReceived = isCardStillPending({
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      cutoff: cardLiquidationCutoff,
    })
      ? 0
      : commissionGenerated;
    totalCommissionPaid += commissionReceived;
    if (user.referredByPartnerId) viaPartnerCommission += commissionReceived;
    else directClientCommission += commissionReceived;

    if (user.referredByPartnerId) {
      const partnerLine = partnersMap.get(user.referredByPartnerId);
      if (partnerLine) {
        partnerLine.sales += totalAmount;
        partnerLine.commission += commissionReceived;
        partnerLine.orders += 1;
        partnersMap.set(user.referredByPartnerId, partnerLine);
      }
    }

    const currentClient = clientsMap.get(user.id) ?? {
      id: user.id,
      name: user.name || "Sem nome",
      email: user.email,
      sales: 0,
      commission: 0,
      orders: 0,
    };
    currentClient.sales += totalAmount;
    currentClient.commission += commissionReceived;
    currentClient.orders += 1;
    clientsMap.set(user.id, currentClient);
  }

  const pendingCardAmount = pendingCardOrders.reduce((acc, item) => acc + Number(item.totalAmount), 0);
  const codeUsage = await Promise.all(
    codes.map(async (code) => {
      const usersCount = await prisma.user.count({ where: { appliedReferralCode: code.code } });
      return { ...code, usageCount: usersCount };
    })
  );

  return NextResponse.json({
    ambassador: {
      id: ambassadorUser.id,
      name: ambassadorUser.name || "Sem nome",
      email: ambassadorUser.email,
    },
    codes: codeUsage,
    kpis: {
      clientsCount: referredClients.length,
      activeClientsCount: referredClients.filter((c) => c._count.giftLists > 0).length,
      partnersCount: referredPartners.length,
      grossSales: totalGrossSales,
      totalCommissionPaid,
      directClientCommission,
      viaPartnerCommission,
      totalOrdersPaid: paidOrders.length,
      pendingCardOrders: pendingCardOrders.length,
      pendingCardAmount,
    },
    period,
    clients: Array.from(clientsMap.values()).sort((a, b) => b.commission - a.commission),
    partners: Array.from(partnersMap.values()).sort((a, b) => b.commission - a.commission),
    recentPendingCards: pendingCardOrders,
  });
}
