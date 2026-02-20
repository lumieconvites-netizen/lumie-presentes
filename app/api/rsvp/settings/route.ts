import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeCheckInSlug } from "@/lib/rsvp";
import { getActingUserContext } from "@/lib/acting-user";

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  notificationEmail: z.string().optional().or(z.literal("")),
  eventTitle: z.string().max(140).optional(),
  eventDateLabel: z.string().max(120).optional().or(z.literal("")),
  eventLocation: z.string().max(240).optional().or(z.literal("")),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  publicTitle: z.string().max(140).optional().or(z.literal("")),
  publicDescription: z.string().max(500).optional().or(z.literal("")),
  searchPlaceholder: z.string().max(120).optional().or(z.literal("")),
  checkInEnabled: z.boolean().optional(),
  checkInSlug: z.string().max(120).optional().or(z.literal("")),
});

function sanitizeEmail(value?: string | null) {
  if (!value) return null;
  const email = value.trim();
  if (!email) return null;
  const valid = z.string().email().safeParse(email).success;
  return valid ? email : null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftList = await prisma.giftList.findFirst({ where: { userId: ctx.effectiveUserId }, select: { id: true, title: true, slug: true } });
    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const payload = settingsSchema.parse(body);
    const currentSettings = await prisma.rsvpSettings.findUnique({
      where: { giftListId: giftList.id },
      select: { checkInSlug: true },
    });
    const defaultCheckInSlug = normalizeCheckInSlug(giftList.slug) || giftList.id;

    const data: any = {};
    if (typeof payload.enabled === "boolean") data.enabled = payload.enabled;
    if (typeof payload.checkInEnabled === "boolean") data.checkInEnabled = payload.checkInEnabled;
    if (typeof payload.notificationEmail === "string") data.notificationEmail = sanitizeEmail(payload.notificationEmail);
    if (typeof payload.eventTitle === "string") data.eventTitle = payload.eventTitle.trim() || giftList.title;
    if (typeof payload.eventDateLabel === "string") data.eventDateLabel = payload.eventDateLabel.trim() || null;
    if (typeof payload.eventLocation === "string") data.eventLocation = payload.eventLocation.trim() || null;
    if (typeof payload.coverImageUrl === "string") data.coverImageUrl = payload.coverImageUrl.trim() || null;
    if (typeof payload.publicTitle === "string") data.publicTitle = payload.publicTitle.trim() || null;
    if (typeof payload.publicDescription === "string") data.publicDescription = payload.publicDescription.trim() || null;
    if (typeof payload.searchPlaceholder === "string") data.searchPlaceholder = payload.searchPlaceholder.trim() || null;
    if (typeof payload.checkInSlug === "string") {
      const normalized = normalizeCheckInSlug(payload.checkInSlug);
      data.checkInSlug = normalized || null;
    }

    const effectiveCheckInSlug =
      typeof data.checkInSlug !== "undefined"
        ? data.checkInSlug || defaultCheckInSlug
        : currentSettings?.checkInSlug || defaultCheckInSlug;

    if (effectiveCheckInSlug) {
      const explicitSlugConflict = await prisma.rsvpSettings.findFirst({
        where: {
          checkInSlug: effectiveCheckInSlug,
          NOT: { giftListId: giftList.id },
        },
        select: { id: true },
      });

      if (explicitSlugConflict) {
        return NextResponse.json({ error: "Este slug de check-in ja esta em uso." }, { status: 409 });
      }

      const fallbackSlugConflict = await prisma.giftList.findFirst({
        where: {
          id: { not: giftList.id },
          slug: effectiveCheckInSlug,
          OR: [
            { rsvpSettings: { is: null } },
            { rsvpSettings: { is: { checkInSlug: null } } },
          ],
        },
        select: { id: true },
      });

      if (fallbackSlugConflict) {
        return NextResponse.json({ error: "Este slug de check-in ja esta em uso." }, { status: 409 });
      }
    }

    const settings = await prisma.rsvpSettings.upsert({
      where: { giftListId: giftList.id },
      create: {
        giftListId: giftList.id,
        enabled: data.enabled ?? false,
        notificationEmail: data.notificationEmail ?? ctx.effectiveUser.email ?? null,
        eventTitle: data.eventTitle ?? giftList.title,
        eventDateLabel: data.eventDateLabel ?? null,
        eventLocation: data.eventLocation ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        publicTitle: data.publicTitle ?? "Confirmar Presenca",
        publicDescription: data.publicDescription ?? "Confirme sua presenca no evento.",
        searchPlaceholder: data.searchPlaceholder ?? "Ex: Isabella",
        checkInEnabled: data.checkInEnabled ?? true,
        checkInSlug: data.checkInSlug ?? defaultCheckInSlug,
      },
      update: data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Erro ao salvar configuracoes RSVP:", error);
    return NextResponse.json({ error: "Erro ao salvar configuracoes" }, { status: 500 });
  }
}
