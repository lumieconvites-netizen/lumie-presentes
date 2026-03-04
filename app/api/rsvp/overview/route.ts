import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl, getPublicCheckInUrl, normalizeCheckInSlug } from "@/lib/rsvp";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getRsvpMetrics(giftListId: string) {
  const [totalGuests, checkedIn, grouped] = await Promise.all([
    prisma.rsvpGuest.count({ where: { giftListId } }),
    prisma.rsvpGuest.count({ where: { giftListId, checkedInAt: { not: null } } }),
    prisma.rsvpGuest.groupBy({
      by: ["status"],
      where: { giftListId },
      _count: { _all: true },
    }),
  ]);

  const counts = grouped.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalGuests,
    confirmed: counts.CONFIRMED ?? 0,
    pending: counts.PENDING ?? 0,
    declined: counts.DECLINED ?? 0,
    checkedIn,
  };
}

async function getCheckInMetrics(giftListId: string) {
  const [expected, checkedIn] = await Promise.all([
    prisma.rsvpGuest.count({ where: { giftListId, status: "CONFIRMED" } }),
    prisma.rsvpGuest.count({ where: { giftListId, checkedInAt: { not: null } } }),
  ]);

  return {
    expected,
    checkedIn,
    remaining: Math.max(expected - checkedIn, 0),
  };
}

async function getCheckInGuestsSafely(giftListId: string) {
  try {
    return await prisma.rsvpGuest.findMany({
      where: { giftListId },
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
    });
  } catch (error) {
    console.error("Falha ao carregar convidados com checkInCode, aplicando fallback:", error);
    const guests = await prisma.rsvpGuest.findMany({
      where: { giftListId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        fullName: true,
        status: true,
        checkedInAt: true,
        confirmedAdults: true,
        confirmedChildren: true,
      },
    });

    return guests.map((guest) => ({ ...guest, checkInCode: null as string | null }));
  }
}

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
      const [settings, metrics] = await Promise.all([
        prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
        getRsvpMetrics(giftList.id),
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
        metrics,
      });
    }

    if (resolvedView === "checkin") {
      const includeGuests = parsedUrl.searchParams.get("includeGuests") === "1";
      const [settings, metrics, guests] = await Promise.all([
        prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
        getCheckInMetrics(giftList.id),
        includeGuests ? getCheckInGuestsSafely(giftList.id) : Promise.resolve([]),
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
        metrics,
        guests,
      });
    }

    if (resolvedView === "config") {
      const [settings, guests] = await Promise.all([
        prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
        prisma.rsvpGuest.findMany({
          where: { giftListId: giftList.id },
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            fullName: true,
            notes: true,
            adultLimit: true,
            childLimit: true,
            confirmedAdults: true,
            confirmedChildren: true,
            status: true,
            qrToken: true,
            confirmedAt: true,
            checkedInAt: true,
            checkInCode: true,
            createdAt: true,
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

    const [settings, guests, metrics] = await Promise.all([
      prisma.rsvpSettings.findUnique({ where: { giftListId: giftList.id } }),
      prisma.rsvpGuest.findMany({
        where: { giftListId: giftList.id },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          fullName: true,
          notes: true,
          adultLimit: true,
          childLimit: true,
          confirmedAdults: true,
          confirmedChildren: true,
          status: true,
          qrToken: true,
          confirmedAt: true,
          checkedInAt: true,
          checkInCode: true,
          createdAt: true,
        },
      }),
      getRsvpMetrics(giftList.id),
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
      metrics,
      guests,
    });
  } catch (error) {
    console.error("Erro ao carregar overview RSVP:", error);
    return NextResponse.json({ error: "Erro ao carregar RSVP" }, { status: 500 });
  }
}
