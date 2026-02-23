import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";
import { sendPasswordResetCodeEmailReliable } from "@/lib/email-jobs";
import { PASSWORD_RESET_TEMPLATE_SLUG } from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({
        message: "Se o email existir na plataforma, enviaremos um codigo de recuperacao.",
      });
    }

    const code = generateVerificationCode();
    const expiresAt = getVerificationExpiry(15);

    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.updateMany({
        where: {
          email: normalizedEmail,
          purpose: "REGISTER",
          templateSlug: PASSWORD_RESET_TEMPLATE_SLUG,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.emailVerificationCode.create({
        data: {
          email: normalizedEmail,
          code,
          purpose: "REGISTER",
          templateSlug: PASSWORD_RESET_TEMPLATE_SLUG,
          name: user.name,
          expiresAt,
        },
      });
    });

    await sendPasswordResetCodeEmailReliable({
      to: normalizedEmail,
      code,
      name: user.name ?? undefined,
    });

    return NextResponse.json({
      message: "Se o email existir na plataforma, enviaremos um codigo de recuperacao.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.toLowerCase().includes("email")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Erro ao solicitar recuperacao de senha:", error);
    return NextResponse.json({ error: "Erro ao solicitar recuperacao de senha" }, { status: 500 });
  }
}
