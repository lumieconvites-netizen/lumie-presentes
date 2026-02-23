import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const giftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    if (!giftListId) return NextResponse.json({ unreadCount: 0, unreadPayments: 0, unreadRsvp: 0, latestEventAt: null });

    const { searchParams } = new URL(request.url);
    const sinceRaw = searchParams.get("since");
    const sinceDate = sinceRaw ? new Date(sinceRaw) : null;
    const since = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

    const [latestPaidOrder, latestConfirmedRsvp, unreadPayments, unreadRsvp] = await Promise.all([
      prisma.order.findFirst({
        where: {
          giftListId,
          status: { in: ["PAID", "AUTHORIZED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.rsvpGuest.findFirst({
        where: {
          giftListId,
          status: "CONFIRMED",
          confirmedAt: { not: null },
        },
        orderBy: { confirmedAt: "desc" },
        select: { confirmedAt: true },
      }),
      prisma.order.count({
        where: {
          giftListId,
          status: { in: ["PAID", "AUTHORIZED"] },
          ...(since ? { createdAt: { gt: since } } : {}),
        },
      }),
      prisma.rsvpGuest.count({
        where: {
          giftListId,
          status: "CONFIRMED",
          confirmedAt: { not: null, ...(since ? { gt: since } : {}) },
        },
      }),
    ]);

    const latestCandidates = [
      latestPaidOrder?.createdAt ? new Date(latestPaidOrder.createdAt) : null,
      latestConfirmedRsvp?.confirmedAt ? new Date(latestConfirmedRsvp.confirmedAt) : null,
    ].filter(Boolean) as Date[];

    const latestEventAt =
      latestCandidates.length > 0
        ? new Date(Math.max(...latestCandidates.map((d) => d.getTime()))).toISOString()
        : null;

    return NextResponse.json({
      unreadCount: unreadPayments + unreadRsvp,
      unreadPayments,
      unreadRsvp,
      latestEventAt,
    });
  } catch (error) {
    console.error("Erro ao carregar resumo de notificacoes:", error);
    return NextResponse.json({ error: "Erro ao carregar notificacoes" }, { status: 500 });
  }
}
