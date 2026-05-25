import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PASSWORD_RESET_TEMPLATE_SLUG } from "@/lib/password-reset";
import { getBlockedEmailMessage, isBlockedEmailDomain } from "@/lib/email-guard";
import { logSecurityEvent } from "@/lib/security-events";
import { validatePasswordStrength } from "@/lib/password-policy";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Email invalido"),
    code: z.string().length(6, "Codigo invalido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, password } = resetPasswordSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const passwordStrength = validatePasswordStrength(password, { email: normalizedEmail });
    if (!passwordStrength.ok) {
      await logSecurityEvent({
        type: "AUTH_RESET_PASSWORD_WEAK_PASSWORD",
        email: normalizedEmail,
        request,
        route: "/api/auth/reset-password",
        metadata: { reasons: passwordStrength.errors },
      });
      return NextResponse.json({ error: passwordStrength.message }, { status: 400 });
    }

    if (isBlockedEmailDomain(normalizedEmail)) {
      await logSecurityEvent({
        type: "AUTH_RESET_PASSWORD_BLOCKED_EMAIL_DOMAIN",
        email: normalizedEmail,
        request,
        route: "/api/auth/reset-password",
      });
      return NextResponse.json({ error: getBlockedEmailMessage() }, { status: 400 });
    }

    const token = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        purpose: "REGISTER",
        templateSlug: PASSWORD_RESET_TEMPLATE_SLUG,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      await logSecurityEvent({
        type: "AUTH_RESET_PASSWORD_INVALID_CODE",
        email: normalizedEmail,
        request,
        route: "/api/auth/reset-password",
      });
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    if (token.expiresAt < new Date()) {
      await logSecurityEvent({
        type: "AUTH_RESET_PASSWORD_EXPIRED_CODE",
        email: normalizedEmail,
        request,
        route: "/api/auth/reset-password",
      });
      return NextResponse.json({ error: "Codigo expirado. Solicite um novo." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      await logSecurityEvent({
        type: "AUTH_RESET_PASSWORD_USER_NOT_FOUND",
        email: normalizedEmail,
        request,
        route: "/api/auth/reset-password",
      });
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });

      await tx.emailVerificationCode.updateMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
          templateSlug: PASSWORD_RESET_TEMPLATE_SLUG,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
    });

    await logSecurityEvent({
      type: "AUTH_RESET_PASSWORD_SUCCESS",
      email: normalizedEmail,
      userId: user.id,
      request,
      route: "/api/auth/reset-password",
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}
