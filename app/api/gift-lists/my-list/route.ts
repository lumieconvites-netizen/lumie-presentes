import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Buscar lista do usuário logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let giftList = await prisma.giftList.findFirst({
      where: { userId: session.user.id },
    });

    // Criar lista se não existir
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
