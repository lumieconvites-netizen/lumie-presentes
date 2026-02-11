import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const giftSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  basePrice: z.number().positive('Preço deve ser maior que zero'),
  totalQuantity: z.number().int().positive().default(1),
});

// GET - Listar presentes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const giftListId = searchParams.get('giftListId');

    if (!giftListId) {
      return NextResponse.json(
        { error: 'giftListId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a lista pertence ao usuário
    const giftList = await prisma.giftList.findFirst({
      where: {
        id: giftListId,
        userId: session.user.id,
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    const gifts = await prisma.giftItem.findMany({
      where: { giftListId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(gifts);
  } catch (error) {
    console.error('Erro ao buscar presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar presentes' },
      { status: 500 }
    );
  }
}

// POST - Criar presente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { giftListId, ...data } = body;

    if (!giftListId) {
      return NextResponse.json(
        { error: 'giftListId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a lista pertence ao usuário
    const giftList = await prisma.giftList.findFirst({
      where: {
        id: giftListId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { gifts: true },
        },
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    // Verificar limite de 100 presentes
    if (giftList._count.gifts >= 100) {
      return NextResponse.json(
        { error: 'Limite de 100 presentes atingido' },
        { status: 400 }
      );
    }

    const validatedData = giftSchema.parse(data);

    // Buscar maior ordem atual
    const lastGift = await prisma.giftItem.findFirst({
      where: { giftListId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const gift = await prisma.giftItem.create({
      data: {
        ...validatedData,
        giftListId,
        availableQty: validatedData.totalQuantity,
        order: (lastGift?.order ?? -1) + 1,
        imageUrl: validatedData.imageUrl || null,
      },
    });

    return NextResponse.json(gift, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Erro ao criar presente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar presente' },
      { status: 500 }
    );
  }
}
