import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  EMPLOYEE_IMPERSONATION_COOKIE,
  getActingUserContext,
} from "@/lib/acting-user";

const schema = z.object({
  userId: z.string().min(8).max(64),
});

function isEmployeeRole(role: string) {
  return role === "EMPLOYEE";
}

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  if (!isEmployeeRole(ctx.sessionUserRole)) {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionarios." }, { status: 403 });
  }

  return NextResponse.json({
    isImpersonating: ctx.isImpersonating && ctx.impersonationMode === "EMPLOYEE",
    sessionUserId: ctx.sessionUserId,
    sessionUserRole: ctx.sessionUserRole,
    effectiveUser: ctx.effectiveUser,
  });
}

export async function POST(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  if (!isEmployeeRole(ctx.sessionUserRole)) {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionarios." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId } = schema.parse(body);

    const target = await prisma.user.findFirst({
      where: { id: userId, role: "CLIENT" },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(EMPLOYEE_IMPERSONATION_COOKIE, userId, {
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

  if (!isEmployeeRole(ctx.sessionUserRole)) {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionarios." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(EMPLOYEE_IMPERSONATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
