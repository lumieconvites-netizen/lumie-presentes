import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";
import { getActingUserContext } from "@/lib/acting-user";

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.effectiveUserId },
    select: {
      id: true,
      role: true,
      partnerAmbassadorId: true,
      partnerAmbassador: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  await ensureDefaultReferralCodesForUser({ id: user.id, role: user.role });

  const codes = await prisma.referralCode.findMany({
    where: { ownerUserId: user.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      code: true,
      type: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      role: user.role,
      partnerAmbassadorId: user.partnerAmbassadorId,
      partnerAmbassador: user.partnerAmbassador,
    },
    codes,
  });
}
