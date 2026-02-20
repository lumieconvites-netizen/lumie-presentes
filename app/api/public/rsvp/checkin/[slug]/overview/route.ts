import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findGiftListByCheckInSlug } from '@/lib/rsvp-checkin';
import { getPublicBaseUrl } from '@/lib/rsvp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const giftList = await findGiftListByCheckInSlug(params.slug);

    if (!giftList || !giftList.isPublished) {
      return NextResponse.json({ error: 'Link de check-in nao encontrado' }, { status: 404 });
    }

    if (!giftList.rsvpSettings?.enabled || !giftList.rsvpSettings.checkInEnabled) {
      return NextResponse.json({ error: 'Check-in nao esta disponivel para este evento' }, { status: 403 });
    }

    const guests = await prisma.rsvpGuest.findMany({
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
    });

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
      guests,
    });
  } catch (error) {
    console.error('Erro ao carregar overview publico de check-in:', error);
    return NextResponse.json({ error: 'Erro ao carregar check-in' }, { status: 500 });
  }
}

