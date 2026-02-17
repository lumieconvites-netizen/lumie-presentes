import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { giftId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const gift = await prisma.giftItem.findFirst({
      where: {
        id: params.giftId,
        isActive: true,
        giftList: {
          isPublished: true,
          ...(slug ? { slug } : {}),
        },
      },
      include: {
        giftList: {
          select: {
            id: true,
            title: true,
            slug: true,
            feeMode: true,
            allowMessages: true,
            allowPhotoUpload: true,
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Presente nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      gift: {
        id: gift.id,
        name: gift.name,
        description: gift.description,
        imageUrl: gift.imageUrl,
        basePrice: Number(gift.basePrice),
        availableQty: gift.availableQty,
        totalQuantity: gift.totalQuantity,
      },
      giftList: gift.giftList,
    });
  } catch (error) {
    console.error('Erro ao buscar presente:', error);
    return NextResponse.json({ error: 'Erro ao buscar presente' }, { status: 500 });
  }
}
