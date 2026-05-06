import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveAvailabilityForGift } from '@/lib/gift-availability';
import { reconcilePendingOrdersForGiftList } from '@/lib/order-status-reconciliation';
import { resolveEffectivePlan, resolvePlatformFeePercent } from '@/lib/plans';

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
            user: {
              select: {
                plan: true,
                planExpiresAt: true,
              },
            },
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: 'Presente nao encontrado' }, { status: 404 });
    }

    void reconcilePendingOrdersForGiftList(gift.giftList.id, {
      minIntervalMs: 15000,
      throttleKey: `checkout-public:${gift.giftList.id}`,
    }).catch((reconcileError) => {
      console.error('Falha ao reconciliar pedidos pendentes no preload do checkout:', reconcileError);
    });
    const effectiveAvailableQty = await getEffectiveAvailabilityForGift(gift.id, gift.totalQuantity);
    const effectivePlan = resolveEffectivePlan(gift.giftList.user);
    const giftList = {
      id: gift.giftList.id,
      title: gift.giftList.title,
      slug: gift.giftList.slug,
      feeMode: gift.giftList.feeMode,
      allowMessages: gift.giftList.allowMessages,
      allowPhotoUpload: gift.giftList.allowPhotoUpload,
      feePercentPix: resolvePlatformFeePercent('PIX', effectivePlan),
      feePercentCreditCard: resolvePlatformFeePercent('CREDIT_CARD', effectivePlan),
    };

    return NextResponse.json({
      gift: {
        id: gift.id,
        name: gift.name,
        description: gift.description,
        imageUrl: gift.imageUrl,
        basePrice: Number(gift.basePrice),
        availableQty: effectiveAvailableQty,
        totalQuantity: gift.totalQuantity,
      },
      giftList,
    });
  } catch (error) {
    console.error('Erro ao buscar presente:', error);
    return NextResponse.json({ error: 'Erro ao buscar presente' }, { status: 500 });
  }
}
