import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getActingUserContext } from '@/lib/acting-user';
import { getLegacyStorageRejectMessage, isLegacySupabaseStorageUrl } from '@/lib/storage-url';

const giftSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio'),
  description: z.string().optional(),
  imageUrl: z.string().trim().optional().or(z.literal('')),
  basePrice: z.number().positive('Preco deve ser maior que zero'),
  totalQuantity: z.number().int().positive().default(1),
});

export async function GET(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const giftListId = searchParams.get('giftListId');

    if (!giftListId) {
      return NextResponse.json({ error: 'giftListId e obrigatorio' }, { status: 400 });
    }

    const giftList = await prisma.giftList.findFirst({
      where: {
        id: giftListId,
        userId: ctx.effectiveUserId,
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: 'Lista nao encontrada' }, { status: 404 });
    }

    const gifts = await prisma.giftItem.findMany({
      where: { giftListId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(gifts);
  } catch (error) {
    console.error('Erro ao buscar presentes:', error);
    return NextResponse.json({ error: 'Erro ao buscar presentes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { giftListId, ...data } = body;

    if (!giftListId) {
      return NextResponse.json({ error: 'giftListId e obrigatorio' }, { status: 400 });
    }

    const giftList = await prisma.giftList.findFirst({
      where: {
        id: giftListId,
        userId: ctx.effectiveUserId,
      },
      include: {
        _count: {
          select: { gifts: true },
        },
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: 'Lista nao encontrada' }, { status: 404 });
    }

    if (giftList._count.gifts >= 100) {
      return NextResponse.json({ error: 'Limite de 100 presentes atingido' }, { status: 400 });
    }

    const validatedData = giftSchema.parse(data);
    if (isLegacySupabaseStorageUrl(validatedData.imageUrl || null)) {
      return NextResponse.json({ error: getLegacyStorageRejectMessage('imageUrl') }, { status: 400 });
    }

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
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao criar presente:', error);
    return NextResponse.json({ error: 'Erro ao criar presente' }, { status: 500 });
  }
}
