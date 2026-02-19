import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PASSWORD_RESET_TEMPLATE_SLUG } from "@/lib/password-reset";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Email invalido"),
    code: z.string().length(6, "Codigo invalido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
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
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json({ error: "Codigo expirado. Solicite um novo." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
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

    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}
