import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTotal } from '@/lib/utils';
import { createCreditCardOrder, createPixOrder, getOrder } from '@/lib/pagarme';
import { z } from 'zod';
import crypto from 'crypto';
import { enforceRateLimit, getRequestIp } from '@/lib/rate-limit';
import {
  blockIpPermanently,
  blockIpTemporarily,
  getBlockedIpMessage,
  isBlockedIp,
  registerIpBlockStrike,
} from '@/lib/ip-guard';
import { logSecurityEvent } from '@/lib/security-events';
import { reconcilePendingOrdersForGiftList } from '@/lib/order-status-reconciliation';
import { getEffectiveAvailabilityForGift } from '@/lib/gift-availability';
import {
  resolveEffectivePlan,
  resolveNetworkFeePercent,
  resolvePlatformFeePercent,
  type SubscriptionPlan,
} from '@/lib/plans';

const orderSchema = z.object({
  giftId: z.string(),
  giftListId: z.string(),
  guestName: z.string().min(2, 'Nome invalido'),
  guestEmail: z.string().email('Email invalido'),
  guestDocument: z.string().optional(),
  guestPhoneArea: z.string().optional(),
  guestPhoneNumber: z.string().optional(),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD']).optional().default('PIX'),
  card: z
    .object({
      number: z.string().min(12),
      holderName: z.string().min(2),
      expMonth: z.string().min(1),
      expYear: z.string().min(2),
      cvv: z.string().min(3),
      installments: z.number().int().min(1).max(12).optional(),
    })
    .optional(),
  billingAddress: z
    .object({
      zipCode: z.string().min(8),
      street: z.string().min(2),
      number: z.string().min(1),
      neighborhood: z.string().min(2),
      complement: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2).max(2),
    })
    .optional(),
  quantity: z.number().int().positive(),
  message: z.string().optional(),
  signature: z.string().optional(),
});

const GIFT_CHECKOUT_IP_RATE_LIMIT = 10;
const GIFT_CHECKOUT_EMAIL_RATE_LIMIT = 5;
const GIFT_CHECKOUT_CPF_RATE_LIMIT = 5;
const GIFT_CHECKOUT_CPF_RATE_WINDOW = '10 m';
const GIFT_CHECKOUT_DIFFERENT_CARD_LIMIT = 3;
const GIFT_CHECKOUT_DIFFERENT_CARD_WINDOW_MINUTES = 60;
const GIFT_CHECKOUT_IP_REFUSED_LIMIT = 3;
const GIFT_CHECKOUT_IP_REFUSED_WINDOW_MINUTES = 60;
const GIFT_CHECKOUT_TEMP_BLOCK_SECONDS = 60 * 60;
const GIFT_CHECKOUT_BLOCKING_EVENT_TYPES = [
  'GIFT_CHECKOUT_REFUSED',
  'GIFT_CHECKOUT_GATEWAY_ERROR',
] as const;

function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function buildCardFingerprint(cardNumber: string) {
  const secret = process.env.CHECKOUT_CARD_FINGERPRINT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  const key = secret || 'lumie-card-fingerprint-fallback';
  return crypto.createHmac('sha256', key).update(cardNumber).digest('hex');
}

async function hasTooManyDifferentCards(params: {
  guestEmail: string | null;
  guestDocument: string;
  cardFingerprint: string;
}) {
  const cutoff = minutesAgo(GIFT_CHECKOUT_DIFFERENT_CARD_WINDOW_MINUTES);
  const identityFilters = [
    params.guestEmail ? { guestEmail: params.guestEmail } : null,
    params.guestDocument ? { guestDocument: params.guestDocument } : null,
  ].filter(Boolean) as Array<{ guestEmail: string } | { guestDocument: string }>;

  if (!identityFilters.length) return { blocked: false, differentCards: 0 };

  const recentCards = await prisma.checkoutCardAttempt.findMany({
    where: {
      OR: identityFilters,
      createdAt: { gte: cutoff },
    },
    distinct: ['cardFingerprint'],
    select: { cardFingerprint: true },
  });

  const fingerprints = new Set(recentCards.map((entry) => entry.cardFingerprint));
  const isNewCard = !fingerprints.has(params.cardFingerprint);
  const differentCards = fingerprints.size + (isNewCard ? 1 : 0);

  return {
    blocked: isNewCard && fingerprints.size >= GIFT_CHECKOUT_DIFFERENT_CARD_LIMIT,
    differentCards,
  };
}

function isValidCpf(cpf: string) {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (const n of base) {
      total += Number(n) * factor--;
    }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

function isRealRecipientId(value?: string | null) {
  if (!value) return false;
  return !value.startsWith('pending_');
}

function isActiveRecipient(recipient?: { pagarmeRecipientId?: string | null; status?: string | null } | null) {
  return isRealRecipientId(recipient?.pagarmeRecipientId) && String(recipient?.status ?? '').toLowerCase() === 'active';
}

function findGatewayRecipientIds(message: string) {
  return Array.from(new Set(message.match(/re_[a-z0-9]+/gi) ?? []));
}

function isRecipientCannotTransactError(message: string) {
  return /recipient.+cannot transact/i.test(message) || /cannot transact/i.test(message);
}

async function markRecipientsRefusedFromGatewayMessage(message: string) {
  if (!isRecipientCannotTransactError(message)) return;

  const recipientIds = findGatewayRecipientIds(message);
  if (!recipientIds.length) return;

  await prisma.recipient.updateMany({
    where: { pagarmeRecipientId: { in: recipientIds } },
    data: { status: 'refused', statusFinalizedAt: new Date() },
  });
}

function readPercent(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function resolveFeePercentages(paymentMethod: 'PIX' | 'CREDIT_CARD', plan: SubscriptionPlan) {
  const platformFee = resolvePlatformFeePercent(paymentMethod, plan);
  const networkFee = resolveNetworkFeePercent(paymentMethod, plan);
  const defaultProcessingFee = paymentMethod === 'CREDIT_CARD' ? 3.29 : 1.09;
  const processingFee =
    paymentMethod === 'CREDIT_CARD'
      ? readPercent('PAGARME_PROCESSING_FEE_PERCENTAGE_CREDIT_CARD', defaultProcessingFee)
      : readPercent('PAGARME_PROCESSING_FEE_PERCENTAGE_PIX', defaultProcessingFee);

  return { platformFee, networkFee, processingFee };
}

function roundCents(value: number) {
  return Math.round(value);
}

function looksLikeSuccessReason(reason?: string | null) {
  if (!reason) return false;
  return /(aprovad|approved|sucesso|capturad|captured)/i.test(reason);
}

function isApprovalLikeStatus(status?: string | null) {
  const value = String(status ?? "").toLowerCase();
  return value === "paid" || value === "authorized" || value === "captured";
}

function isInvalidRequestError(error: any) {
  const raw = String(error?.message ?? "");
  return /Pagar\.me error 400/i.test(raw) && /request is invalid/i.test(raw);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function minutesAgo(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
}

function sanitizeGatewayErrorDetails(input: unknown) {
  const message = String(input ?? '').trim();
  if (!message) return 'Falha temporaria ao comunicar com o gateway.';

  if (/backend\.max_conn reached/i.test(message)) {
    return 'Gateway temporariamente sobrecarregado. Tente novamente em alguns segundos.';
  }

  if (/<html|<!doctype|<\?xml/i.test(message)) {
    return 'Gateway temporariamente indisponivel. Tente novamente em alguns segundos.';
  }

  return message.length > 220 ? `${message.slice(0, 217)}...` : message;
}

function normalizeBillingAddress(address?: z.infer<typeof orderSchema>['billingAddress']) {
  if (!address) return null;

  const zipCode = onlyDigits(address.zipCode);
  const state = address.state.trim().toUpperCase();
  const street = address.street.trim();
  const number = address.number.trim();
  const neighborhood = address.neighborhood.trim();
  const complement = address.complement?.trim() || null;
  const city = address.city.trim();

  if (zipCode.length !== 8) return null;
  if (!street || !number || !neighborhood || !city || state.length !== 2) return null;

  return {
    line1: `${number}, ${street}, ${neighborhood}`.slice(0, 256),
    line2: complement ? complement.slice(0, 128) : null,
    zipCode,
    city: city.slice(0, 64),
    state,
    country: 'BR',
  };
}

function calculateCommissionSplit(params: {
  baseAmount: number;
  totalAmount: number;
  acquisitionSource: string;
  feeMode: 'PASS_TO_GUEST' | 'ABSORB';
  hasPartnerRecipient: boolean;
  hasAmbassadorRecipient: boolean;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  plan: SubscriptionPlan;
}) {
  const { processingFee: processingFeePercentage, networkFee: networkFeePercentage } = resolveFeePercentages(params.paymentMethod, params.plan);
  const partnerFeePercentage = readPercent('PARTNER_COMMISSION_PERCENTAGE', 1.5);
  const ambassadorFeePercentage = readPercent('AMBASSADOR_COMMISSION_PERCENTAGE', 2.5);

  const baseInCents = roundCents(params.baseAmount * 100);
  const totalInCents = roundCents(params.totalAmount * 100);

  const allowAffiliateCommission = params.plan === 'FREE';
  const enablePartner =
    allowAffiliateCommission &&
    params.hasPartnerRecipient &&
    ['PARTNER_DIRECT', 'PARTNER_WITH_AMBASSADOR'].includes(params.acquisitionSource);
  const enableAmbassador =
    allowAffiliateCommission &&
    params.hasAmbassadorRecipient &&
    ['AMBASSADOR_DIRECT', 'PARTNER_WITH_AMBASSADOR'].includes(params.acquisitionSource);

  const partnerInCents = enablePartner ? roundCents((baseInCents * partnerFeePercentage) / 100) : 0;
  const ambassadorInCents = enableAmbassador ? roundCents((baseInCents * ambassadorFeePercentage) / 100) : 0;
  const platformCommercialPercentage = Math.max(networkFeePercentage - (enablePartner ? partnerFeePercentage : 0) - (enableAmbassador ? ambassadorFeePercentage : 0), 0);
  const platformGrossPercentage = platformCommercialPercentage + processingFeePercentage;
  let platformInCents = roundCents((baseInCents * platformGrossPercentage) / 100);
  let clientInCents = Math.max(totalInCents - platformInCents - partnerInCents - ambassadorInCents, 0);

  if (params.feeMode === 'PASS_TO_GUEST') {
    platformInCents = Math.max(totalInCents - baseInCents - partnerInCents - ambassadorInCents, 0);
    clientInCents = Math.max(totalInCents - platformInCents - partnerInCents - ambassadorInCents, 0);
  }

  return {
    totalInCents,
    clientInCents,
    platformInCents,
    partnerInCents,
    ambassadorInCents,
    splitProfile: {
      paymentMethod: params.paymentMethod,
      source: params.acquisitionSource,
      partnerEnabled: enablePartner,
      ambassadorEnabled: enableAmbassador,
      processingFeePercentage,
      networkFeePercentage,
      platformCommercialPercentage,
      platformGrossPercentage,
      partnerFeePercentage,
      ambassadorFeePercentage,
    },
  };
}

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    if (isBlockedIp(ip)) {
      return NextResponse.json({ error: getBlockedIpMessage() }, { status: 403 });
    }

    const ipRate = await enforceRateLimit({
      key: `checkout:orders:ip:${ip}`,
      requests: GIFT_CHECKOUT_IP_RATE_LIMIT,
      window: "5 m",
    });
    if (!ipRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas de pagamento. Aguarde alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const data = orderSchema.parse(body);

    await reconcilePendingOrdersForGiftList(data.giftListId, {
      minIntervalMs: 15000,
      throttleKey: `checkout-order:${data.giftListId}`,
    });

    const normalizedGuestEmail = normalizeEmail(data.guestEmail);
    const guestDocument = onlyDigits(data.guestDocument);
    const guestArea = onlyDigits(data.guestPhoneArea);
    const guestNumber = onlyDigits(data.guestPhoneNumber);

    const emailRate = await enforceRateLimit({
      key: `checkout:orders:email:${normalizedGuestEmail}`,
      requests: GIFT_CHECKOUT_EMAIL_RATE_LIMIT,
      window: "5 m",
    });
    if (!emailRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas para este email. Aguarde alguns minutos." }, { status: 429 });
    }

    if (!guestDocument || !isValidCpf(guestDocument)) {
      return NextResponse.json({ error: 'CPF invalido' }, { status: 400 });
    }

    const cpfRate = await enforceRateLimit({
      key: `checkout:orders:cpf:${guestDocument}`,
      requests: GIFT_CHECKOUT_CPF_RATE_LIMIT,
      window: GIFT_CHECKOUT_CPF_RATE_WINDOW,
    });
    if (!cpfRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas para este CPF. Aguarde alguns minutos." }, { status: 429 });
    }

    if (!guestArea || guestArea.length !== 2 || !guestNumber || guestNumber.length < 9) {
      return NextResponse.json(
        { error: 'Telefone invalido. Use DDD + celular com 9 digitos (ex: 11988887777).' },
        { status: 400 }
      );
    }

    if (data.paymentMethod === 'CREDIT_CARD') {
      const cardNumber = onlyDigits(data.card?.number);
      const expMonth = onlyDigits(data.card?.expMonth);
      const expYear = onlyDigits(data.card?.expYear);
      const cvv = onlyDigits(data.card?.cvv);
      const holderName = (data.card?.holderName ?? '').trim();

      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        return NextResponse.json({ error: 'Numero do cartao invalido.' }, { status: 400 });
      }
      if (!holderName || holderName.length < 2) {
        return NextResponse.json({ error: 'Nome do titular invalido.' }, { status: 400 });
      }
      if (!expMonth || Number(expMonth) < 1 || Number(expMonth) > 12) {
        return NextResponse.json({ error: 'Mes de validade invalido.' }, { status: 400 });
      }
      if (!expYear || expYear.length < 2) {
        return NextResponse.json({ error: 'Ano de validade invalido.' }, { status: 400 });
      }
      if (!cvv || cvv.length < 3 || cvv.length > 4) {
        return NextResponse.json({ error: 'CVV invalido.' }, { status: 400 });
      }

      const billingAddress = normalizeBillingAddress(data.billingAddress);
      if (!billingAddress) {
        return NextResponse.json({ error: 'Endereço de cobrança do cartão inválido.' }, { status: 400 });
      }

      const cardFingerprint = buildCardFingerprint(cardNumber);
      const differentCards = await hasTooManyDifferentCards({
        guestEmail: normalizedGuestEmail,
        guestDocument,
        cardFingerprint,
      });

      if (differentCards.blocked) {
        await prisma.checkoutCardAttempt.create({
          data: {
            giftListId: data.giftListId,
            guestEmail: normalizedGuestEmail,
            guestDocument,
            ip,
            cardFingerprint,
            status: 'BLOCKED_DIFFERENT_CARDS',
          },
        });

        await logSecurityEvent({
          type: 'GIFT_CHECKOUT_DIFFERENT_CARDS_BLOCKED',
          email: normalizedGuestEmail,
          request,
          route: '/api/orders',
          metadata: {
            ip,
            giftListId: data.giftListId,
            giftId: data.giftId,
            differentCards: differentCards.differentCards,
            limit: GIFT_CHECKOUT_DIFFERENT_CARD_LIMIT,
            windowMinutes: GIFT_CHECKOUT_DIFFERENT_CARD_WINDOW_MINUTES,
          },
        });

        return NextResponse.json(
          { error: "Muitas tentativas com cartões diferentes. Aguarde antes de tentar novamente." },
          { status: 429 }
        );
      }

      const recentIpRefusedAttempts = await prisma.securityEvent.count({
        where: {
          ip,
          type: { in: [...GIFT_CHECKOUT_BLOCKING_EVENT_TYPES] },
          createdAt: { gte: minutesAgo(GIFT_CHECKOUT_IP_REFUSED_WINDOW_MINUTES) },
        },
      });

      if (recentIpRefusedAttempts >= GIFT_CHECKOUT_IP_REFUSED_LIMIT) {
        const strikes = await registerIpBlockStrike(ip);
        const permanent = strikes >= 2;
        if (permanent) {
          await blockIpPermanently(ip);
        } else {
          await blockIpTemporarily(ip, GIFT_CHECKOUT_TEMP_BLOCK_SECONDS);
        }

        await logSecurityEvent({
          type: permanent ? 'GIFT_CHECKOUT_IP_PERMANENT_BLOCKED' : 'GIFT_CHECKOUT_IP_TEMP_BLOCKED',
          email: data.guestEmail,
          request,
          route: '/api/orders',
          metadata: {
            ip,
            strikes,
            paymentMethod: data.paymentMethod,
            recentIpRefusedAttempts,
            windowMinutes: GIFT_CHECKOUT_IP_REFUSED_WINDOW_MINUTES,
            ttlSeconds: permanent ? null : GIFT_CHECKOUT_TEMP_BLOCK_SECONDS,
          },
        });

        return NextResponse.json({ error: getBlockedIpMessage() }, { status: 429 });
      }
    }

    const gift = await prisma.giftItem.findFirst({
      where: {
        id: data.giftId,
        giftListId: data.giftListId,
        isActive: true,
      },
      include: {
        giftList: {
          select: {
            id: true,
            feeMode: true,
            allowMessages: true,
            user: {
              select: {
                acquisitionSource: true,
                plan: true,
                planExpiresAt: true,
                recipient: true,
                referredByPartner: {
                  include: {
                    recipient: true,
                  },
                },
                referredByAmbassador: {
                  include: {
                    recipient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Presente nao encontrado' }, { status: 404 });
    }

    const effectiveAvailability = await getEffectiveAvailabilityForGift(gift.id, gift.totalQuantity);
    if (effectiveAvailability < data.quantity) {
      return NextResponse.json({ error: `Quantidade indisponivel. Maximo: ${effectiveAvailability}` }, { status: 400 });
    }

    const baseAmount = Number(gift.basePrice) * data.quantity;
    const effectivePlan = resolveEffectivePlan(gift.giftList.user);
    const { platformFee: platformFeePercentage } = resolveFeePercentages(data.paymentMethod, effectivePlan);
    const calculation = calculateTotal(baseAmount, gift.giftList.feeMode, platformFeePercentage);

    const order = await prisma.order.create({
      data: {
        giftListId: data.giftListId,
        giftItemId: data.giftId,
        guestName: data.guestName,
        guestEmail: normalizedGuestEmail,
        quantity: data.quantity,
        baseAmount: calculation.baseAmount,
        feeAmount: calculation.feeAmount,
        totalAmount: calculation.totalAmount,
        status: 'PENDING',
        paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
      },
    });

    if (data.paymentMethod === 'CREDIT_CARD') {
      await prisma.checkoutCardAttempt.create({
        data: {
          orderId: order.id,
          giftListId: data.giftListId,
          guestEmail: normalizedGuestEmail,
          guestDocument,
          ip,
          cardFingerprint: buildCardFingerprint(onlyDigits(data.card?.number)),
          status: 'PENDING',
        },
      });
    }

    if (data.message && gift.giftList.allowMessages) {
      await prisma.message.create({
        data: {
          orderId: order.id,
          giftListId: data.giftListId,
          guestName: data.guestName,
          content: data.message,
          signature: data.signature,
          // Recado so fica publico apos confirmacao real do pagamento (webhook)
          isPublic: false,
        },
      });
    }

    const canUsePagarme = Boolean(process.env.PAGARME_SECRET_KEY);

    if (canUsePagarme) {
      try {
        const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
        const clientRecipient = gift.giftList.user.recipient;
        const partnerRecipient = gift.giftList.user.referredByPartner?.recipient;
        const ambassadorRecipient = gift.giftList.user.referredByAmbassador?.recipient;
        const clientRecipientId = clientRecipient?.pagarmeRecipientId;

        const partnerRecipientId = partnerRecipient?.pagarmeRecipientId;
        const ambassadorRecipientId = ambassadorRecipient?.pagarmeRecipientId;

        if (!isActiveRecipient(clientRecipient)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'REFUSED' },
          });
          if (data.paymentMethod === 'CREDIT_CARD') {
            await prisma.checkoutCardAttempt.updateMany({
              where: { orderId: order.id },
              data: { status: 'REFUSED_RECIPIENT' },
            });
          }

          return NextResponse.json(
            {
              error: 'A conta bancária da anfitriã ainda não está aprovada para receber pagamentos.',
              details: 'Oriente a anfitriã a revisar e salvar os dados bancários antes de tentar novamente.',
              orderId: order.id,
              recipientStatus: clientRecipient?.status ?? null,
            },
            { status: 400 }
          );
        }

        const splitAmounts = calculateCommissionSplit({
          baseAmount: calculation.baseAmount,
          totalAmount: calculation.totalAmount,
          acquisitionSource: gift.giftList.user.acquisitionSource,
          feeMode: gift.giftList.feeMode,
          hasPartnerRecipient: isActiveRecipient(partnerRecipient),
          hasAmbassadorRecipient: isActiveRecipient(ambassadorRecipient),
          paymentMethod: data.paymentMethod,
          plan: effectivePlan,
        });

        const splitRules =
          platformRecipientId &&
          isRealRecipientId(clientRecipientId) &&
          splitAmounts.totalInCents > 0 &&
          splitAmounts.clientInCents >= 0
            ? [
                { recipientId: clientRecipientId as string, amountInCents: splitAmounts.clientInCents },
                ...(splitAmounts.partnerInCents > 0 && isActiveRecipient(partnerRecipient)
                  ? [{ recipientId: partnerRecipientId as string, amountInCents: splitAmounts.partnerInCents }]
                  : []),
                ...(splitAmounts.ambassadorInCents > 0 && isActiveRecipient(ambassadorRecipient)
                  ? [{ recipientId: ambassadorRecipientId as string, amountInCents: splitAmounts.ambassadorInCents }]
                  : []),
                { recipientId: platformRecipientId, amountInCents: splitAmounts.platformInCents },
              ]
            : undefined;

        const splitReason = splitRules
          ? 'ok'
          : !platformRecipientId
            ? 'missing_platform_recipient'
            : !isRealRecipientId(clientRecipientId)
              ? 'missing_client_recipient'
              : 'invalid_split_amount';

        const commonPayload = {
          amountInCents: splitAmounts.totalInCents,
          itemTitle: gift.name,
          quantity: data.quantity,
          splitRules,
          customer: {
            name: data.guestName,
            email: normalizedGuestEmail ?? data.guestEmail,
            document: guestDocument,
            areaCode: guestArea,
            number: guestNumber,
          },
          metadata: {
            localOrderId: order.id,
            giftListId: data.giftListId,
            giftId: data.giftId,
            paymentMethod: data.paymentMethod,
            splitApplied: Boolean(splitRules?.length),
            splitReason,
            platformRecipientId: platformRecipientId ?? null,
            clientRecipientId: clientRecipientId ?? null,
            partnerRecipientId: partnerRecipientId ?? null,
            ambassadorRecipientId: ambassadorRecipientId ?? null,
            splitSource: splitAmounts.splitProfile.source,
            splitPartnerEnabled: splitAmounts.splitProfile.partnerEnabled,
            splitAmbassadorEnabled: splitAmounts.splitProfile.ambassadorEnabled,
            splitPlatformGrossPercentage: splitAmounts.splitProfile.platformGrossPercentage,
            subscriptionPlan: effectivePlan,
            splitPartnerFeePercentage: splitAmounts.splitProfile.partnerFeePercentage,
            splitAmbassadorFeePercentage: splitAmounts.splitProfile.ambassadorFeePercentage,
            splitTotalInCents: splitAmounts.totalInCents,
            splitClientInCents: splitAmounts.clientInCents,
            splitPlatformInCents: splitAmounts.platformInCents,
            splitPartnerInCents: splitAmounts.partnerInCents,
            splitAmbassadorInCents: splitAmounts.ambassadorInCents,
          },
        };

        const createGatewayOrder = (payload: typeof commonPayload) => {
          if (data.paymentMethod === 'CREDIT_CARD') {
            return createCreditCardOrder({
              ...payload,
              card: {
                number: onlyDigits(data.card?.number),
                holderName: (data.card?.holderName ?? '').trim(),
                expMonth: String(Number(onlyDigits(data.card?.expMonth))).padStart(2, '0'),
                expYear: (() => {
                  const year = onlyDigits(data.card?.expYear);
                  return year.length === 2 ? `20${year}` : year;
                })(),
                cvv: onlyDigits(data.card?.cvv),
              },
              installments: data.card?.installments ?? 1,
              billingAddress: normalizeBillingAddress(data.billingAddress) ?? undefined,
            });
          }

          return createPixOrder(payload);
        };

        let effectiveSplitApplied = Boolean(splitRules?.length);
        let effectiveSplitReason = splitReason;

        let pagarmeOrder: any;
        try {
          pagarmeOrder = await createGatewayOrder(commonPayload);
        } catch (firstGatewayError: any) {
          const shouldRetryWithoutSplit = Boolean(splitRules?.length) && isInvalidRequestError(firstGatewayError);
          if (!shouldRetryWithoutSplit) {
            throw firstGatewayError;
          }

          const fallbackPayload = {
            ...commonPayload,
            splitRules: undefined,
            metadata: {
              ...commonPayload.metadata,
              splitApplied: false,
              splitReason: 'split_invalid_fallback',
            },
          };

          pagarmeOrder = await createGatewayOrder(fallbackPayload);
          effectiveSplitApplied = false;
          effectiveSplitReason = 'split_invalid_fallback';
        }

        let latestOrder = pagarmeOrder;
        let charge = latestOrder?.charges?.[0];
        let transaction = charge?.last_transaction;
        let chargeStatus = String(charge?.status ?? '').toLowerCase();
        let transactionStatus = String(transaction?.status ?? '').toLowerCase();
        let isFailed =
          chargeStatus === 'failed' ||
          chargeStatus === 'canceled' ||
          chargeStatus === 'refused' ||
          transactionStatus === 'failed' ||
          transactionStatus === 'canceled' ||
          transactionStatus === 'refused' ||
          transactionStatus === 'not_authorized';

        const hasSuspiciousSuccessSignals =
          looksLikeSuccessReason(transaction?.acquirer_message) ||
          String(transaction?.acquirer_return_code ?? '') === '0000';

        if (isFailed && hasSuspiciousSuccessSignals && latestOrder?.id) {
          // Evita falso negativo em respostas transientes do gateway.
          for (let attempt = 0; attempt < 2; attempt += 1) {
            await wait(1200);
            const refreshedOrder = await getOrder(String(latestOrder.id));
            latestOrder = refreshedOrder;
            charge = refreshedOrder?.charges?.[0];
            transaction = charge?.last_transaction;
            chargeStatus = String(charge?.status ?? '').toLowerCase();
            transactionStatus = String(transaction?.status ?? '').toLowerCase();
            isFailed =
              chargeStatus === 'failed' ||
              chargeStatus === 'canceled' ||
              chargeStatus === 'refused' ||
              transactionStatus === 'failed' ||
              transactionStatus === 'canceled' ||
              transactionStatus === 'refused' ||
              transactionStatus === 'not_authorized';
            if (!isFailed) break;
          }
        }

        const failureReasons = [
          transaction?.status_reason,
          transaction?.gateway_response?.errors?.[0]?.message,
          transaction?.acquirer_message,
          charge?.last_transaction?.status_reason,
        ].filter((value): value is string => Boolean(value && String(value).trim()));

        const nonSuccessReasons = failureReasons.filter((reason) => !looksLikeSuccessReason(reason));
        const firstGatewayReason = failureReasons[0] ?? null;

        const failReason =
          nonSuccessReasons[0] ||
          `Pagamento recusado pelo gateway (charge=${chargeStatus || 'unknown'}, transaction=${transactionStatus || 'unknown'})`;

        const approvedNow =
          !isFailed &&
          (isApprovalLikeStatus(charge?.status) ||
            isApprovalLikeStatus(transaction?.status) ||
            looksLikeSuccessReason(transaction?.status_reason) ||
            looksLikeSuccessReason(transaction?.acquirer_message));

        if (approvedNow) {
          await prisma.$transaction(async (tx) => {
            const currentOrder = await tx.order.findUnique({
              where: { id: order.id },
              select: { id: true, status: true, giftItemId: true, quantity: true },
            });
            if (!currentOrder) return;

            const transition = await tx.order.updateMany({
              where: { id: order.id, status: { not: "PAID" } },
              data: {
                pagarmeOrderId: latestOrder?.id ?? null,
                pagarmeChargeId: charge?.id ?? null,
                paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
                status: "PAID",
                paidAt: new Date(),
              },
            });

            if (transition.count > 0) {
              await tx.giftItem.update({
                where: { id: currentOrder.giftItemId },
                data: { availableQty: { decrement: currentOrder.quantity } },
              });
              await tx.message.updateMany({
                where: { orderId: currentOrder.id },
                data: { isPublic: true },
              });
            } else {
              await tx.order.update({
                where: { id: order.id },
                data: {
                  pagarmeOrderId: latestOrder?.id ?? null,
                  pagarmeChargeId: charge?.id ?? null,
                  paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
                },
              });
            }
            if (data.paymentMethod === 'CREDIT_CARD') {
              await tx.checkoutCardAttempt.updateMany({
                where: { orderId: order.id },
                data: { status: 'APPROVED' },
              });
            }
          });
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              pagarmeOrderId: latestOrder?.id ?? null,
              pagarmeChargeId: charge?.id ?? null,
              paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
              ...(isFailed ? { status: 'REFUSED' as const } : {}),
            },
          });
          if (data.paymentMethod === 'CREDIT_CARD') {
            await prisma.checkoutCardAttempt.updateMany({
              where: { orderId: order.id },
              data: { status: isFailed ? 'REFUSED' : 'PROCESSING' },
            });
          }
        }

        if (isFailed) {
          const combinedGatewayMessage = [
            failReason,
            firstGatewayReason,
            transaction?.status_reason,
            transaction?.gateway_response?.errors?.[0]?.message,
            transaction?.acquirer_message,
          ]
            .filter(Boolean)
            .join('\n');
          await markRecipientsRefusedFromGatewayMessage(combinedGatewayMessage);

          console.warn('Pagamento recusado pela Pagar.me', {
            orderId: order.id,
            chargeStatus: charge?.status ?? null,
            transactionStatus: transaction?.status ?? null,
            transactionStatusReason: transaction?.status_reason ?? null,
            acquirerMessage: transaction?.acquirer_message ?? null,
            gatewayErrorMessage: transaction?.gateway_response?.errors?.[0]?.message ?? null,
          });

          if (data.paymentMethod === 'CREDIT_CARD') {
            await logSecurityEvent({
              type: 'GIFT_CHECKOUT_REFUSED',
              email: data.guestEmail,
              request,
              route: '/api/orders',
              metadata: {
                ip,
                orderId: order.id,
                giftListId: data.giftListId,
                giftId: data.giftId,
                chargeStatus: charge?.status ?? null,
                transactionStatus: transaction?.status ?? null,
                gatewayReason: firstGatewayReason,
              },
            });
          }

          return NextResponse.json(
            {
              error: 'Pagamento recusado pela Pagar.me.',
              details: failReason,
              gatewayReason: firstGatewayReason,
              acquirerReturnCode: transaction?.acquirer_return_code ?? null,
              acquirerName: transaction?.acquirer_name ?? null,
              chargeStatus: charge?.status ?? null,
              transactionStatus: transaction?.status ?? null,
              orderId: order.id,
              splitApplied: Boolean(splitRules?.length),
              splitReason,
            },
            { status: 502 }
          );
        }

        return NextResponse.json({
          orderId: order.id,
          mode: data.paymentMethod === 'CREDIT_CARD' ? 'pagarme_credit_card' : 'pagarme_pix',
          splitApplied: effectiveSplitApplied,
          splitReason: effectiveSplitReason,
          chargeStatus: charge?.status ?? null,
          transactionStatus: transaction?.status ?? null,
          checkoutUrl: transaction?.url ?? null,
          pixQrCode: transaction?.qr_code ?? null,
          pixQrCodeUrl: transaction?.qr_code_url ?? null,
          expiresAt: transaction?.expires_at ?? null,
        });
      } catch (gatewayError: any) {
        const details = sanitizeGatewayErrorDetails(
          gatewayError?.message || 'Falha ao criar cobranca no gateway'
        );
        await markRecipientsRefusedFromGatewayMessage(details);
        console.error('Falha ao criar cobranca Pagar.me:', details);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'REFUSED' },
        });
        if (data.paymentMethod === 'CREDIT_CARD') {
          await prisma.checkoutCardAttempt.updateMany({
            where: { orderId: order.id },
            data: { status: 'GATEWAY_ERROR' },
          });
        }
        if (data.paymentMethod === 'CREDIT_CARD') {
          await logSecurityEvent({
            type: 'GIFT_CHECKOUT_GATEWAY_ERROR',
            email: data.guestEmail,
            request,
            route: '/api/orders',
            metadata: {
              ip,
              orderId: order.id,
              giftListId: data.giftListId,
              giftId: data.giftId,
              details,
            },
          });
        }
        const gatewayMessage =
          data.paymentMethod === 'CREDIT_CARD'
            ? 'Nao foi possivel processar o cartao neste momento.'
            : 'Nao foi possivel gerar o PIX neste momento.';

        return NextResponse.json(
          {
            error: gatewayMessage,
            details,
            orderId: order.id,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Gateway de pagamento nao configurado.',
        details: 'Defina PAGARME_SECRET_KEY para gerar PIX.',
        orderId: order.id,
      },
      { status: 503 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
  }
}
