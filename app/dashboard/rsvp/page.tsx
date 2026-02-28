import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';
import { getPrimaryGiftListIdForUser } from '@/lib/primary-gift-list';
import { getPublicBaseUrl, getPublicCheckInUrl, normalizeCheckInSlug } from '@/lib/rsvp';
import DashboardRsvpPageClient, { type OverviewResponse } from '@/components/dashboard/rsvp-page-client';

export default async function DashboardRsvpPage() {
  const ctx = await getActingUserContext();
  let initialData: OverviewResponse | null = null;

  if (ctx) {
    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);

    if (primaryGiftListId) {
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          slug: true,
          title: true,
          isPublished: true,
        },
      });

      if (giftList) {
        const [settings, totalGuests, checkedIn, grouped] = await Promise.all([
          prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
          prisma.rsvpGuest.count({ where: { giftListId: giftList.id } }),
          prisma.rsvpGuest.count({ where: { giftListId: giftList.id, checkedInAt: { not: null } } }),
          prisma.rsvpGuest.groupBy({
            by: ['status'],
            where: { giftListId: giftList.id },
            _count: { _all: true },
          }),
        ]);

        const counts = grouped.reduce(
          (acc, row) => {
            acc[row.status] = row._count._all;
            return acc;
          },
          {} as Record<string, number>
        );

        const resolvedCheckInSlug = settings?.checkInSlug || normalizeCheckInSlug(giftList.slug);

        initialData = {
          list: giftList,
          publicRsvpUrl: `${getPublicBaseUrl()}/site/${encodeURIComponent(giftList.slug)}/confirmar-presenca`,
          publicCheckInUrl: getPublicCheckInUrl(resolvedCheckInSlug),
          settings: {
            enabled: settings?.enabled ?? false,
            notificationEmail: settings?.notificationEmail ?? ctx.effectiveUser.email ?? null,
          },
          metrics: {
            totalGuests,
            confirmed: counts.CONFIRMED ?? 0,
            pending: counts.PENDING ?? 0,
            declined: counts.DECLINED ?? 0,
            checkedIn,
          },
        };
      }
    }
  }

  return <DashboardRsvpPageClient initialData={initialData} />;
}
