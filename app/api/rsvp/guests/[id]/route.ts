import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  notes: z.string().max(300).optional().or(z.literal("")),
  adultLimit: z.coerce.number().int().min(0).max(20).optional(),
  childLimit: z.coerce.number().int().min(0).max(20).optional(),
  confirmedAdults: z.coerce.number().int().min(1).max(40).optional(),
  confirmedChildren: z.coerce.number().int().min(0).max(40).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGiftListId(userId: string) {
  return getPrimaryGiftListIdForUser(userId);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftListId = await getGiftListId(ctx.effectiveUserId);
    if (!giftListId) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const guest = await prisma.rsvpGuest.findFirst({
      where: { id: params.id, giftListId },
      select: { id: true, status: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Convidado nao encontrado" }, { status: 404 });
    }

    const nextStatus = parsed.status || guest.status;

    const updated = await prisma.rsvpGuest.update({
      where: { id: params.id },
      data: {
        fullName: parsed.fullName?.trim(),
        notes: typeof parsed.notes === "string" ? parsed.notes.trim() || null : undefined,
        adultLimit: typeof parsed.adultLimit === "number" ? parsed.adultLimit : undefined,
        childLimit: typeof parsed.childLimit === "number" ? parsed.childLimit : undefined,
        confirmedAdults: typeof parsed.confirmedAdults === "number" ? parsed.confirmedAdults : undefined,
        confirmedChildren: typeof parsed.confirmedChildren === "number" ? parsed.confirmedChildren : undefined,
        status: parsed.status,
        confirmedAt:
          nextStatus === "CONFIRMED"
            ? guest.status === "CONFIRMED"
              ? undefined
              : new Date()
            : parsed.status
            ? null
            : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Erro ao atualizar convidado RSVP:", error);
    return NextResponse.json({ error: "Erro ao atualizar convidado" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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
      select: { id: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Convidado nao encontrado" }, { status: 404 });
    }

    await prisma.rsvpGuest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir convidado RSVP:", error);
    return NextResponse.json({ error: "Erro ao excluir convidado" }, { status: 500 });
  }
}
