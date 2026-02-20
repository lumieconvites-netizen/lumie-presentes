import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCheckInSlug } from "@/lib/rsvp";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    const giftList = primaryGiftListId
      ? await prisma.giftList.findUnique({ where: { id: primaryGiftListId }, select: { id: true, slug: true } })
      : null;

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const url = new URL(req.url);
    const raw = (url.searchParams.get("slug") || "").trim();
    const normalized = normalizeCheckInSlug(raw);

    if (!normalized) {
      return NextResponse.json({ available: false, normalized: "", message: "Informe um slug valido." });
    }

    const explicitSlugConflict = await prisma.rsvpSettings.findFirst({
      where: {
        checkInSlug: normalized,
        NOT: { giftListId: giftList.id },
      },
      select: { id: true },
    });

    if (explicitSlugConflict) {
      return NextResponse.json({ available: false, normalized, message: "Este slug ja esta em uso." });
    }

    const fallbackSlugConflict = await prisma.giftList.findFirst({
      where: {
        id: { not: giftList.id },
        slug: normalized,
        OR: [{ rsvpSettings: { is: null } }, { rsvpSettings: { is: { checkInSlug: null } } }],
      },
      select: { id: true },
    });

    if (fallbackSlugConflict) {
      return NextResponse.json({ available: false, normalized, message: "Este slug ja esta em uso." });
    }

    return NextResponse.json({ available: true, normalized, message: "Slug disponivel." });
  } catch (error) {
    console.error("Erro ao validar disponibilidade do slug de check-in:", error);
    return NextResponse.json({ error: "Erro ao validar slug" }, { status: 500 });
  }
}
