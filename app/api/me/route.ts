import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';

export async function GET(req: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get('scope');
  const useSessionUser = scope === 'session' && ctx.sessionUserRole === 'ADMIN';
  const targetUserId = useSessionUser ? ctx.sessionUserId : ctx.effectiveUserId;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get('scope');
  const useSessionUser = scope === 'session' && ctx.sessionUserRole === 'ADMIN';
  const targetUserId = useSessionUser ? ctx.sessionUserId : ctx.effectiveUserId;

  const body = await req.json();
  const name = typeof body?.name === 'string' ? body.name : undefined;
  const image = typeof body?.image === 'string' ? body.image : undefined;

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { ...(name ? { name } : {}), ...(image ? { image } : {}) },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}
