import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const giftList = await prisma.giftList.findFirst({ where: { userId: session.user.id }, select: { id: true, title: true } });
    if (!giftList) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const payload = settingsSchema.parse(body);

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

    const settings = await prisma.rsvpSettings.upsert({
      where: { giftListId: giftList.id },
      create: {
        giftListId: giftList.id,
        enabled: data.enabled ?? false,
        notificationEmail: data.notificationEmail ?? session.user.email ?? null,
        eventTitle: data.eventTitle ?? giftList.title,
        eventDateLabel: data.eventDateLabel ?? null,
        eventLocation: data.eventLocation ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        publicTitle: data.publicTitle ?? "Confirmar Presença",
        publicDescription: data.publicDescription ?? "Confirme sua presença no evento.",
        searchPlaceholder: data.searchPlaceholder ?? "Ex: Isabella",
        checkInEnabled: data.checkInEnabled ?? true,
      },
      update: data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Erro ao salvar configurações RSVP:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}

