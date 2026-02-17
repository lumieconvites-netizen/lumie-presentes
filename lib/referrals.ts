import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

export type RegisterRole = "CLIENT" | "PARTNER";
export type AcquisitionSource =
  | "PLATFORM_DIRECT"
  | "AMBASSADOR_DIRECT"
  | "PARTNER_DIRECT"
  | "PARTNER_WITH_AMBASSADOR";

type ResolveInput = {
  requestedRole: RegisterRole;
  inviteCode?: string | null;
};

type ResolveResult = {
  requestedRole: RegisterRole;
  normalizedInviteCode: string | null;
  partnerAmbassadorId: string | null;
  referredByPartnerId: string | null;
  referredByAmbassadorId: string | null;
  acquisitionSource: AcquisitionSource;
};

function normalizeInviteCode(code?: string | null) {
  const normalized = (code ?? "").trim().toUpperCase();
  return normalized || null;
}

function randomCode(prefix: string) {
  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}_${suffix}`;
}

type DbLike = PrismaClient | Prisma.TransactionClient;

async function createCodeIfMissing(params: {
  db?: DbLike;
  userId: string;
  code: string;
  type: "PARTNER_CLIENT" | "AMBASSADOR_CLIENT" | "AMBASSADOR_PARTNER";
}) {
  const db = params.db ?? prisma;
  const existing = await db.referralCode.findFirst({
    where: {
      ownerUserId: params.userId,
      type: params.type,
      isActive: true,
    },
    select: { id: true },
  });

  if (existing) return;

  await db.referralCode.create({
    data: {
      ownerUserId: params.userId,
      code: params.code,
      type: params.type,
      isActive: true,
    },
  });
}

export async function ensureDefaultReferralCodesForUser(user: { id: string; role: string }, db?: DbLike) {
  if (user.role === "PARTNER") {
    await createCodeIfMissing({
      db,
      userId: user.id,
      code: randomCode("PAR"),
      type: "PARTNER_CLIENT",
    });
    return;
  }

  if (user.role === "AMBASSADOR") {
    await createCodeIfMissing({
      db,
      userId: user.id,
      code: randomCode("AMB"),
      type: "AMBASSADOR_CLIENT",
    });
    await createCodeIfMissing({
      db,
      userId: user.id,
      code: randomCode("AMBPAR"),
      type: "AMBASSADOR_PARTNER",
    });
  }
}

export async function resolveReferralForSignup(input: ResolveInput): Promise<ResolveResult> {
  const requestedRole = input.requestedRole;
  const normalizedInviteCode = normalizeInviteCode(input.inviteCode);

  if (!normalizedInviteCode) {
    return {
      requestedRole,
      normalizedInviteCode: null,
      partnerAmbassadorId: null,
      referredByPartnerId: null,
      referredByAmbassadorId: null,
      acquisitionSource: "PLATFORM_DIRECT",
    };
  }

  const referralCode = await prisma.referralCode.findFirst({
    where: {
      code: normalizedInviteCode,
      isActive: true,
    },
    include: {
      owner: {
        select: {
          id: true,
          role: true,
          partnerAmbassadorId: true,
        },
      },
    },
  });

  if (!referralCode) {
    throw new Error("Codigo de convite invalido ou inativo.");
  }

  if (requestedRole === "PARTNER") {
    if (referralCode.type !== "AMBASSADOR_PARTNER") {
      throw new Error("Parceiros so podem ser vinculados com codigo de embaixador para parceiros.");
    }

    return {
      requestedRole,
      normalizedInviteCode,
      partnerAmbassadorId: referralCode.owner.id,
      referredByPartnerId: null,
      referredByAmbassadorId: null,
      acquisitionSource: "PLATFORM_DIRECT",
    };
  }

  if (referralCode.type === "PARTNER_CLIENT") {
    const partnerId = referralCode.owner.id;
    const ambassadorId = referralCode.owner.partnerAmbassadorId ?? null;

    return {
      requestedRole,
      normalizedInviteCode,
      partnerAmbassadorId: null,
      referredByPartnerId: partnerId,
      referredByAmbassadorId: ambassadorId,
      acquisitionSource: ambassadorId ? "PARTNER_WITH_AMBASSADOR" : "PARTNER_DIRECT",
    };
  }

  if (referralCode.type === "AMBASSADOR_CLIENT") {
    return {
      requestedRole,
      normalizedInviteCode,
      partnerAmbassadorId: null,
      referredByPartnerId: null,
      referredByAmbassadorId: referralCode.owner.id,
      acquisitionSource: "AMBASSADOR_DIRECT",
    };
  }

  throw new Error("Codigo informado e valido apenas para cadastro de parceiro.");
}
