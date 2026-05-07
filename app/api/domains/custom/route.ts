import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";
import { buildDomainSuggestions, normalizeSupportedDomain } from "@/lib/custom-domains";
import {
  ensurePremiumDomainEntitlementForUser,
  getDomainEntitlementForUser,
  markExpiredDomainEntitlements,
  reserveDomainEntitlementForUser,
  summarizeDomainEntitlement,
} from "@/lib/domain-entitlements";
import { checkRegistrarAvailability, prepareRegistrarRegistration } from "@/lib/domain-registrars";
import { syncCustomDomainProvisioning } from "@/lib/domain-provisioning";
import { resolveEffectivePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const data = await getDomainContext();
    if (!data) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    if (data.effectivePlan === "PREMIUM") {
      await ensurePremiumDomainEntitlementForUser(data.ctx.effectiveUserId);
    }
    await markExpiredDomainEntitlements(data.ctx.effectiveUserId);

    let customDomain = data.giftListId
      ? await prisma.customDomain.findFirst({
          where: { giftListId: data.giftListId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            domain: true,
            status: true,
            registrarOrderId: true,
            registrarOrderStatus: true,
            purchaseAttemptedAt: true,
            projectDomainVerifiedAt: true,
            availabilityCheckedAt: true,
            registeredAt: true,
            expiresAt: true,
            lastError: true,
            createdAt: true,
          },
        })
      : null;
    if (customDomain?.status === "PURCHASE_PENDING") {
      customDomain = await syncCustomDomainProvisioning(customDomain.id).catch((error) => {
        console.error("Erro ao sincronizar dominio personalizado:", error);
        return customDomain;
      });
    }
    const entitlement = await getDomainEntitlementForUser(data.ctx.effectiveUserId);

    return NextResponse.json({
      plan: data.effectivePlan,
      enabled: data.effectivePlan === "PREMIUM",
      customDomain,
      entitlement: summarizeDomainEntitlement(entitlement),
      supportedTlds: ["com", "site", "net"],
      vercelConfigured: Boolean(process.env.VERCEL_API_TOKEN?.trim()),
    });
  } catch (error) {
    console.error("Erro ao carregar dominio personalizado:", error);
    return NextResponse.json({ error: "Erro ao carregar domínio personalizado." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await getDomainContext();
    if (!data) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    if (!data.giftListId) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    if (data.effectivePlan !== "PREMIUM") {
      return NextResponse.json({ error: "Dominio personalizado esta disponivel apenas no plano Premium." }, { status: 403 });
    }
    await ensurePremiumDomainEntitlementForUser(data.ctx.effectiveUserId);
    await markExpiredDomainEntitlements(data.ctx.effectiveUserId);

    const body = await request.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action : "search";

    if (action === "search") {
      const query = typeof body?.query === "string" ? body.query : "";
      const suggestions = buildDomainSuggestions(query);
      if (!suggestions.length) {
        return NextResponse.json({ error: "Digite pelo menos 3 caracteres para buscar." }, { status: 400 });
      }

      const results = await Promise.all(suggestions.map(checkRegistrarAvailability));
      return NextResponse.json({ suggestions: results });
    }

    if (action === "select") {
      const domain = normalizeSupportedDomain(String(body?.domain ?? ""));
      if (!domain) {
        return NextResponse.json({ error: "Escolha um dominio .com, .site ou .net valido." }, { status: 400 });
      }

      const entitlement = await getDomainEntitlementForUser(data.ctx.effectiveUserId);
      const activeEntitlement = entitlement.reserved ?? entitlement.available;
      if (!activeEntitlement) {
        return NextResponse.json(
          { error: "Nenhum direito de dominio disponivel para esta conta. Ative um plano antes de continuar." },
          { status: 409 }
        );
      }

      const availability = await checkRegistrarAvailability(domain);
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

      const currentCustomDomain = await prisma.customDomain.findFirst({
        where: { giftListId: data.giftListId, userId: data.ctx.effectiveUserId },
        orderBy: { createdAt: "desc" },
        select: { id: true, domain: true, status: true },
      });

      const registrationPreparation = await prepareRegistrarRegistration({
        domain,
        userId: data.ctx.effectiveUserId,
        giftListId: data.giftListId,
      });

      const customDomain = currentCustomDomain
        ? await prisma.customDomain.update({
            where: { id: currentCustomDomain.id },
            data: {
              domain,
              status: "PURCHASE_PENDING",
              registrarOrderId: null,
              registrarOrderStatus: null,
              purchaseAttemptedAt: null,
              projectDomainVerifiedAt: null,
              registeredAt: null,
              availabilityCheckedAt: new Date(),
              expiresAt: activeEntitlement.expiresAt ?? null,
              lastError: registrationPreparation.ok ? null : registrationPreparation.message,
            },
            select: {
              id: true,
              domain: true,
              status: true,
              registrarOrderId: true,
              registrarOrderStatus: true,
              purchaseAttemptedAt: true,
              projectDomainVerifiedAt: true,
              availabilityCheckedAt: true,
              registeredAt: true,
              expiresAt: true,
              lastError: true,
              createdAt: true,
            },
          })
        : await prisma.customDomain.create({
            data: {
              userId: data.ctx.effectiveUserId,
              giftListId: data.giftListId,
              domain,
              status: "PURCHASE_PENDING",
              registrarOrderId: null,
              registrarOrderStatus: null,
              purchaseAttemptedAt: null,
              projectDomainVerifiedAt: null,
              availabilityCheckedAt: new Date(),
              expiresAt: activeEntitlement.expiresAt ?? null,
              lastError: registrationPreparation.ok ? null : registrationPreparation.message,
            },
            select: {
              id: true,
              domain: true,
              status: true,
              registrarOrderId: true,
              registrarOrderStatus: true,
              purchaseAttemptedAt: true,
              projectDomainVerifiedAt: true,
              availabilityCheckedAt: true,
              registeredAt: true,
              expiresAt: true,
              lastError: true,
              createdAt: true,
            },
          });

      const reserved = await reserveDomainEntitlementForUser({
        userId: data.ctx.effectiveUserId,
        customDomainId: customDomain.id,
        expiresAt: activeEntitlement.expiresAt ?? null,
      });

      if (!reserved) {
        return NextResponse.json(
          { error: "Nao foi possivel reservar o direito deste dominio. Tente novamente em instantes." },
          { status: 409 }
        );
      }

      const provisionedDomain = await syncCustomDomainProvisioning(customDomain.id);

      return NextResponse.json({
        customDomain: provisionedDomain ?? customDomain,
        entitlement: summarizeDomainEntitlement(await getDomainEntitlementForUser(data.ctx.effectiveUserId)),
        registration: registrationPreparation,
      });
    }

    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao processar dominio personalizado:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao processar domínio personalizado." },
      { status: 500 }
    );
  }
}
