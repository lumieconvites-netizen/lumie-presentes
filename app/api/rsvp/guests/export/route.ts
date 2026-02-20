import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCsv(value: string) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

export async function GET() {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftList = await prisma.giftList.findFirst({
      where: { userId: ctx.effectiveUserId },
      select: { id: true, slug: true },
    });

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const guests = await prisma.rsvpGuest.findMany({
      where: { giftListId: giftList.id, status: "CONFIRMED" },
      orderBy: [{ fullName: "asc" }],
    });

    const lines = [
      [
        "Nome",
        "Limite Adultos",
        "Limite Criancas",
        "Confirmados Adultos",
        "Confirmados Criancas",
        "Status",
        "Confirmado em",
        "Check-in em",
        "Codigo",
      ],
      ...guests.map((guest) => [
        guest.fullName,
        String(guest.adultLimit || 0),
        String(guest.childLimit || 0),
        String(guest.confirmedAdults ?? ""),
        String(guest.confirmedChildren ?? ""),
        guest.status,
        guest.confirmedAt ? guest.confirmedAt.toISOString() : "",
        guest.checkedInAt ? guest.checkedInAt.toISOString() : "",
        guest.checkInCode || "",
      ]),
    ];

    const csv = lines.map((cols) => cols.map((col) => escapeCsv(col)).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rsvp-${giftList.slug}.csv"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar RSVP:", error);
    return NextResponse.json({ error: "Erro ao exportar lista" }, { status: 500 });
  }
}
