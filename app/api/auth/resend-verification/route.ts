import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendVerificationCodeEmail } from "@/lib/email";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";

const resendSchema = z.object({
  email: z.string().email("Email invalido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const pending = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        purpose: "REGISTER",
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pending || !pending.passwordHash) {
      return NextResponse.json(
        { error: "Nao existe cadastro pendente para este email." },
        { status: 404 }
      );
    }

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
          name: pending.name,
          passwordHash: pending.passwordHash,
          templateSlug: pending.templateSlug,
          expiresAt,
        },
      });
    });

    await sendVerificationCodeEmail({
      to: normalizedEmail,
      code,
      name: pending.name ?? undefined,
    });

    return NextResponse.json({ message: "Novo codigo enviado com sucesso." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao reenviar codigo:", error);
    return NextResponse.json({ error: "Erro ao reenviar codigo" }, { status: 500 });
  }
}
