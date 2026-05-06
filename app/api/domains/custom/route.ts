import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";
import { buildDomainSuggestions, normalizeSupportedDomain } from "@/lib/custom-domains";
import { resolveEffectivePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AvailabilityResult = {
  domain: string;
  available: boolean | null;
  error?: string;
};

async function fetchVercelAvailability(domain: string): Promise<AvailabilityResult> {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim();

  if (!token) {
    return { domain, available: null, error: "VERCEL_API_TOKEN nao configurado" };
  }

  const url = new URL(`https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/availability`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return { domain, available: null, error: `Vercel ${response.status}` };
  }

  const data = await response.json();
  return { domain, available: Boolean(data?.available) };
}

async function getDomainContext() {
  const ctx = await getActingUserContext();
  if (!ctx) return null;

  const [user, giftListId] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ctx.effectiveUserId },
      select: { id: true, plan: true, planExpiresAt: true },
    }),
    getPrimaryGiftListIdForUser(ctx.effectiveUserId),
  ]);

  if (!user || !giftListId) return { ctx, user, giftListId: null, effectivePlan: "FREE" as const };
  return { ctx, user, giftListId, effectivePlan: resolveEffectivePlan(user) };
}

export async function GET() {
  const data = await getDomainContext();
  if (!data) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const customDomain = data.giftListId
    ? await prisma.customDomain.findFirst({
        where: { giftListId: data.giftListId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          domain: true,
          status: true,
          availabilityCheckedAt: true,
          registeredAt: true,
          expiresAt: true,
          lastError: true,
          createdAt: true,
        },
      })
    : null;

  return NextResponse.json({
    plan: data.effectivePlan,
    enabled: data.effectivePlan === "PREMIUM",
    customDomain,
    supportedTlds: ["com", "site", "net"],
    vercelConfigured: Boolean(process.env.VERCEL_API_TOKEN?.trim()),
  });
}

export async function POST(request: Request) {
  const data = await getDomainContext();
  if (!data) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (!data.giftListId) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
  if (data.effectivePlan !== "PREMIUM") {
    return NextResponse.json({ error: "Dominio personalizado esta disponivel apenas no plano Premium." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "search";

  if (action === "search") {
    const query = typeof body?.query === "string" ? body.query : "";
    const suggestions = buildDomainSuggestions(query);
    if (!suggestions.length) {
      return NextResponse.json({ error: "Digite pelo menos 3 caracteres para buscar." }, { status: 400 });
    }

    const results = await Promise.all(suggestions.map(fetchVercelAvailability));
    return NextResponse.json({ suggestions: results });
  }

  if (action === "select") {
    const domain = normalizeSupportedDomain(String(body?.domain ?? ""));
    if (!domain) {
      return NextResponse.json({ error: "Escolha um dominio .com, .site ou .net valido." }, { status: 400 });
    }

    const availability = await fetchVercelAvailability(domain);
    if (availability.available === false) {
      return NextResponse.json({ error: "Este dominio nao esta disponivel." }, { status: 409 });
    }

    const existing = await prisma.customDomain.findUnique({
      where: { domain },
      select: { id: true, userId: true },
    });

    if (existing && existing.userId !== data.ctx.effectiveUserId) {
      return NextResponse.json({ error: "Este dominio ja esta vinculado a outra lista." }, { status: 409 });
    }

    const customDomain = existing
      ? await prisma.customDomain.update({
          where: { id: existing.id },
          data: {
            giftListId: data.giftListId,
            status: "SELECTED",
            availabilityCheckedAt: new Date(),
            lastError: availability.error ?? null,
          },
          select: {
            id: true,
            domain: true,
            status: true,
            availabilityCheckedAt: true,
            lastError: true,
          },
        })
      : await prisma.customDomain.create({
          data: {
            userId: data.ctx.effectiveUserId,
            giftListId: data.giftListId,
            domain,
            status: "SELECTED",
            availabilityCheckedAt: new Date(),
            lastError: availability.error ?? null,
          },
          select: {
            id: true,
            domain: true,
            status: true,
            availabilityCheckedAt: true,
            lastError: true,
          },
        });

    return NextResponse.json({ customDomain });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}
