import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getQrImageUrl, getQrPayload } from "@/lib/rsvp";
import { sendRsvpNotificationEmailReliable } from "@/lib/email-jobs";

const confirmSchema = z.object({
  guestId: z.string().min(1, "Convidado invalido"),
  status: z.enum(["CONFIRMED", "DECLINED"]).optional(),
  adultsCompanions: z.coerce.number().int().min(0).max(20).optional(),
  childrenCount: z.coerce.number().int().min(0).max(20).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = decodeURIComponent(params.slug);

    const list = await prisma.giftList.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
        rsvpSettings: true,
      },
    });

    if (!list || !list.isPublished) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    if (!list.rsvpSettings?.enabled) {
      return NextResponse.json({ error: "RSVP ainda nao foi habilitado para esta lista" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = confirmSchema.parse(body);

    const nextStatus = parsed.status || "CONFIRMED";
    const adultsCompanions = parsed.adultsCompanions ?? 0;
    const childrenCount = parsed.childrenCount ?? 0;

    const guest = await prisma.rsvpGuest.findFirst({
      where: {
        id: parsed.guestId,
        giftListId: list.id,
      },
      select: {
        id: true,
        fullName: true,
        qrToken: true,
        checkInCode: true,
        confirmedAt: true,
        adultLimit: true,
        childLimit: true,
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Convidado nao encontrado na lista deste evento." }, { status: 404 });
    }

    if (nextStatus === "CONFIRMED") {
      if (adultsCompanions > guest.adultLimit) {
        return NextResponse.json(
          { error: `Este convidado permite ate ${guest.adultLimit} acompanhante(s) adulto(s).` },
          { status: 400 }
        );
      }

      if (childrenCount > guest.childLimit) {
        return NextResponse.json(
          { error: `Este convidado permite ate ${guest.childLimit} crianca(s).` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.rsvpGuest.update({
      where: { id: guest.id },
      data: {
        status: nextStatus,
        confirmedAt: nextStatus === "CONFIRMED" ? new Date() : null,
        confirmedAdults: nextStatus === "CONFIRMED" ? adultsCompanions + 1 : null,
        confirmedChildren: nextStatus === "CONFIRMED" ? childrenCount : null,
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        qrToken: true,
        checkInCode: true,
        confirmedAt: true,
        adultLimit: true,
        childLimit: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    if (list.rsvpSettings.notificationEmail) {
      try {
        await sendRsvpNotificationEmailReliable({
          to: list.rsvpSettings.notificationEmail,
          eventTitle: list.rsvpSettings.eventTitle || list.title,
          guestName: updated.fullName,
          status: nextStatus,
        });
      } catch (mailError) {
        console.error("Falha ao enviar notificacao RSVP por e-mail:", mailError);
      }
    }

    const payload = getQrPayload(updated.qrToken, list.slug);

    return NextResponse.json({
      guest: updated,
      eventTitle: list.rsvpSettings.eventTitle || list.title,
      status: nextStatus,
      qrPayload: payload,
      qrImageUrl: getQrImageUrl(payload, 320),
      totals: {
        adults: updated.confirmedAdults ?? 0,
        children: updated.confirmedChildren ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Erro ao confirmar RSVP:", error);
    return NextResponse.json({ error: "Erro ao confirmar presenca" }, { status: 500 });
  }
}
