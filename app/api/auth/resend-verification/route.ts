import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendVerificationCodeEmailReliable } from "@/lib/email-jobs";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getBlockedEmailMessage, isBlockedEmailDomain } from "@/lib/email-guard";

const resendSchema = z.object({
  email: z.string().email("Email invalido"),
});

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const ipRate = await enforceRateLimit({
      key: `auth:resend:ip:${ip}`,
      requests: 8,
      window: "10 m",
    });
    if (!ipRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { email } = resendSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isBlockedEmailDomain(normalizedEmail)) {
      return NextResponse.json({ error: getBlockedEmailMessage() }, { status: 400 });
    }

    const emailRate = await enforceRateLimit({
      key: `auth:resend:email:${normalizedEmail}`,
      requests: 4,
      window: "10 m",
    });
    if (!emailRate.allowed) {
      return NextResponse.json({ error: "Limite de reenvios atingido. Aguarde alguns minutos." }, { status: 429 });
    }

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
          requestedRole: pending.requestedRole,
          inviteCode: pending.inviteCode,
          expiresAt,
        },
      });
    });

    const emailResult = await sendVerificationCodeEmailReliable({
      to: normalizedEmail,
      code,
      name: pending.name ?? undefined,
    });

    return NextResponse.json({
      message:
        emailResult.delivery === "sent"
          ? "Novo codigo enviado com sucesso."
          : "Novo codigo enfileirado para envio. Aguarde alguns instantes.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.toLowerCase().includes("email")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Erro ao reenviar codigo:", error);
    return NextResponse.json({ error: "Erro ao reenviar codigo" }, { status: 500 });
  }
}
