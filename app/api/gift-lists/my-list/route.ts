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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    let giftList = await prisma.giftList.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));

    const giftList = await prisma.giftList.findFirst({
      where: {
        userId: session.user.id,
        ...(typeof body?.giftListId === "string" && body.giftListId
          ? { id: body.giftListId }
          : {}),
      },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const nextFeeMode =
      body?.feeMode === "PASS_TO_GUEST" || body?.feeMode === "ABSORB"
        ? body.feeMode
        : null;

    const data: any = {};
    if (typeof body?.isPublished === "boolean") data.isPublished = body.isPublished;
    if (typeof body?.title === "string") data.title = body.title.trim() || "Minha Lista de Presentes";
    if (typeof body?.description === "string") data.description = body.description.trim() || null;

    if (Object.keys(data).length === 0 && !nextFeeMode) {
      return NextResponse.json({ error: "Nenhum campo valido para atualizar" }, { status: 400 });
    }

    // Mantem feeMode consistente em todas as listas do mesmo dono
    if (nextFeeMode) {
      await prisma.giftList.updateMany({
        where: { userId: session.user.id },
        data: { feeMode: nextFeeMode },
      });
    }

    let updated = giftList as any;
    if (Object.keys(data).length > 0) {
      updated = await prisma.giftList.update({
        where: { id: giftList.id },
        data,
      });
    } else {
      updated = await prisma.giftList.findUnique({
        where: { id: giftList.id },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
    return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 });
  }
}
