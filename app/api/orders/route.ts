import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTotal } from '@/lib/utils';
import { z } from 'zod';

const orderSchema = z.object({
  giftId: z.string(),
  giftListId: z.string(),
  guestName: z.string().min(2, 'Nome inválido'),
  guestEmail: z.string().email('Email inválido'),
  quantity: z.number().int().positive(),
  message: z.string().optional(),
  signature: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = orderSchema.parse(body);

    // Buscar presente e lista
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
      return NextResponse.json(
        { error: 'Presente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar quantidade disponível
    if (gift.availableQty < data.quantity) {
      return NextResponse.json(
        { error: 'Quantidade indisponível' },
        { status: 400 }
      );
    }

    // Calcular valores
    const baseAmount = Number(gift.basePrice) * data.quantity;
    const calculation = calculateTotal(baseAmount, gift.giftList.feeMode);

    // Criar pedido
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

    // Criar recado se fornecido
    if (data.message && gift.giftList.allowMessages) {
      await prisma.message.create({
        data: {
          orderId: order.id,
          giftListId: data.giftListId,
          guestName: data.guestName,
          content: data.message,
          signature: data.signature,
          isPublic: true,
        },
      });
    }

    // TODO: Integrar com Pagar.me para criar checkout
    // Por enquanto, retornar o orderId
    // Na implementação real, você criaria o pedido no Pagar.me e retornaria o checkout URL

    /*
    const pagarmeOrder = await createOrder({
      amount: Math.round(calculation.totalAmount * 100), // centavos
      customerId: ...,
      items: [...],
      payments: [...],
      splitRules: [...],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        pagarmeOrderId: pagarmeOrder.orderId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: pagarmeOrder.data.checkouts[0].payment_url,
    });
    */

    // Por enquanto, simular aprovação imediata para testes
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    await prisma.giftItem.update({
      where: { id: gift.id },
      data: {
        availableQty: {
          decrement: data.quantity,
        },
      },
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: null, // No production, this would be the Pagar.me checkout URL
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pedido' },
      { status: 500 }
    );
  }
}
