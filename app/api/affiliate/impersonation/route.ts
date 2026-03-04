import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_IMPERSONATION_COOKIE,
  AFFILIATE_IMPERSONATION_COOKIE,
  getActingUserContext,
} from "@/lib/acting-user";

const schema = z.object({
  userId: z.string().min(8).max(64),
});

function isAffiliateRole(role: string) {
  return role === "PARTNER" || role === "AMBASSADOR";
}

function getAffiliateActor(ctx: Awaited<ReturnType<typeof getActingUserContext>>) {
  if (!ctx) return null;

  if (isAffiliateRole(ctx.sessionUserRole)) {
    return {
      role: ctx.sessionUserRole,
      ownerUserId: ctx.sessionUserId,
      cookieName: AFFILIATE_IMPERSONATION_COOKIE,
    } as const;
  }

  if (
    ctx.sessionUserRole === "ADMIN" &&
    ctx.isImpersonating &&
    ctx.impersonationMode === "ADMIN" &&
    isAffiliateRole(ctx.effectiveUser.role)
  ) {
    return {
      role: ctx.effectiveUser.role,
      ownerUserId: ctx.effectiveUserId,
      cookieName: ADMIN_IMPERSONATION_COOKIE,
    } as const;
  }

  return null;
}

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const affiliateActor = getAffiliateActor(ctx);
  if (!affiliateActor) {
    return NextResponse.json({ error: "Acesso permitido apenas para parceiros e embaixadores." }, { status: 403 });
  }

  return NextResponse.json({
    isImpersonating: ctx.isImpersonating && ctx.impersonationMode === "AFFILIATE",
    sessionUserId: affiliateActor.ownerUserId,
    sessionUserRole: affiliateActor.role,
    effectiveUser: ctx.effectiveUser,
  });
}

export async function POST(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const affiliateActor = getAffiliateActor(ctx);
  if (!affiliateActor) {
    return NextResponse.json({ error: "Acesso permitido apenas para parceiros e embaixadores." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId } = schema.parse(body);

    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "CLIENT",
        ...(affiliateActor.role === "PARTNER"
          ? { referredByPartnerId: affiliateActor.ownerUserId }
          : { referredByAmbassadorId: affiliateActor.ownerUserId }),
      },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Cliente nao encontrado na sua rede." }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(affiliateActor.cookieName, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}

export async function DELETE() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const affiliateActor = getAffiliateActor(ctx);
  if (!affiliateActor) {
    return NextResponse.json({ error: "Acesso permitido apenas para parceiros e embaixadores." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(affiliateActor.cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
