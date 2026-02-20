import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_IMPERSONATION_COOKIE, getActingUserContext } from "@/lib/acting-user";

const schema = z.object({
  userId: z.string().min(8).max(64),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Sessao invalida" }, { status: 401 });
  }

  return NextResponse.json({
    isImpersonating: ctx.isImpersonating,
    sessionUserId: ctx.sessionUserId,
    effectiveUser: ctx.effectiveUser,
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = schema.parse(body);

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Nao e permitido acessar como outro admin" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_IMPERSONATION_COOKIE, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_IMPERSONATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
