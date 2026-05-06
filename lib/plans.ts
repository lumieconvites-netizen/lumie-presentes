export type SubscriptionPlan = "FREE" | "PREMIUM";
export type PaymentMethodForFees = "PIX" | "CREDIT_CARD";

type PlanLike = {
  plan?: SubscriptionPlan | string | null;
  planExpiresAt?: Date | string | null;
};

function readPercent(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function isExpired(value?: Date | string | null) {
  if (!value) return false;
  const expiresAt = value instanceof Date ? value : new Date(value);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now();
}

export function resolveEffectivePlan(user?: PlanLike | null): SubscriptionPlan {
  if (!user || user.plan !== "PREMIUM") return "FREE";
  return isExpired(user.planExpiresAt) ? "FREE" : "PREMIUM";
}

export function resolvePlatformFeePercent(paymentMethod: PaymentMethodForFees, plan: SubscriptionPlan) {
  const defaultFree = readPercent("PLATFORM_FEE_PERCENTAGE", 6.99);
  const free =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PLATFORM_FEE_PERCENTAGE_CREDIT_CARD", defaultFree)
      : readPercent("PLATFORM_FEE_PERCENTAGE_PIX", defaultFree);

  if (plan !== "PREMIUM") return free;

  const defaultPremium = readPercent("PREMIUM_PLATFORM_FEE_PERCENTAGE", 3.69);
  return paymentMethod === "CREDIT_CARD"
    ? readPercent("PREMIUM_PLATFORM_FEE_PERCENTAGE_CREDIT_CARD", defaultPremium)
    : readPercent("PREMIUM_PLATFORM_FEE_PERCENTAGE_PIX", defaultPremium);
}

export function resolveNetworkFeePercent(paymentMethod: PaymentMethodForFees, plan: SubscriptionPlan) {
  const platformFee = resolvePlatformFeePercent(paymentMethod, plan);
  const defaultProcessing = readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE", 1.09);
  const processing =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_CREDIT_CARD", defaultProcessing)
      : readPercent("PAGARME_PROCESSING_FEE_PERCENTAGE_PIX", defaultProcessing);
  const defaultCommercialFee = Math.max(platformFee - processing, 0);
  const defaultFree = readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE", defaultCommercialFee);
  const free =
    paymentMethod === "CREDIT_CARD"
      ? readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE_CREDIT_CARD", defaultFree)
      : readPercent("PLATFORM_NETWORK_FEE_PERCENTAGE_PIX", defaultFree);

  if (plan !== "PREMIUM") return free;

  const defaultPremium = readPercent("PREMIUM_PLATFORM_NETWORK_FEE_PERCENTAGE", defaultCommercialFee);
  return paymentMethod === "CREDIT_CARD"
    ? readPercent("PREMIUM_PLATFORM_NETWORK_FEE_PERCENTAGE_CREDIT_CARD", defaultPremium)
    : readPercent("PREMIUM_PLATFORM_NETWORK_FEE_PERCENTAGE_PIX", defaultPremium);
}
