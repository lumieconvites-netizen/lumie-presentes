import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendVerificationCodeEmailReliable } from "@/lib/email-jobs";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";
import { resolveReferralForSignup } from "@/lib/referrals";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getBlockedEmailMessage, isBlockedEmailDomain } from "@/lib/email-guard";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  templateSlug: z.string().optional(),
  role: z.enum(["CLIENT", "PARTNER"]).optional(),
  inviteCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const ipRate = await enforceRateLimit({
      key: `auth:register:ip:${ip}`,
      requests: 12,
      window: "10 m",
    });
    if (!ipRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, password, templateSlug, role, inviteCode } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isBlockedEmailDomain(normalizedEmail)) {
      return NextResponse.json({ error: getBlockedEmailMessage() }, { status: 400 });
    }

    const emailRate = await enforceRateLimit({
      key: `auth:register:email:${normalizedEmail}`,
      requests: 5,
      window: "10 m",
    });
    if (!emailRate.allowed) {
      return NextResponse.json({ error: "Muitas tentativas para este email. Aguarde alguns minutos." }, { status: 429 });
    }

    const requestedRole = role ?? "CLIENT";

    const referral = await resolveReferralForSignup({
      requestedRole,
      inviteCode,
    });

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
          requestedRole,
          inviteCode: referral.normalizedInviteCode,
          expiresAt,
        },
      });

      if (existingUser && !existingUser.emailVerified) {
        await tx.user.updateMany({
          where: { id: existingUser.id },
          data: {
            name,
            password: passwordHash,
            emailVerified: null,
            role: requestedRole,
            partnerAmbassadorId: referral.partnerAmbassadorId,
            referredByPartnerId: referral.referredByPartnerId,
            referredByAmbassadorId: referral.referredByAmbassadorId,
            acquisitionSource: referral.acquisitionSource,
            appliedReferralCode: referral.normalizedInviteCode,
          },
        });
      }
    });

    const emailResult = await sendVerificationCodeEmailReliable({ to: normalizedEmail, code, name });

    return NextResponse.json(
      {
        message:
          emailResult.delivery === "sent"
            ? "Codigo enviado para o email. Confirme para concluir o cadastro."
            : "Seu codigo foi enfileirado para envio. Aguarde alguns instantes e tente novamente.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error instanceof Error && error.message.toLowerCase().includes("codigo")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.toLowerCase().includes("email")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Erro ao iniciar cadastro:", error);
    return NextResponse.json({ error: "Erro ao iniciar cadastro" }, { status: 500 });
  }
}
