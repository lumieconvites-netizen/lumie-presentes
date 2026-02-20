import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenOrCode, findGiftListByCheckInSlug } from '@/lib/rsvp-checkin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const giftList = await findGiftListByCheckInSlug(params.slug);

    if (!giftList || !giftList.isPublished) {
      return NextResponse.json({ error: 'Link de check-in nao encontrado' }, { status: 404 });
    }

    if (!giftList.rsvpSettings?.enabled || !giftList.rsvpSettings.checkInEnabled) {
      return NextResponse.json({ error: 'Check-in nao esta disponivel para este evento' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const value = String(body?.value || '');
    if (!value.trim()) {
      return NextResponse.json({ error: 'Codigo/QR invalido' }, { status: 400 });
    }

    const { token, code } = extractTokenOrCode(value);

    const guest = await prisma.rsvpGuest.findFirst({
      where: {
        giftListId: giftList.id,
        OR: [
          ...(token ? [{ qrToken: token }] : []),
          ...(code ? [{ checkInCode: code }] : []),
        ],
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        checkedInAt: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    if (!guest) {
      return NextResponse.json({ error: 'Convidado nao encontrado para este QR/codigo' }, { status: 404 });
    }

    if (guest.checkedInAt) {
      return NextResponse.json({
        ok: true,
        alreadyCheckedIn: true,
        guest: {
          id: guest.id,
          fullName: guest.fullName,
          status: guest.status,
          checkedInAt: guest.checkedInAt,
          confirmedAdults: guest.confirmedAdults ?? 0,
          confirmedChildren: guest.confirmedChildren ?? 0,
        },
      });
    }

    const updated = await prisma.rsvpGuest.update({
      where: { id: guest.id },
      data: {
        checkedInAt: new Date(),
        status: guest.status === 'PENDING' ? 'CONFIRMED' : undefined,
        confirmedAt: guest.status === 'PENDING' ? new Date() : undefined,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        checkedInAt: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: false,
      guest: {
        id: updated.id,
        fullName: updated.fullName,
        status: updated.status,
        checkedInAt: updated.checkedInAt,
        confirmedAdults: updated.confirmedAdults ?? 0,
        confirmedChildren: updated.confirmedChildren ?? 0,
      },
    });
  } catch (error) {
    console.error('Erro no scanner publico de check-in RSVP:', error);
    return NextResponse.json({ error: 'Erro ao processar check-in' }, { status: 500 });
  }
}

