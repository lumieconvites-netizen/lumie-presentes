import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeGuestName } from "@/lib/rsvp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = decodeURIComponent(params.slug);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const list = await prisma.giftList.findUnique({
      where: { slug },
      select: {
        id: true,
        isPublished: true,
        rsvpSettings: {
          select: {
            enabled: true,
          },
        },
      },
    });

    if (!list || !list.isPublished || !list.rsvpSettings?.enabled) {
      return NextResponse.json({ results: [] });
    }

    const normalizedQ = normalizeGuestName(q);

    const guests = await prisma.rsvpGuest.findMany({
      where: {
        giftListId: list.id,
        status: "PENDING",
        fullName: {
          contains: q,
          mode: "insensitive",
        },
      },
      orderBy: [{ fullName: "asc" }],
      take: 200,
      select: {
        id: true,
        fullName: true,
        adultLimit: true,
        childLimit: true,
        status: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    const results = guests.filter((guest) => normalizeGuestName(guest.fullName).includes(normalizedQ)).slice(0, 20);

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Erro ao buscar convidados publicos RSVP:", error);
    return NextResponse.json({ error: "Erro ao buscar convidados" }, { status: 500 });
  }
}
