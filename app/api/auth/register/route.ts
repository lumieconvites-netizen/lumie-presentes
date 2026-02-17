import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendVerificationCodeEmail } from "@/lib/email";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  templateSlug: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, templateSlug } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerified: true },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json({ error: "Este email ja esta cadastrado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = generateVerificationCode();
    const expiresAt = getVerificationExpiry(15);

    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.updateMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.emailVerificationCode.create({
        data: {
          email: normalizedEmail,
          code,
          purpose: "REGISTER",
          name,
          passwordHash,
          templateSlug: templateSlug || null,
          expiresAt,
        },
      });

      if (existingUser && !existingUser.emailVerified) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            password: passwordHash,
            emailVerified: null,
          },
        });
      }
    });

    await sendVerificationCodeEmail({ to: normalizedEmail, code, name });

    return NextResponse.json(
      {
        message: "Codigo enviado para o email. Confirme para concluir o cadastro.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao iniciar cadastro:", error);
    return NextResponse.json({ error: "Erro ao iniciar cadastro" }, { status: 500 });
  }
}
