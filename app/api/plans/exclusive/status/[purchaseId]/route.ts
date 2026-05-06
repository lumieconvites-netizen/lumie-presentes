import { NextResponse } from 'next/server';
import { getActingUserContext } from '@/lib/acting-user';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { purchaseId: string } }
) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const purchase = await prisma.planPurchase.findFirst({
    where: {
      id: params.purchaseId,
      userId: ctx.effectiveUserId,
    },
    select: {
      id: true,
      status: true,
      paidAt: true,
      expiresAt: true,
      activatedAt: true,
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: 'Compra nao encontrada.' }, { status: 404 });
  }

  return NextResponse.json({
    id: purchase.id,
    status: purchase.status,
    paidAt: purchase.paidAt?.toISOString() ?? null,
    activatedAt: purchase.activatedAt?.toISOString() ?? null,
    expiresAt: purchase.expiresAt?.toISOString() ?? null,
  });
}
