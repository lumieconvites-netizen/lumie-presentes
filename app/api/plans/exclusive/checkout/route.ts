import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActingUserContext } from '@/lib/acting-user';
import { prisma } from '@/lib/prisma';
import { claimIdempotencyKey } from '@/lib/idempotency';
import { enforceRateLimit, getRequestIp } from '@/lib/rate-limit';
import { createCreditCardOrder, createPixOrder, getOrder } from '@/lib/pagarme';
import { activatePremiumPlanPurchase } from '@/lib/plan-purchases';
import {
  LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS,
  LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS,
  LUMIE_EXCLUSIVE_PRICE_CENTS,
} from '@/lib/premium-plan';
import { getBlockedEmailMessage, isBlockedEmailDomain } from '@/lib/email-guard';
import { blockIpPermanently, getBlockedIpMessage, isBlockedIp } from '@/lib/ip-guard';
import { logSecurityEvent } from '@/lib/security-events';

const PREMIUM_CHECKOUT_REFUSED_LIMIT = 3;
const PREMIUM_CHECKOUT_REFUSED_WINDOW_MINUTES = 30;
const PREMIUM_CHECKOUT_IP_REFUSED_LIMIT = 3;
const PREMIUM_CHECKOUT_IP_REFUSED_WINDOW_MINUTES = 60;
const PREMIUM_CHECKOUT_BLOCKING_EVENT_TYPES = [
  'PREMIUM_CHECKOUT_REFUSED',
  'PREMIUM_CHECKOUT_GATEWAY_ERROR',
] as const;

const checkoutSchema = z.object({
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD']),
  document: z.string().min(11),
  phoneArea: z.string().min(2),
  phoneNumber: z.string().min(8),
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
});

function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

function isRealRecipientId(value?: string | null) {
  return Boolean(value && !value.startsWith('pending_'));
}

function isActiveRecipient(recipient?: { pagarmeRecipientId?: string | null; status?: string | null } | null) {
  return isRealRecipientId(recipient?.pagarmeRecipientId) && String(recipient?.status ?? '').toLowerCase() === 'active';
}

function isValidCpf(cpf: string) {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (const n of base) total += Number(n) * factor--;
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

function sanitizeGatewayErrorDetails(input: unknown) {
  const message = String(input ?? '').trim();
  if (!message) return 'Falha temporaria ao comunicar com o gateway.';
  return message.length > 220 ? `${message.slice(0, 217)}...` : message;
}

function looksLikeSuccessReason(reason?: string | null) {
  if (!reason) return false;
  return /(aprovad|approved|sucesso|capturad|captured)/i.test(reason);
}

function isApprovalLikeStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  return value === 'paid' || value === 'authorized' || value === 'captured';
}

function isInvalidRequestError(error: any) {
  const raw = String(error?.message ?? '');
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

export async function POST(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  if (ctx.effectiveUser.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Plano disponivel apenas para clientes.' }, { status: 403 });
  }

  const ip = getRequestIp(request);
  if (isBlockedIp(ip)) {
    await logSecurityEvent({
      type: 'PREMIUM_CHECKOUT_BLOCKED_IP',
      email: ctx.effectiveUser.email ?? null,
      userId: ctx.effectiveUserId,
      request,
      route: '/api/plans/exclusive/checkout',
      metadata: { ip },
    });
    return NextResponse.json({ error: getBlockedIpMessage() }, { status: 403 });
  }

  const ipRate = await enforceRateLimit({
    key: `plans:exclusive:ip:${ip}`,
    requests: 20,
    window: '10 m',
  });
  if (!ipRate.allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  }

  const body = await request.json();
  const data = checkoutSchema.parse(body);

  const document = onlyDigits(data.document);
  const areaCode = onlyDigits(data.phoneArea);
  const number = onlyDigits(data.phoneNumber);

  if (!document || !isValidCpf(document)) {
    return NextResponse.json({ error: 'CPF invalido.' }, { status: 400 });
  }
  if (!areaCode || areaCode.length !== 2 || !number || number.length < 8) {
    return NextResponse.json({ error: 'Telefone invalido.' }, { status: 400 });
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
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.effectiveUserId },
    select: {
      id: true,
      name: true,
      email: true,
      planExpiresAt: true,
      referredByPartner: {
        select: {
          id: true,
          recipient: {
            select: { pagarmeRecipientId: true, status: true },
          },
        },
      },
      referredByAmbassador: {
        select: {
          id: true,
          recipient: {
            select: { pagarmeRecipientId: true, status: true },
          },
        },
      },
    },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });
  }

  if (isBlockedEmailDomain(user.email)) {
    await logSecurityEvent({
      type: 'PREMIUM_CHECKOUT_BLOCKED_EMAIL_DOMAIN',
      email: user.email,
      userId: user.id,
      request,
      route: '/api/plans/exclusive/checkout',
      metadata: { paymentMethod: data.paymentMethod },
    });
    return NextResponse.json({ error: getBlockedEmailMessage() }, { status: 403 });
  }

  if (data.paymentMethod === 'CREDIT_CARD') {
    const refusedCutoff = minutesAgo(PREMIUM_CHECKOUT_REFUSED_WINDOW_MINUTES);
    const recentRefusedAttempts = await prisma.planPurchase.count({
      where: {
        userId: user.id,
        status: 'REFUSED',
        paymentMethod: 'credit_card',
        createdAt: { gte: refusedCutoff },
      },
    });

    if (recentRefusedAttempts >= PREMIUM_CHECKOUT_REFUSED_LIMIT) {
      await logSecurityEvent({
        type: 'PREMIUM_CHECKOUT_REFUSED_LIMIT_BLOCKED',
        email: user.email,
        userId: user.id,
        request,
        route: '/api/plans/exclusive/checkout',
        metadata: {
          paymentMethod: data.paymentMethod,
          recentRefusedAttempts,
          windowMinutes: PREMIUM_CHECKOUT_REFUSED_WINDOW_MINUTES,
        },
      });
      return NextResponse.json(
        { error: 'Muitas tentativas recusadas. Aguarde 30 minutos antes de tentar novamente.' },
        { status: 429 }
      );
    }

    const ipRefusedCutoff = minutesAgo(PREMIUM_CHECKOUT_IP_REFUSED_WINDOW_MINUTES);
    const recentIpRefusedAttempts = await prisma.securityEvent.count({
      where: {
        ip,
        type: { in: [...PREMIUM_CHECKOUT_BLOCKING_EVENT_TYPES] },
        createdAt: { gte: ipRefusedCutoff },
      },
    });

    if (recentIpRefusedAttempts >= PREMIUM_CHECKOUT_IP_REFUSED_LIMIT) {
      await blockIpPermanently(ip);
      await logSecurityEvent({
        type: 'PREMIUM_CHECKOUT_IP_REFUSED_LIMIT_BLOCKED',
        email: user.email,
        userId: user.id,
        request,
        route: '/api/plans/exclusive/checkout',
        metadata: {
          paymentMethod: data.paymentMethod,
          recentIpRefusedAttempts,
          windowMinutes: PREMIUM_CHECKOUT_IP_REFUSED_WINDOW_MINUTES,
        },
      });
      return NextResponse.json(
        { error: 'Muitas tentativas suspeitas foram detectadas neste acesso.' },
        { status: 429 }
      );
    }
  }

  await logSecurityEvent({
    type: 'PREMIUM_CHECKOUT_ATTEMPT',
    email: user.email,
    userId: user.id,
    request,
    route: '/api/plans/exclusive/checkout',
    metadata: { paymentMethod: data.paymentMethod },
  });

  const partnerRecipient = user.referredByPartner?.recipient ?? null;
  const ambassadorRecipient = user.referredByAmbassador?.recipient ?? null;
  const partnerRecipientId = partnerRecipient?.pagarmeRecipientId ?? null;
  const ambassadorRecipientId = ambassadorRecipient?.pagarmeRecipientId ?? null;
  const partnerCommissionInCents = isActiveRecipient(partnerRecipient)
    ? LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS
    : 0;
  const ambassadorCommissionInCents = isActiveRecipient(ambassadorRecipient)
    ? LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS
    : 0;
  const platformInCents =
    LUMIE_EXCLUSIVE_PRICE_CENTS - partnerCommissionInCents - ambassadorCommissionInCents;

  const idempotencyKey = `plans:exclusive:${ctx.effectiveUserId}:${data.paymentMethod}:${document}`;
  const claimed = await claimIdempotencyKey(idempotencyKey, 60);
  if (!claimed) {
    return NextResponse.json({ error: 'Ja existe uma tentativa em andamento. Aguarde alguns segundos.' }, { status: 409 });
  }

  const planPurchase = await prisma.planPurchase.create({
    data: {
      userId: user.id,
      partnerUserId: user.referredByPartner?.id ?? null,
      ambassadorUserId: user.referredByAmbassador?.id ?? null,
      amount: LUMIE_EXCLUSIVE_PRICE_CENTS / 100,
      partnerCommissionAmount: partnerCommissionInCents / 100,
      ambassadorCommissionAmount: ambassadorCommissionInCents / 100,
      paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
      status: 'PENDING',
    },
  });

  try {
    const platformRecipientId = process.env.PAGARME_PLATFORM_RECIPIENT_ID;
    const splitRules =
      platformRecipientId && platformInCents > 0
        ? [
            ...(partnerCommissionInCents > 0 && partnerRecipientId
              ? [{ recipientId: partnerRecipientId, amountInCents: partnerCommissionInCents }]
              : []),
            ...(ambassadorCommissionInCents > 0 && ambassadorRecipientId
              ? [{ recipientId: ambassadorRecipientId, amountInCents: ambassadorCommissionInCents }]
              : []),
            { recipientId: platformRecipientId, amountInCents: platformInCents },
          ]
        : undefined;

    const commonPayload = {
      amountInCents: LUMIE_EXCLUSIVE_PRICE_CENTS,
      itemTitle: 'Plano Lumie Exclusive',
      quantity: 1,
      splitRules,
      customer: {
        name: user.name?.trim() || user.email,
        email: user.email,
        document,
        areaCode,
        number,
      },
      metadata: {
        localPlanPurchaseId: planPurchase.id,
        purchaseType: 'LUMIE_EXCLUSIVE',
        userId: user.id,
        paymentMethod: data.paymentMethod,
        partnerUserId: user.referredByPartner?.id ?? null,
        ambassadorUserId: user.referredByAmbassador?.id ?? null,
        partnerCommissionInCents,
        ambassadorCommissionInCents,
        planAmountInCents: LUMIE_EXCLUSIVE_PRICE_CENTS,
      },
    };

    const createGatewayOrder = () => {
      if (data.paymentMethod === 'CREDIT_CARD') {
        return createCreditCardOrder({
          ...commonPayload,
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
        });
      }

      return createPixOrder(commonPayload);
    };

    let pagarmeOrder: any;
    try {
      pagarmeOrder = await createGatewayOrder();
    } catch (firstGatewayError: any) {
      const shouldRetryWithoutSplit = Boolean(splitRules?.length) && isInvalidRequestError(firstGatewayError);
      if (!shouldRetryWithoutSplit) throw firstGatewayError;

      pagarmeOrder =
        data.paymentMethod === 'CREDIT_CARD'
          ? await createCreditCardOrder({
              ...commonPayload,
              splitRules: undefined,
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
            })
          : await createPixOrder({
              ...commonPayload,
              splitRules: undefined,
            });
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

    const approvedNow =
      !isFailed &&
      (isApprovalLikeStatus(charge?.status) ||
        isApprovalLikeStatus(transaction?.status) ||
        looksLikeSuccessReason(transaction?.status_reason) ||
        looksLikeSuccessReason(transaction?.acquirer_message));

    await prisma.planPurchase.update({
      where: { id: planPurchase.id },
      data: {
        pagarmeOrderId: latestOrder?.id ?? null,
        pagarmeChargeId: charge?.id ?? null,
        paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
        ...(isFailed ? { status: 'REFUSED' } : {}),
      },
    });

    if (approvedNow) {
      await activatePremiumPlanPurchase(planPurchase.id);
      await logSecurityEvent({
        type: 'PREMIUM_CHECKOUT_APPROVED',
        email: user.email,
        userId: user.id,
        request,
        route: '/api/plans/exclusive/checkout',
        metadata: {
          paymentMethod: data.paymentMethod,
          planPurchaseId: planPurchase.id,
          pagarmeOrderId: latestOrder?.id ?? null,
          chargeStatus,
          transactionStatus,
        },
      });
    }

    if (isFailed) {
      await logSecurityEvent({
        type: 'PREMIUM_CHECKOUT_REFUSED',
        email: user.email,
        userId: user.id,
        request,
        route: '/api/plans/exclusive/checkout',
        metadata: {
          paymentMethod: data.paymentMethod,
          planPurchaseId: planPurchase.id,
          pagarmeOrderId: latestOrder?.id ?? null,
          chargeStatus,
          transactionStatus,
          reason: transaction?.status_reason || transaction?.acquirer_message || null,
        },
      });
      return NextResponse.json(
        {
          error: 'Pagamento recusado pela Pagar.me.',
          details: transaction?.status_reason || transaction?.acquirer_message || 'Pagamento recusado.',
          purchaseId: planPurchase.id,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      purchaseId: planPurchase.id,
      planName: 'Lumie Exclusive',
      amount: LUMIE_EXCLUSIVE_PRICE_CENTS / 100,
      status: approvedNow ? 'PAID' : 'PENDING',
      checkoutUrl: transaction?.url ?? null,
      pixQrCode: transaction?.qr_code ?? null,
      pixQrCodeUrl: transaction?.qr_code_url ?? null,
      expiresAt: transaction?.expires_at ?? null,
    });
  } catch (error: any) {
    const details = sanitizeGatewayErrorDetails(error?.message || 'Falha ao criar cobranca no gateway');
    await prisma.planPurchase.update({
      where: { id: planPurchase.id },
      data: { status: 'REFUSED' },
    });
    await logSecurityEvent({
      type: 'PREMIUM_CHECKOUT_GATEWAY_ERROR',
      email: user.email,
      userId: user.id,
      request,
      route: '/api/plans/exclusive/checkout',
      metadata: {
        paymentMethod: data.paymentMethod,
        planPurchaseId: planPurchase.id,
        details,
      },
    });
    return NextResponse.json(
      {
        error:
          data.paymentMethod === 'CREDIT_CARD'
            ? 'Nao foi possivel processar o cartao neste momento.'
            : 'Nao foi possivel gerar o PIX neste momento.',
        details,
        purchaseId: planPurchase.id,
      },
      { status: 502 }
    );
  }
}
