import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json();
  const name = typeof body?.name === 'string' ? body.name : undefined;
  const image = typeof body?.image === 'string' ? body.image : undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { ...(name ? { name } : {}), ...(image ? { image } : {}) },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  return NextResponse.json(user);
}
