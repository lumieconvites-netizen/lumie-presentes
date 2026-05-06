import { type SubscriptionPlan } from '@/lib/plans';

function readInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export const LUMIE_EXCLUSIVE_PRICE_CENTS = readInt('LUMIE_EXCLUSIVE_PRICE_CENTS', 15000);
export const LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS = readInt(
  'LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS',
  1000
);
export const LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS = readInt(
  'LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS',
  500
);
export const LUMIE_EXCLUSIVE_DURATION_DAYS = readInt('LUMIE_EXCLUSIVE_DURATION_DAYS', 365);

export function formatPlanPriceInReais(cents: number) {
  return cents / 100;
}

export function computePremiumExpiration(currentPlanExpiresAt?: Date | string | null) {
  const now = new Date();
  const current =
    currentPlanExpiresAt instanceof Date
      ? currentPlanExpiresAt
      : currentPlanExpiresAt
        ? new Date(currentPlanExpiresAt)
        : null;
  const base =
    current && Number.isFinite(current.getTime()) && current.getTime() > now.getTime()
      ? current
      : now;

  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + LUMIE_EXCLUSIVE_DURATION_DAYS);
  return expiresAt;
}

export function toPlanPurchaseStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'paid' || value === 'authorized') return 'PAID' as const;
  if (value === 'refunded') return 'REFUNDED' as const;
  if (value === 'chargeback') return 'CHARGEBACK' as const;
  if (value === 'failed' || value === 'canceled' || value === 'cancelled') return 'REFUSED' as const;
  return 'PENDING' as const;
}

export function buildExclusivePlanLabel(plan: SubscriptionPlan = 'PREMIUM') {
  return plan === 'PREMIUM' ? 'Lumie Exclusive' : 'Plano';
}
