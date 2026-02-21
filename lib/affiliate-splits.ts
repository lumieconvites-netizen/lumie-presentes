const CARD_METHODS = ["credit_card", "CREDIT_CARD", "card", "CARD"];
const PIX_METHODS = ["pix", "PIX"];

export function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith("pending_");
}

export function normalizePaymentMethod(value?: string | null): "card" | "pix" | "other" {
  const method = String(value ?? "").toLowerCase();
  if (method.includes("credit") || method.includes("card")) return "card";
  if (method.includes("pix")) return "pix";
  return "other";
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

function resolveFeePercentages(paymentMethod: "PIX" | "CREDIT_CARD") {
  const defaultNetworkFee = readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE", 10.9);
  const networkFee =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE_CREDIT_CARD", defaultNetworkFee)
      : readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE_PIX", defaultNetworkFee);

  const defaultProcessingFee = readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE", 1.09);
  const processingFee =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_CREDIT_CARD", defaultProcessingFee)
      : readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_PIX", defaultProcessingFee);

  return { networkFee, processingFee };
}

export function calculateSplitFromOrder(params: {
  baseAmount: number;
  totalAmount: number;
  acquisitionSource: string;
  hasClientRecipient: boolean;
  hasPartnerRecipient: boolean;
  hasAmbassadorRecipient: boolean;
  paymentMethod: "PIX" | "CREDIT_CARD";
}) {
  const { networkFee, processingFee } = resolveFeePercentages(params.paymentMethod);
  const partnerFeePercentage = readPercent("PARTNER_COMMISSION_PERCENTAGE", 2);
  const ambassadorFeePercentage = readPercent("AMBASSADOR_COMMISSION_PERCENTAGE", 3);

  const baseInCents = roundCents(params.baseAmount * 100);
  const totalInCents = roundCents(params.totalAmount * 100);

  const partnerEnabled =
    params.hasPartnerRecipient &&
    ["PARTNER_DIRECT", "PARTNER_WITH_AMBASSADOR"].includes(params.acquisitionSource);
  const ambassadorEnabled =
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
  };
}

export function cardPaymentMethodWhere() {
  return {
    OR: [
      { paymentMethod: { in: CARD_METHODS } },
      { paymentMethod: { contains: "credit", mode: "insensitive" as const } },
      { paymentMethod: { contains: "card", mode: "insensitive" as const } },
      { paymentMethod: { contains: "cartao", mode: "insensitive" as const } },
    ],
  };
}

export function pixPaymentMethodWhere() {
  return {
    OR: [
      { paymentMethod: { in: PIX_METHODS } },
      { paymentMethod: { contains: "pix", mode: "insensitive" as const } },
    ],
  };
}

