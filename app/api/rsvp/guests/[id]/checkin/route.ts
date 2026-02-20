import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGiftListId(userId: string) {
  const giftList = await prisma.giftList.findFirst({ where: { userId }, select: { id: true } });
  return giftList?.id || null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftListId = await getGiftListId(ctx.effectiveUserId);
    if (!giftListId) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const guest = await prisma.rsvpGuest.findFirst({
      where: { id: params.id, giftListId },
      select: { id: true, checkedInAt: true, status: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Convidado nao encontrado" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const makeCheckin = typeof body?.checkedIn === "boolean" ? body.checkedIn : !guest.checkedInAt;

    const updated = await prisma.rsvpGuest.update({
      where: { id: params.id },
      data: {
        checkedInAt: makeCheckin ? new Date() : null,
        status: guest.status === "PENDING" && makeCheckin ? "CONFIRMED" : undefined,
        confirmedAt: guest.status === "PENDING" && makeCheckin ? new Date() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar check-in:", error);
    return NextResponse.json({ error: "Erro ao atualizar check-in" }, { status: 500 });
  }
}
