import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findGiftListByCheckInSlug } from '@/lib/rsvp-checkin';
import { getPublicBaseUrl } from '@/lib/rsvp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getCheckInMetrics(giftListId: string) {
  const [expected, checkedIn] = await Promise.all([
    prisma.rsvpGuest.count({ where: { giftListId, status: 'CONFIRMED' } }),
    prisma.rsvpGuest.count({ where: { giftListId, checkedInAt: { not: null } } }),
  ]);

  return {
    expected,
    checkedIn,
    remaining: Math.max(expected - checkedIn, 0),
  };
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const giftList = await findGiftListByCheckInSlug(params.slug);

    if (!giftList || !giftList.isPublished) {
      return NextResponse.json({ error: 'Link de check-in nao encontrado' }, { status: 404 });
    }

    if (!giftList.rsvpSettings?.enabled || !giftList.rsvpSettings.checkInEnabled) {
      return NextResponse.json({ error: 'Check-in nao esta disponivel para este evento' }, { status: 403 });
    }

    const parsedUrl = new URL(req.url);
    const includeGuests = parsedUrl.searchParams.get('includeGuests') === '1';
    const [metrics, guests] = await Promise.all([
      getCheckInMetrics(giftList.id),
      includeGuests
        ? prisma.rsvpGuest.findMany({
            where: { giftListId: giftList.id },
            orderBy: [{ createdAt: 'desc' }],
            select: {
              id: true,
              fullName: true,
              status: true,
              checkedInAt: true,
              confirmedAdults: true,
              confirmedChildren: true,
              checkInCode: true,
            },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      list: {
        id: giftList.id,
        slug: giftList.slug,
        title: giftList.title,
      },
      settings: {
        checkInEnabled: true,
      },
      publicRsvpUrl: `${getPublicBaseUrl()}/site/${encodeURIComponent(giftList.slug)}/confirmar-presenca`,
      metrics,
      guests,
    });
  } catch (error) {
    console.error('Erro ao carregar overview publico de check-in:', error);
    return NextResponse.json({ error: 'Erro ao carregar check-in' }, { status: 500 });
  }
}

