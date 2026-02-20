import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const originalGift = await prisma.giftItem.findFirst({
      where: {
        id: params.id,
        giftList: {
          userId: ctx.effectiveUserId,
        },
      },
      include: {
        giftList: {
          include: {
            _count: {
              select: { gifts: true },
            },
          },
        },
      },
    });

    if (!originalGift) {
      return NextResponse.json({ error: 'Presente nao encontrado' }, { status: 404 });
    }

    if (originalGift.giftList._count.gifts >= 100) {
      return NextResponse.json({ error: 'Limite de 100 presentes atingido' }, { status: 400 });
    }

    const lastGift = await prisma.giftItem.findFirst({
      where: { giftListId: originalGift.giftListId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const duplicatedGift = await prisma.giftItem.create({
      data: {
        giftListId: originalGift.giftListId,
        name: `${originalGift.name} (copia)`,
        description: originalGift.description,
        imageUrl: originalGift.imageUrl,
        basePrice: originalGift.basePrice,
        totalQuantity: originalGift.totalQuantity,
        availableQty: originalGift.totalQuantity,
        isActive: originalGift.isActive,
        order: (lastGift?.order ?? -1) + 1,
      },
    });

    return NextResponse.json(duplicatedGift, { status: 201 });
  } catch (error) {
    console.error('Erro ao duplicar presente:', error);
    return NextResponse.json({ error: 'Erro ao duplicar presente' }, { status: 500 });
  }
}
