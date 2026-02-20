import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createCheckInCode, createQrToken, normalizeGuestName } from "@/lib/rsvp";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

const guestSchema = z.object({
  fullName: z.string().min(2, "Nome completo e obrigatorio"),
  notes: z.string().max(300).optional().or(z.literal("")),
  adultLimit: z.coerce.number().int().min(0).max(20).optional(),
  childLimit: z.coerce.number().int().min(0).max(20).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]).optional(),
});

const importGuestSchema = z.object({
  fullName: z.string().min(2, "Nome completo e obrigatorio"),
  notes: z.string().optional(),
  adultLimit: z.coerce.number().int().min(0).max(20).optional(),
  childLimit: z.coerce.number().int().min(0).max(20).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]).optional(),
});

const importSchema = z.object({
  guests: z.array(importGuestSchema).min(1, "Informe pelo menos um convidado"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getGiftListId(userId: string) {
  return getPrimaryGiftListIdForUser(userId);
}

export async function GET(req: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftListId = await getGiftListId(ctx.effectiveUserId);
    if (!giftListId) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const status = searchParams.get("status") as "PENDING" | "CONFIRMED" | "DECLINED" | null;

    const guests = await prisma.rsvpGuest.findMany({
      where: {
        giftListId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ fullName: "asc" }],
    });

    const filtered = q
      ? guests.filter((guest) => {
          const target = `${guest.fullName}`.toLowerCase();
          return target.includes(q);
        })
      : guests;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Erro ao listar convidados RSVP:", error);
    return NextResponse.json({ error: "Erro ao listar convidados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    if (Array.isArray(body?.guests)) {
      const parsedImport = importSchema.parse(body);

      const existing = await prisma.rsvpGuest.findMany({ where: { giftListId }, select: { fullName: true } });
      const existingNames = new Set(existing.map((g) => normalizeGuestName(g.fullName)));

      const toCreate = parsedImport.guests
        .filter((g) => !existingNames.has(normalizeGuestName(g.fullName)))
        .map((g) => ({
          giftListId,
          fullName: g.fullName.trim(),
          email: null,
          phone: null,
          notes: g.notes?.trim() || null,
          adultLimit: g.adultLimit ?? 0,
          childLimit: g.childLimit ?? 0,
          status: g.status || "PENDING",
          qrToken: createQrToken(),
          checkInCode: createCheckInCode(),
          confirmedAt: g.status === "CONFIRMED" ? new Date() : null,
          confirmedAdults: g.status === "CONFIRMED" ? 1 : null,
          confirmedChildren: g.status === "CONFIRMED" ? 0 : null,
        }));

      if (toCreate.length === 0) {
        return NextResponse.json({ created: 0, message: "Nenhum convidado novo para importar" });
      }

      await prisma.rsvpGuest.createMany({ data: toCreate });
      return NextResponse.json({ created: toCreate.length });
    }

    const parsed = guestSchema.parse(body);

    const normalizedName = normalizeGuestName(parsed.fullName);
    const exists = await prisma.rsvpGuest.findMany({ where: { giftListId }, select: { fullName: true } });
    const found = exists.some((g) => normalizeGuestName(g.fullName) === normalizedName);
    if (found) {
      return NextResponse.json({ error: "Ja existe convidado com esse nome" }, { status: 400 });
    }

    const guest = await prisma.rsvpGuest.create({
      data: {
        giftListId,
        fullName: parsed.fullName.trim(),
        email: null,
        phone: null,
        notes: parsed.notes?.trim() || null,
        adultLimit: parsed.adultLimit ?? 0,
        childLimit: parsed.childLimit ?? 0,
        status: parsed.status || "PENDING",
        qrToken: createQrToken(),
        checkInCode: createCheckInCode(),
        confirmedAt: parsed.status === "CONFIRMED" ? new Date() : null,
        confirmedAdults: parsed.status === "CONFIRMED" ? 1 : null,
        confirmedChildren: parsed.status === "CONFIRMED" ? 0 : null,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Erro ao criar convidado RSVP:", error);
    return NextResponse.json({ error: "Erro ao criar convidado" }, { status: 500 });
  }
}
