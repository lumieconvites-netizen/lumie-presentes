import CheckoutPageClient, { type GiftResponse } from '@/components/checkout/checkout-page-client';
import { getEffectiveAvailabilityForGift } from '@/lib/gift-availability';
import { resolveEffectivePlan, resolvePlatformFeePercent } from '@/lib/plans';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function loadCheckoutGift(giftId: string, slug?: string): Promise<GiftResponse | null> {
  const gift = await prisma.giftItem.findFirst({
    where: {
      id: giftId,
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

  if (!gift) return null;

  const effectiveAvailableQty = await getEffectiveAvailabilityForGift(gift.id, gift.totalQuantity);
  const effectivePlan = resolveEffectivePlan(gift.giftList.user);

  return {
    gift: {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      imageUrl: gift.imageUrl,
      basePrice: Number(gift.basePrice),
      availableQty: effectiveAvailableQty,
      totalQuantity: gift.totalQuantity,
    },
    giftList: {
      id: gift.giftList.id,
      title: gift.giftList.title,
      slug: gift.giftList.slug,
      feeMode: gift.giftList.feeMode,
      allowMessages: gift.giftList.allowMessages,
      allowPhotoUpload: gift.giftList.allowPhotoUpload,
      feePercentPix: resolvePlatformFeePercent('PIX', effectivePlan),
      feePercentCreditCard: resolvePlatformFeePercent('CREDIT_CARD', effectivePlan),
    },
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { giftId: string };
  searchParams?: { slug?: string };
}) {
  const slug = typeof searchParams?.slug === 'string' ? searchParams.slug : undefined;
  const initialGiftData = await loadCheckoutGift(params.giftId, slug);

  return (
    <CheckoutPageClient
      giftId={params.giftId}
      initialGiftData={initialGiftData}
      initialSlug={slug ?? null}
    />
  );
}
