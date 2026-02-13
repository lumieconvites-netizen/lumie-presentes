// app/api/gift-lists/my-list/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    let giftList = await prisma.giftList.findFirst({
      where: { userId: session.user.id },
    });

    if (!giftList) {
      giftList = await prisma.giftList.create({
        data: {
          userId: session.user.id,
          slug: `lista-${session.user.id}`,
          title: "Minha Lista de Presentes",
          description: "Ajude a realizar nossos sonhos!",
        },
      });
    }

    return NextResponse.json(giftList);
  } catch (error) {
    console.error("Erro ao buscar lista:", error);
    return NextResponse.json({ error: "Erro ao buscar lista" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const isPublished = Boolean(body?.isPublished);

    const giftList = await prisma.giftList.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!giftList) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });

    const updated = await prisma.giftList.update({
      where: { id: giftList.id },
      data: { isPublished },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar publicação:", error);
    return NextResponse.json({ error: "Erro ao atualizar publicação" }, { status: 500 });
  }
}
