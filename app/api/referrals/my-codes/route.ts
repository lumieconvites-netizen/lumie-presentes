import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

