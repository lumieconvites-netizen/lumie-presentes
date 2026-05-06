import { NextResponse } from 'next/server';
import { getActingUserContext } from '@/lib/acting-user';
import { prisma } from '@/lib/prisma';
import { resolveEffectivePlan } from '@/lib/plans';
import {
  LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS,
  LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS,
  LUMIE_EXCLUSIVE_PRICE_CENTS,
} from '@/lib/premium-plan';

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  if (ctx.effectiveUser.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Plano disponivel apenas para clientes.' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.effectiveUserId },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      planExpiresAt: true,
      referredByPartner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      referredByAmbassador: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Usuario nao encontrado.' }, { status: 404 });

  const latestPurchase = await prisma.planPurchase.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      amount: true,
      paymentMethod: true,
      paidAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: resolveEffectivePlan(user),
      planExpiresAt: user.planExpiresAt,
    },
    plan: {
      name: 'Lumie Exclusive',
      priceInCents: LUMIE_EXCLUSIVE_PRICE_CENTS,
      partnerCommissionInCents: LUMIE_EXCLUSIVE_PARTNER_COMMISSION_CENTS,
      ambassadorCommissionInCents: LUMIE_EXCLUSIVE_AMBASSADOR_COMMISSION_CENTS,
    },
    referrals: {
      partner: user.referredByPartner,
      ambassador: user.referredByAmbassador,
    },
    latestPurchase: latestPurchase
      ? {
          ...latestPurchase,
          amount: Number(latestPurchase.amount),
          paidAt: latestPurchase.paidAt?.toISOString() ?? null,
          expiresAt: latestPurchase.expiresAt?.toISOString() ?? null,
          createdAt: latestPurchase.createdAt.toISOString(),
        }
      : null,
  });
}
