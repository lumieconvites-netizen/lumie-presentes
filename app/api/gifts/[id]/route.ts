import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const giftSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  basePrice: z.number().positive('Preço deve ser maior que zero').optional(),
  totalQuantity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET - Buscar presente específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const gift = await prisma.giftItem.findFirst({
      where: {
        id: params.id,
        giftList: {
          userId: session.user.id,
        },
      },
      include: {
        giftList: true,
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(gift);
  } catch (error) {
    console.error('Erro ao buscar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar presente' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar presente
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = giftSchema.parse(body);

    // Verificar se o presente pertence ao usuário
    const existingGift = await prisma.giftItem.findFirst({
      where: {
        id: params.id,
        giftList: {
          userId: session.user.id,
        },
      },
    });

    if (!existingGift) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }

    // Calcular availableQty se totalQuantity mudou
    let availableQty = existingGift.availableQty;
    if (validatedData.totalQuantity !== undefined) {
      const diff = validatedData.totalQuantity - existingGift.totalQuantity;
      availableQty = Math.max(0, existingGift.availableQty + diff);
    }

    const gift = await prisma.giftItem.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        availableQty,
        imageUrl: validatedData.imageUrl === '' ? null : validatedData.imageUrl,
      },
    });

    return NextResponse.json(gift);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar presente' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar presente
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o presente pertence ao usuário
    const existingGift = await prisma.giftItem.findFirst({
      where: {
        id: params.id,
        giftList: {
          userId: session.user.id,
        },
      },
      include: {
        orders: {
          where: {
            status: { in: ['PAID', 'AUTHORIZED'] },
          },
        },
      },
    });

    if (!existingGift) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }

    // Verificar se há pedidos pagos para este presente
    if (existingGift.orders.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar um presente que já foi comprado' },
        { status: 400 }
      );
    }

    await prisma.giftItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Presente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar presente' },
      { status: 500 }
    );
  }
}
