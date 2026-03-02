import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTotal } from '@/lib/utils';
import { createCreditCardOrder, createPixOrder, getOrder } from '@/lib/pagarme';
import { z } from 'zod';
import { enforceRateLimit, getRequestIp } from '@/lib/rate-limit';
import { reconcilePendingOrdersForGiftList } from '@/lib/order-status-reconciliation';
import { getEffectiveAvailabilityForGift } from '@/lib/gift-availability';

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
  quantity: z.number().int().positive(),
  message: z.string().optional(),
  signature: z.string().optional(),
});

function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
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

function readPercent(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function resolveFeePercentages(paymentMethod: 'PIX' | 'CREDIT_CARD') {
  const defaultPlatformFee = readPercent('PLATFORM_FEE_PERCENTAGE', 11.99);
  const platformFee =
    paymentMethod === 'CREDIT_CARD'
      ? readPercent('PLATFORM_FEE_PERCENTAGE_CREDIT_CARD', defaultPlatformFee)
      : readPercent('PLATFORM_FEE_PERCENTAGE_PIX', defaultPlatformFee);

  const defaultNetworkFee = readPercent('PLATFORM_NETWORK_FEE_PERCENTAGE', 10.9);
  const networkFee =
    paymentMethod === 'CREDIT_CARD'
      ? readPercent('PLATFORM_NETWORK_FEE_PERCENTAGE_CREDIT_CARD', defaultNetworkFee)
      : readPercent('PLATFORM_NETWORK_FEE_PERCENTAGE_PIX', defaultNetworkFee);

  const defaultProcessingFee = readPercent('PAGARME_PROCESSING_FEE_PERCENTAGE', 1.09);
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

function calculateCommissionSplit(params: {
  baseAmount: number;
  totalAmount: number;
  acquisitionSource: string;
  hasPartnerRecipient: boolean;
  hasAmbassadorRecipient: boolean;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
}) {
  const { processingFee: processingFeePercentage, networkFee: networkFeePercentage } = resolveFeePercentages(
    params.paymentMethod
  );
  const partnerFeePercentage = readPercent('PARTNER_COMMISSION_PERCENTAGE', 2);
  const ambassadorFeePercentage = readPercent('AMBASSADOR_COMMISSION_PERCENTAGE', 3);

  const baseInCents = roundCents(params.baseAmount * 100);
  const totalInCents = roundCents(params.totalAmount * 100);

  const enablePartner = params.hasPartnerRecipient && ['PARTNER_DIRECT', 'PARTNER_WITH_AMBASSADOR'].includes(params.acquisitionSource);
  const enableAmbassador =
    params.hasAmbassadorRecipient && ['AMBASSADOR_DIRECT', 'PARTNER_WITH_AMBASSADOR'].includes(params.acquisitionSource);

  const partnerInCents = enablePartner ? roundCents((baseInCents * partnerFeePercentage) / 100) : 0;
  const ambassadorInCents = enableAmbassador ? roundCents((baseInCents * ambassadorFeePercentage) / 100) : 0;
  const platformCommercialPercentage = Math.max(networkFeePercentage - (enablePartner ? partnerFeePercentage : 0) - (enableAmbassador ? ambassadorFeePercentage : 0), 0);
  const platformGrossPercentage = platformCommercialPercentage + processingFeePercentage;
  const platformInCents = roundCents((baseInCents * platformGrossPercentage) / 100);
  const clientInCents = Math.max(totalInCents - platformInCents - partnerInCents - ambassadorInCents, 0);

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
    const ipRate = await enforceRateLimit({
      key: `checkout:orders:ip:${ip}`,
      requests: 40,
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

    const emailRate = await enforceRateLimit({
      key: `checkout:orders:email:${data.guestEmail.trim().toLowerCase()}`,
      requests: 12,
      window: "5 m",
    });
    if (!emailRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas para este email. Aguarde alguns minutos." }, { status: 429 });
    }

    const guestDocument = onlyDigits(data.guestDocument);
    const guestArea = onlyDigits(data.guestPhoneArea);
    const guestNumber = onlyDigits(data.guestPhoneNumber);

    if (!guestDocument || !isValidCpf(guestDocument)) {
      return NextResponse.json({ error: 'CPF invalido' }, { status: 400 });
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
    }

    const gift = await prisma.giftItem.findFirst({
      where: {
        id: data.giftId,
        giftListId: data.giftListId,
        isActive: true,
      },
      include: {
        giftList: {
          include: {
            user: {
              include: {
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
    const { platformFee: platformFeePercentage } = resolveFeePercentages(data.paymentMethod);
    const calculation = calculateTotal(baseAmount, gift.giftList.feeMode, platformFeePercentage);

    const order = await prisma.order.create({
      data: {
        giftListId: data.giftListId,
        giftItemId: data.giftId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        quantity: data.quantity,
        baseAmount: calculation.baseAmount,
        feeAmount: calculation.feeAmount,
        totalAmount: calculation.totalAmount,
        status: 'PENDING',
        paymentMethod: data.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
      },
    });

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
        const clientRecipientId = gift.giftList.user.recipient?.pagarmeRecipientId;

        const partnerRecipientId = gift.giftList.user.referredByPartner?.recipient?.pagarmeRecipientId;
        const ambassadorRecipientId = gift.giftList.user.referredByAmbassador?.recipient?.pagarmeRecipientId;

        const splitAmounts = calculateCommissionSplit({
          baseAmount: calculation.baseAmount,
          totalAmount: calculation.totalAmount,
          acquisitionSource: gift.giftList.user.acquisitionSource,
          hasPartnerRecipient: isRealRecipientId(partnerRecipientId),
          hasAmbassadorRecipient: isRealRecipientId(ambassadorRecipientId),
          paymentMethod: data.paymentMethod,
        });

        const splitRules =
          platformRecipientId &&
          isRealRecipientId(clientRecipientId) &&
          splitAmounts.totalInCents > 0 &&
          splitAmounts.clientInCents >= 0
            ? [
                { recipientId: clientRecipientId as string, amountInCents: splitAmounts.clientInCents },
                ...(splitAmounts.partnerInCents > 0 && isRealRecipientId(partnerRecipientId)
                  ? [{ recipientId: partnerRecipientId as string, amountInCents: splitAmounts.partnerInCents }]
                  : []),
                ...(splitAmounts.ambassadorInCents > 0 && isRealRecipientId(ambassadorRecipientId)
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
            email: data.guestEmail,
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
        }

        if (isFailed) {
          console.warn('Pagamento recusado pela Pagar.me', {
            orderId: order.id,
            chargeStatus: charge?.status ?? null,
            transactionStatus: transaction?.status ?? null,
            transactionStatusReason: transaction?.status_reason ?? null,
            acquirerMessage: transaction?.acquirer_message ?? null,
            gatewayErrorMessage: transaction?.gateway_response?.errors?.[0]?.message ?? null,
          });

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
        console.error('Falha ao criar cobranca Pagar.me:', details);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'REFUSED' },
        });
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
