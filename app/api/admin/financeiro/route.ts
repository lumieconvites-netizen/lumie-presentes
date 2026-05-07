import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { reconcileRecentPendingOrders } from "@/lib/order-status-reconciliation";
import { buildCreatedAtWhere, normalizePeriodFilter } from "@/lib/period-filter";
import { resolveEffectivePlan, resolveNetworkFeePercent } from "@/lib/plans";
import { getOrder } from "@/lib/pagarme";

type MethodFilter = "all" | "card" | "pix";
const CARD_METHODS = ["credit_card", "CREDIT_CARD", "card", "CARD"];
const PIX_METHODS = ["pix", "PIX"];
const PAGARME_PIX_PERCENT = 1.09;
const PAGARME_CARD_PERCENT = 3.29;
const CARD_LIQUIDATION_WINDOW_DAYS = 45;

function cardPaymentMethodWhere() {
  return {
    OR: [
      { paymentMethod: { in: CARD_METHODS } },
      { paymentMethod: { contains: "credit", mode: "insensitive" as const } },
      { paymentMethod: { contains: "card", mode: "insensitive" as const } },
      { paymentMethod: { contains: "cartao", mode: "insensitive" as const } },
    ],
  };
}

function pixPaymentMethodWhere() {
  return {
    OR: [
      { paymentMethod: { in: PIX_METHODS } },
      { paymentMethod: { contains: "pix", mode: "insensitive" as const } },
    ],
  };
}

function readPercent(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function roundCents(value: number) {
  return Math.round(value);
}

function normalizePaymentMethod(value?: string | null): "card" | "pix" | "other" {
  const method = String(value ?? "").toLowerCase();
  if (method.includes("credit") || method.includes("card")) return "card";
  if (method.includes("pix")) return "pix";
  return "other";
}

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

function readCentsLike(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

function extractGatewaySplitSnapshot(payload: any): null | {
  clientInCents: number;
  platformInCents: number;
  partnerInCents: number;
  ambassadorInCents: number;
  splitApplied: boolean;
  partnerEnabled: boolean;
  ambassadorEnabled: boolean;
} {
  const metadataCandidates = [
    payload?.metadata,
    payload?.charges?.[0]?.metadata,
    payload?.charges?.[0]?.last_transaction?.metadata,
  ];

  for (const metadata of metadataCandidates) {
    if (!metadata || typeof metadata !== "object") continue;

    const clientInCents = readCentsLike((metadata as any).splitClientInCents);
    const platformInCents = readCentsLike((metadata as any).splitPlatformInCents);
    const partnerInCents = readCentsLike((metadata as any).splitPartnerInCents);
    const ambassadorInCents = readCentsLike((metadata as any).splitAmbassadorInCents);

    if (
      clientInCents !== null &&
      platformInCents !== null &&
      partnerInCents !== null &&
      ambassadorInCents !== null
    ) {
      return {
        clientInCents,
        platformInCents,
        partnerInCents,
        ambassadorInCents,
        splitApplied: String((metadata as any).splitApplied ?? "true").toLowerCase() !== "false",
        partnerEnabled: partnerInCents > 0,
        ambassadorEnabled: ambassadorInCents > 0,
      };
    }
  }

  return null;
}

function resolveFeePercentages(paymentMethod: "PIX" | "CREDIT_CARD", plan: "FREE" | "PREMIUM") {
  const networkFee = resolveNetworkFeePercent(paymentMethod, plan);
  const defaultProcessingFee = paymentMethod === "CREDIT_CARD" ? 3.29 : 1.09;
  const processingFee =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_CREDIT_CARD", defaultProcessingFee)
      : readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_PIX", defaultProcessingFee);

  return { networkFee, processingFee };
}

function calculateSplitFromOrder(params: {
  baseAmount: number;
  totalAmount: number;
  acquisitionSource: string;
  plan?: "FREE" | "PREMIUM";
  planExpiresAt?: Date | string | null;
  hasClientRecipient: boolean;
  hasPartnerRecipient: boolean;
  hasAmbassadorRecipient: boolean;
  paymentMethod: "PIX" | "CREDIT_CARD";
}) {
  const effectivePlan = resolveEffectivePlan(params);
  const { networkFee, processingFee } = resolveFeePercentages(params.paymentMethod, effectivePlan);
  const partnerFeePercentage = readPercent("PARTNER_COMMISSION_PERCENTAGE", 1.5);
  const ambassadorFeePercentage = readPercent("AMBASSADOR_COMMISSION_PERCENTAGE", 2.5);

  const baseInCents = roundCents(params.baseAmount * 100);
  const totalInCents = roundCents(params.totalAmount * 100);

  const allowAffiliateCommission = effectivePlan === "FREE";

  const partnerEnabled =
    allowAffiliateCommission &&
    params.hasPartnerRecipient &&
    ["PARTNER_DIRECT", "PARTNER_WITH_AMBASSADOR"].includes(params.acquisitionSource);
  const ambassadorEnabled =
    allowAffiliateCommission &&
    params.hasAmbassadorRecipient &&
    ["AMBASSADOR_DIRECT", "PARTNER_WITH_AMBASSADOR"].includes(params.acquisitionSource);

  const hasPlatformRecipient = Boolean(process.env.PAGARME_PLATFORM_RECIPIENT_ID);
  const splitApplied = hasPlatformRecipient && params.hasClientRecipient && totalInCents > 0;

  if (!splitApplied) {
    return {
      splitApplied: false,
      clientInCents: 0,
      platformInCents: totalInCents,
      partnerInCents: 0,
      ambassadorInCents: 0,
      partnerEnabled: false,
      ambassadorEnabled: false,
    };
  }

  const partnerInCents = partnerEnabled ? roundCents((baseInCents * partnerFeePercentage) / 100) : 0;
  const ambassadorInCents = ambassadorEnabled ? roundCents((baseInCents * ambassadorFeePercentage) / 100) : 0;
  const platformCommercialPercentage = Math.max(
    networkFee - (partnerEnabled ? partnerFeePercentage : 0) - (ambassadorEnabled ? ambassadorFeePercentage : 0),
    0
  );
  const platformGrossPercentage = platformCommercialPercentage + processingFee;
  const platformInCents = roundCents((baseInCents * platformGrossPercentage) / 100);
  const clientInCents = Math.max(totalInCents - platformInCents - partnerInCents - ambassadorInCents, 0);

  return {
    splitApplied: true,
    clientInCents,
    platformInCents,
    partnerInCents,
    ambassadorInCents,
    partnerEnabled,
    ambassadorEnabled,
  };
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const method = (searchParams.get("method") ?? "all") as MethodFilter;
  const period = normalizePeriodFilter(searchParams.get("period"));
  const clientId = (searchParams.get("clientId") ?? "").trim();
  const partnerId = (searchParams.get("partnerId") ?? "").trim();
  const ambassadorId = (searchParams.get("ambassadorId") ?? "").trim();

  try {
    await reconcileRecentPendingOrders({
      throttleKey: "admin-financeiro",
      minIntervalMs: 15_000,
      take: 50,
    });
  } catch (error) {
    console.error("Falha ao reconciliar pedidos pendentes em admin/financeiro:", error);
  }

  const validMethod: MethodFilter = ["all", "card", "pix"].includes(method) ? method : "all";

  const paymentMethodFilter =
    validMethod === "card" ? cardPaymentMethodWhere() : validMethod === "pix" ? pixPaymentMethodWhere() : undefined;

  const relationFilters: any[] = [];
  if (clientId) relationFilters.push({ giftList: { userId: clientId } });
  if (partnerId) relationFilters.push({ giftList: { user: { referredByPartnerId: partnerId } } });
  if (ambassadorId) relationFilters.push({ giftList: { user: { referredByAmbassadorId: ambassadorId } } });

  const createdAtWhere = buildCreatedAtWhere(period);

  const orderWhere: any = {
    status: "PAID",
    ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
    ...(paymentMethodFilter || {}),
    ...(relationFilters.length ? { AND: relationFilters } : {}),
  };

  const cardLiquidationCutoff = new Date();
  cardLiquidationCutoff.setDate(cardLiquidationCutoff.getDate() - CARD_LIQUIDATION_WINDOW_DAYS);

  const pendingCardWhere: any = {
    AND: [
      ...(createdAtWhere ? [{ createdAt: createdAtWhere }] : []),
      cardPaymentMethodWhere(),
      {
        OR: [
          { status: { in: ["PENDING", "AUTHORIZED"] } },
          { status: "PAID", paidAt: { gte: cardLiquidationCutoff } },
        ],
      },
      ...(relationFilters.length ? relationFilters : []),
    ],
  };

  const [orders, pendingCardOrders, clients, partners, ambassadors] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        baseAmount: true,
        totalAmount: true,
        pagarmeOrderId: true,
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
                plan: true,
                planExpiresAt: true,
                acquisitionSource: true,
                recipient: { select: { pagarmeRecipientId: true } },
                referredByPartner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    recipient: { select: { pagarmeRecipientId: true } },
                  },
                },
                referredByAmbassador: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    recipient: { select: { pagarmeRecipientId: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: pendingCardWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        totalAmount: true,
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
              },
            },
          },
        },
      },
      take: 100,
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
      take: 300,
    }),
    prisma.user.findMany({
      where: { role: "PARTNER" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
      take: 300,
    }),
    prisma.user.findMany({
      where: { role: "AMBASSADOR" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
      take: 300,
    }),
  ]);

  let totalPaidAmount = 0;
  let totalClientReceived = 0;
  let totalPlatformReceived = 0;
  let totalLumieNetReceived = 0;
  let totalPagarmeReceived = 0;
  let totalPartnerReceived = 0;
  let totalAmbassadorReceived = 0;
  let cardAmount = 0;
  let pixAmount = 0;
  let cardCount = 0;
  let pixCount = 0;

  const partnerTotals = new Map<string, { id: string; name: string; email: string; amount: number; orders: number }>();
  const ambassadorTotals = new Map<
    string,
    { id: string; name: string; email: string; amount: number; orders: number }
  >();
  const clientTotals = new Map<string, { id: string; name: string; email: string; amount: number; orders: number }>();

  const normalizedOrders = await Promise.all(orders.map(async (order) => {
    const paymentMethod = normalizePaymentMethod(order.paymentMethod);
    const totalAmount = Number(order.totalAmount);
    const baseAmount = Number(order.baseAmount);
    const paymentMethodForSplit = paymentMethod === "card" ? "CREDIT_CARD" : "PIX";
    const user = order.giftList.user;

    const calculatedSplit = calculateSplitFromOrder({
      baseAmount,
      totalAmount,
      acquisitionSource: user.acquisitionSource,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      hasClientRecipient: isRealRecipientId(user.recipient?.pagarmeRecipientId),
      hasPartnerRecipient: isRealRecipientId(user.referredByPartner?.recipient?.pagarmeRecipientId),
      hasAmbassadorRecipient: isRealRecipientId(user.referredByAmbassador?.recipient?.pagarmeRecipientId),
      paymentMethod: paymentMethodForSplit,
    });

    let split = calculatedSplit;
    if (order.pagarmeOrderId) {
      try {
        const gatewayOrder = await getOrder(order.pagarmeOrderId);
        const gatewaySplit = extractGatewaySplitSnapshot(gatewayOrder);
        if (gatewaySplit) {
          split = gatewaySplit;
        }
      } catch (error) {
        console.error("Falha ao ler split real da Pagar.me para admin/financeiro:", {
          orderId: order.id,
          pagarmeOrderId: order.pagarmeOrderId,
          error,
        });
      }
    }

    const clientReceived = split.clientInCents / 100;
    const platformReceived = split.platformInCents / 100;
    const pagarmePercent = paymentMethod === "card" ? PAGARME_CARD_PERCENT : paymentMethod === "pix" ? PAGARME_PIX_PERCENT : 0;
    const pagarmeFee = totalAmount * (pagarmePercent / 100);
    const lumieNetReceived = Math.max(platformReceived - pagarmeFee, 0);
    const partnerReceived = split.partnerInCents / 100;
    const ambassadorReceived = split.ambassadorInCents / 100;

    totalPaidAmount += totalAmount;
    totalClientReceived += clientReceived;
    totalPlatformReceived += platformReceived;
    totalLumieNetReceived += lumieNetReceived;
    totalPagarmeReceived += pagarmeFee;
    totalPartnerReceived += partnerReceived;
    totalAmbassadorReceived += ambassadorReceived;

    if (paymentMethod === "card") {
      cardAmount += totalAmount;
      cardCount += 1;
    } else if (paymentMethod === "pix") {
      pixAmount += totalAmount;
      pixCount += 1;
    }

    const clientKey = user.id;
    const currentClient = clientTotals.get(clientKey) ?? {
      id: user.id,
      name: user.name || "Sem nome",
      email: user.email,
      amount: 0,
      orders: 0,
    };
    currentClient.amount += clientReceived;
    currentClient.orders += 1;
    clientTotals.set(clientKey, currentClient);

    if (user.referredByPartner && partnerReceived > 0) {
      const key = user.referredByPartner.id;
      const currentPartner = partnerTotals.get(key) ?? {
        id: key,
        name: user.referredByPartner.name || "Sem nome",
        email: user.referredByPartner.email,
        amount: 0,
        orders: 0,
      };
      currentPartner.amount += partnerReceived;
      currentPartner.orders += 1;
      partnerTotals.set(key, currentPartner);
    }

    if (user.referredByAmbassador && ambassadorReceived > 0) {
      const key = user.referredByAmbassador.id;
      const currentAmbassador = ambassadorTotals.get(key) ?? {
        id: key,
        name: user.referredByAmbassador.name || "Sem nome",
        email: user.referredByAmbassador.email,
        amount: 0,
        orders: 0,
      };
      currentAmbassador.amount += ambassadorReceived;
      currentAmbassador.orders += 1;
      ambassadorTotals.set(key, currentAmbassador);
    }

    return {
      id: order.id,
      paymentMethod,
      totalAmount,
      baseAmount,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      giftList: {
        id: order.giftList.id,
        title: order.giftList.title,
        slug: order.giftList.slug,
      },
      client: {
        id: user.id,
        name: user.name || "Sem nome",
        email: user.email,
      },
      partner: user.referredByPartner
        ? {
            id: user.referredByPartner.id,
            name: user.referredByPartner.name || "Sem nome",
            email: user.referredByPartner.email,
          }
        : null,
      ambassador: user.referredByAmbassador
        ? {
            id: user.referredByAmbassador.id,
            name: user.referredByAmbassador.name || "Sem nome",
            email: user.referredByAmbassador.email,
          }
        : null,
      splitApplied: split.splitApplied,
      split: {
        clientReceived,
        platformReceived,
        lumieNetReceived,
        pagarmeFee,
        partnerReceived,
        ambassadorReceived,
      },
    };
  }));

  const pendingCardAmount = pendingCardOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const normalizedPendingCards = pendingCardOrders.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    giftList: {
      id: order.giftList.id,
      title: order.giftList.title,
      slug: order.giftList.slug,
    },
    client: {
      id: order.giftList.user.id,
      name: order.giftList.user.name || "Sem nome",
      email: order.giftList.user.email,
    },
  }));

  const sortByAmountDesc = <T extends { amount: number }>(a: T, b: T) => b.amount - a.amount;

  return NextResponse.json({
    filters: {
      period,
      method: validMethod,
      clientId: clientId || null,
      partnerId: partnerId || null,
      ambassadorId: ambassadorId || null,
    },
    options: {
      clients,
      partners,
      ambassadors,
    },
    summary: {
      ordersCount: normalizedOrders.length,
      totalPaidAmount,
      totalClientReceived,
      totalPlatformReceived,
      totalLumieNetReceived,
      totalPagarmeReceived,
      totalPartnerReceived,
      totalAmbassadorReceived,
      cardAmount,
      cardCount,
      pixAmount,
      pixCount,
      pendingCardCount: pendingCardOrders.length,
      pendingCardAmount,
    },
    breakdown: {
      clients: Array.from(clientTotals.values()).sort(sortByAmountDesc).slice(0, 30),
      partners: Array.from(partnerTotals.values()).sort(sortByAmountDesc).slice(0, 30),
      ambassadors: Array.from(ambassadorTotals.values()).sort(sortByAmountDesc).slice(0, 30),
    },
    pendingCards: normalizedPendingCards,
    orders: normalizedOrders.slice(0, 200),
  });
}
