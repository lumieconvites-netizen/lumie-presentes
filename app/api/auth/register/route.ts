import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendVerificationCodeEmailReliable } from "@/lib/email-jobs";
import { generateVerificationCode, getVerificationExpiry } from "@/lib/verification";
import { resolveReferralForSignup } from "@/lib/referrals";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getBlockedEmailMessage, isBlockedEmailDomain } from "@/lib/email-guard";
import { getBlockedIpMessage, isBlockedIp } from "@/lib/ip-guard";
import { logSecurityEvent } from "@/lib/security-events";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { validatePasswordStrength } from "@/lib/password-policy";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  document: z.string().min(11, "CPF invalido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  templateSlug: z.string().optional(),
  role: z.enum(["CLIENT", "PARTNER"]).optional(),
  inviteCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    if (isBlockedIp(ip)) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_BLOCKED_IP",
        request,
        route: "/api/auth/register",
        metadata: { ip },
      });
      return NextResponse.json({ error: getBlockedIpMessage() }, { status: 403 });
    }

    const ipRate = await enforceRateLimit({
      key: `auth:register:ip:${ip}`,
      requests: 12,
      window: "10 m",
    });
    if (!ipRate.allowed) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_IP_RATE_LIMITED",
        request,
        route: "/api/auth/register",
      });
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, document, password, templateSlug, role, inviteCode } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDocument = onlyDigits(document);

    if (!isValidCpf(normalizedDocument)) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_INVALID_CPF",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT" },
      });
      return NextResponse.json({ error: "CPF invalido." }, { status: 400 });
    }

    const passwordStrength = validatePasswordStrength(password, { email: normalizedEmail, name });
    if (!passwordStrength.ok) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_WEAK_PASSWORD",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT", reasons: passwordStrength.errors },
      });
      return NextResponse.json({ error: passwordStrength.message }, { status: 400 });
    }

    if (isBlockedEmailDomain(normalizedEmail)) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_BLOCKED_EMAIL_DOMAIN",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT" },
      });
      return NextResponse.json({ error: getBlockedEmailMessage() }, { status: 400 });
    }

    const emailRate = await enforceRateLimit({
      key: `auth:register:email:${normalizedEmail}`,
      requests: 5,
      window: "10 m",
    });
    if (!emailRate.allowed) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_EMAIL_RATE_LIMITED",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT" },
      });
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

    const existingDocumentUser = await prisma.user.findUnique({
      where: { document: normalizedDocument },
      select: { id: true, email: true, emailVerified: true },
    });

    if (existingDocumentUser && existingDocumentUser.email !== normalizedEmail) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_DUPLICATED_CPF",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT" },
      });
      return NextResponse.json({ error: "Este CPF ja esta vinculado a uma conta." }, { status: 400 });
    }

    const pendingDocument = await prisma.emailVerificationCode.findFirst({
      where: {
        document: normalizedDocument,
        purpose: "REGISTER",
        usedAt: null,
        expiresAt: { gt: new Date() },
        email: { not: normalizedEmail },
      },
      select: { id: true },
    });

    if (pendingDocument) {
      await logSecurityEvent({
        type: "AUTH_REGISTER_DUPLICATED_PENDING_CPF",
        email: normalizedEmail,
        request,
        route: "/api/auth/register",
        metadata: { name, role: role ?? "CLIENT" },
      });
      return NextResponse.json(
        { error: "Este CPF ja possui um cadastro pendente. Confirme o email ou aguarde alguns minutos." },
        { status: 400 }
      );
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
          document: normalizedDocument,
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
            document: normalizedDocument,
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
    await logSecurityEvent({
      type: "AUTH_REGISTER_VERIFICATION_SENT",
      email: normalizedEmail,
      request,
      route: "/api/auth/register",
      metadata: { name, requestedRole, delivery: emailResult.delivery },
    });

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
