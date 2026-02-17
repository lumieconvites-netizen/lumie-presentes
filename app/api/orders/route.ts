import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTotal } from '@/lib/utils';
import { createPixOrder } from '@/lib/pagarme';
import { z } from 'zod';

const orderSchema = z.object({
  giftId: z.string(),
  giftListId: z.string(),
  guestName: z.string().min(2, 'Nome invalido'),
  guestEmail: z.string().email('Email invalido'),
  guestDocument: z.string().optional(),
  guestPhoneArea: z.string().optional(),
  guestPhoneNumber: z.string().optional(),
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = orderSchema.parse(body);
    const guestDocument = onlyDigits(data.guestDocument);
    const guestArea = onlyDigits(data.guestPhoneArea);
    const guestNumber = onlyDigits(data.guestPhoneNumber);

    if (!guestDocument || !isValidCpf(guestDocument)) {
      return NextResponse.json({ error: 'CPF invalido' }, { status: 400 });
    }

    if (!guestArea || guestArea.length !== 2 || !guestNumber || guestNumber.length < 8) {
      return NextResponse.json({ error: 'Telefone invalido. Use DDD + numero.' }, { status: 400 });
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
              },
            },
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Presente nao encontrado' }, { status: 404 });
    }

    if (gift.availableQty < data.quantity) {
      return NextResponse.json({ error: 'Quantidade indisponivel' }, { status: 400 });
    }

    const baseAmount = Number(gift.basePrice) * data.quantity;
    const calculation = calculateTotal(baseAmount, gift.giftList.feeMode);

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

        const totalInCents = Math.round(calculation.totalAmount * 100);
        const feeInCents = Math.round(calculation.feeAmount * 100);
        const recipientInCents = Math.max(0, totalInCents - feeInCents);

        const splitRules =
          platformRecipientId &&
          isRealRecipientId(clientRecipientId) &&
          feeInCents > 0 &&
          recipientInCents > 0
            ? [
                { recipientId: clientRecipientId as string, amountInCents: recipientInCents },
                { recipientId: platformRecipientId, amountInCents: feeInCents },
              ]
            : undefined;

        const splitReason = splitRules
          ? 'ok'
          : !platformRecipientId
            ? 'missing_platform_recipient'
            : !isRealRecipientId(clientRecipientId)
              ? 'missing_client_recipient'
              : feeInCents <= 0 || recipientInCents <= 0
                ? 'invalid_split_amount'
                : 'unknown';

        const pagarmeOrder = await createPixOrder({
          amountInCents: totalInCents,
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
            splitApplied: Boolean(splitRules?.length),
            splitReason,
            platformRecipientId: platformRecipientId ?? null,
            clientRecipientId: clientRecipientId ?? null,
          },
        });

        const charge = pagarmeOrder?.charges?.[0];
        const transaction = charge?.last_transaction;
        const chargeStatus = String(charge?.status ?? '').toLowerCase();
        const transactionStatus = String(transaction?.status ?? '').toLowerCase();
        const isFailed =
          chargeStatus === 'failed' ||
          chargeStatus === 'canceled' ||
          chargeStatus === 'refused' ||
          transactionStatus === 'failed' ||
          transactionStatus === 'canceled' ||
          transactionStatus === 'refused';

        const failReason =
          transaction?.gateway_response?.errors?.[0]?.message ||
          transaction?.acquirer_message ||
          transaction?.status_reason ||
          charge?.last_transaction?.status_reason ||
          charge?.status ||
          'Pagamento recusado pelo gateway';

        await prisma.order.update({
          where: { id: order.id },
          data: {
            pagarmeOrderId: pagarmeOrder?.id ?? null,
            pagarmeChargeId: charge?.id ?? null,
            ...(isFailed ? { status: 'REFUSED' as const } : {}),
          },
        });

        if (isFailed) {
          return NextResponse.json(
            {
              error: 'Pagamento recusado pela Pagar.me.',
              details: failReason,
              orderId: order.id,
              splitApplied: Boolean(splitRules?.length),
              splitReason,
            },
            { status: 502 }
          );
        }

        return NextResponse.json({
          orderId: order.id,
          mode: 'pagarme_pix',
          splitApplied: Boolean(splitRules?.length),
          splitReason,
          checkoutUrl: transaction?.url ?? null,
          pixQrCode: transaction?.qr_code ?? null,
          pixQrCodeUrl: transaction?.qr_code_url ?? null,
          expiresAt: transaction?.expires_at ?? null,
        });
      } catch (gatewayError: any) {
        const details = gatewayError?.message || 'Falha ao criar cobranca no gateway';
        console.error('Falha ao criar cobranca Pagar.me:', details);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'REFUSED' },
        });
        return NextResponse.json(
          {
            error: 'Nao foi possivel gerar o PIX neste momento.',
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
