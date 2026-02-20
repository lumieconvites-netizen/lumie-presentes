import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: ctx.effectiveUserId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

  const body = await req.json();
  const name = typeof body?.name === 'string' ? body.name : undefined;
  const image = typeof body?.image === 'string' ? body.image : undefined;

  const user = await prisma.user.update({
    where: { id: ctx.effectiveUserId },
    data: { ...(name ? { name } : {}), ...(image ? { image } : {}) },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}
