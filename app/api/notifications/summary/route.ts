import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationEvent = {
  id: string;
  type: "payment" | "message" | "rsvp";
  guestName: string;
  text: string;
  at: string;
  href: string;
};

export async function GET(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const giftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    if (!giftListId) {
      return NextResponse.json({ unreadCount: 0, latestEventAt: null, events: [] });
    }

    const { searchParams } = new URL(request.url);
    const sinceRaw = searchParams.get("since");
    const sinceDate = sinceRaw ? new Date(sinceRaw) : null;
    const since = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

    const [paidOrders, recentMessages, recentRsvp] = await Promise.all([
      prisma.order.findMany({
        where: {
          giftListId,
          status: { in: ["PAID", "AUTHORIZED"] },
          ...(since ? { createdAt: { gt: since } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          guestName: true,
          createdAt: true,
        },
      }),
      prisma.message.findMany({
        where: {
          giftListId,
          order: {
            status: { in: ["PAID", "AUTHORIZED"] },
          },
          ...(since ? { createdAt: { gt: since } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          guestName: true,
          createdAt: true,
        },
      }),
      prisma.rsvpGuest.findMany({
        where: {
          giftListId,
          status: "CONFIRMED",
          confirmedAt: { not: null },
          ...(since ? { confirmedAt: { gt: since } } : {}),
        },
        orderBy: { confirmedAt: "desc" },
        take: 8,
        select: {
          id: true,
          fullName: true,
          confirmedAt: true,
        },
      }),
    ]);

    const allEvents: NotificationEvent[] = [
      ...paidOrders.map((order) => ({
        id: `payment:${order.id}`,
        type: "payment" as const,
        guestName: order.guestName || "Convidado",
        text: `Voce recebeu um presente de ${order.guestName || "Convidado"}.`,
        at: new Date(order.createdAt).toISOString(),
        href: "/dashboard/pagamentos",
      })),
      ...recentMessages.map((message) => ({
        id: `message:${message.id}`,
        type: "message" as const,
        guestName: message.guestName || "Convidado",
        text: `${message.guestName || "Convidado"} deixou um recado.`,
        at: new Date(message.createdAt).toISOString(),
        href: "/dashboard/recados",
      })),
      ...recentRsvp.map((guest) => ({
        id: `rsvp:${guest.id}`,
        type: "rsvp" as const,
        guestName: guest.fullName || "Convidado",
        text: `${guest.fullName || "Convidado"} confirmou presenca.`,
        at: new Date(guest.confirmedAt as Date).toISOString(),
        href: "/dashboard/rsvp",
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    const latestEventAt = allEvents[0]?.at ?? null;
    const unreadCount = since
      ? allEvents.filter((event) => new Date(event.at).getTime() > since.getTime()).length
      : allEvents.length;

    return NextResponse.json({
      unreadCount,
      latestEventAt,
      events: allEvents,
    });
  } catch (error) {
    console.error("Erro ao carregar resumo de notificacoes:", error);
    return NextResponse.json({ error: "Erro ao carregar notificacoes" }, { status: 500 });
  }
}
