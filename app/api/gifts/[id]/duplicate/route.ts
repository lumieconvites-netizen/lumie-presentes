import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Duplicar presente
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar presente original
    const originalGift = await prisma.giftItem.findFirst({
      where: {
        id: params.id,
        giftList: {
          userId: session.user.id,
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
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }

    // Verificar limite de 100 presentes
    if (originalGift.giftList._count.gifts >= 100) {
      return NextResponse.json(
        { error: 'Limite de 100 presentes atingido' },
        { status: 400 }
      );
    }

    // Buscar maior ordem atual
    const lastGift = await prisma.giftItem.findFirst({
      where: { giftListId: originalGift.giftListId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // Criar cópia
    const duplicatedGift = await prisma.giftItem.create({
      data: {
        giftListId: originalGift.giftListId,
        name: `${originalGift.name} (cópia)`,
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
    return NextResponse.json(
      { error: 'Erro ao duplicar presente' },
      { status: 500 }
    );
  }
}
