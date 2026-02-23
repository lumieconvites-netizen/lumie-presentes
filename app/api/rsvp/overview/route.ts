import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl, getPublicCheckInUrl, normalizeCheckInSlug } from "@/lib/rsvp";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    if (!primaryGiftListId) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const giftList = await prisma.giftList.findUnique({
      where: { id: primaryGiftListId },
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

    const parsedUrl = new URL(request.url);
    const resolvedView = parsedUrl.searchParams.get("view");

    if (resolvedView === "dashboard") {
      const [settings, totalGuests, confirmed, declined, pending, checkedIn] = await Promise.all([
        prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
        prisma.rsvpGuest.count({ where: { giftListId: giftList.id } }),
        prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "CONFIRMED" } }),
        prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "DECLINED" } }),
        prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "PENDING" } }),
        prisma.rsvpGuest.count({ where: { giftListId: giftList.id, checkedInAt: { not: null } } }),
      ]);
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
              notificationEmail: ctx.effectiveUser.email ?? null,
              eventTitle: giftList.title,
              eventDateLabel: null,
              eventLocation: null,
              coverImageUrl: null,
              publicTitle: "Confirmar Presenca",
              publicDescription: "Confirme sua presenca no evento.",
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
      });
    }

    if (resolvedView === "checkin") {
      const [settings, guests] = await Promise.all([
        prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
        prisma.rsvpGuest.findMany({
          where: { giftListId: giftList.id },
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            fullName: true,
            status: true,
            checkedInAt: true,
            confirmedAdults: true,
            confirmedChildren: true,
            checkInCode: true,
          },
        }),
      ]);
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
              notificationEmail: ctx.effectiveUser.email ?? null,
              eventTitle: giftList.title,
              eventDateLabel: null,
              eventLocation: null,
              coverImageUrl: null,
              publicTitle: "Confirmar Presenca",
              publicDescription: "Confirme sua presenca no evento.",
              searchPlaceholder: "Digite seu nome completo",
              checkInEnabled: true,
              checkInSlug: resolvedCheckInSlug,
            },
        guests,
      });
    }

    const [settings, guests, totalGuests, confirmed, declined, pending, checkedIn] = await Promise.all([
      prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
      prisma.rsvpGuest.findMany({
        where: { giftListId: giftList.id },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.rsvpGuest.count({ where: { giftListId: giftList.id } }),
      prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "CONFIRMED" } }),
      prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "DECLINED" } }),
      prisma.rsvpGuest.count({ where: { giftListId: giftList.id, status: "PENDING" } }),
      prisma.rsvpGuest.count({ where: { giftListId: giftList.id, checkedInAt: { not: null } } }),
    ]);

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
            notificationEmail: ctx.effectiveUser.email ?? null,
            eventTitle: giftList.title,
            eventDateLabel: null,
            eventLocation: null,
            coverImageUrl: null,
            publicTitle: "Confirmar Presenca",
            publicDescription: "Confirme sua presenca no evento.",
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
