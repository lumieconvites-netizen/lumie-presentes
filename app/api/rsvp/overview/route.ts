import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl, getPublicCheckInUrl, normalizeCheckInSlug } from "@/lib/rsvp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftList = await prisma.giftList.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        slug: true,
        title: true,
        isPublished: true,
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const [settings, guests] = await Promise.all([
      prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
      prisma.rsvpGuest.findMany({
        where: { giftListId: giftList.id },
        orderBy: [{ createdAt: "desc" }],
      }),
    ]);

    const totalGuests = guests.length;
    const confirmed = guests.filter((g) => g.status === "CONFIRMED").length;
    const declined = guests.filter((g) => g.status === "DECLINED").length;
    const pending = guests.filter((g) => g.status === "PENDING").length;
    const checkedIn = guests.filter((g) => !!g.checkedInAt).length;
    const resolvedCheckInSlug = settings?.checkInSlug || normalizeCheckInSlug(giftList.slug);

    return NextResponse.json({
      list: giftList,
      publicBaseUrl: getPublicBaseUrl(),
      publicRsvpUrl: `${getPublicBaseUrl()}/site/${encodeURIComponent(giftList.slug)}/confirmar-presenca`,
      publicCheckInUrl: getPublicCheckInUrl(resolvedCheckInSlug),
      settings: settings
        ? { ...settings, checkInSlug: settings.checkInSlug || resolvedCheckInSlug }
        : {
            enabled: false,
            notificationEmail: session.user.email ?? null,
            eventTitle: giftList.title,
            eventDateLabel: null,
            eventLocation: null,
            coverImageUrl: null,
            publicTitle: "Confirmar Presenca",
            publicDescription: "Confirme sua presença no evento.",
            searchPlaceholder: "Digite seu nome completo",
            checkInEnabled: true,
            checkInSlug: resolvedCheckInSlug,
          },
      metrics: {
        totalGuests,
        confirmed,
        pending,
        declined,
        checkedIn,
      },
      guests,
    });
  } catch (error) {
    console.error("Erro ao carregar overview RSVP:", error);
    return NextResponse.json({ error: "Erro ao carregar RSVP" }, { status: 500 });
  }
}

