import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeJson(value: any) {
  // garante que não vai salvar "undefined" ou Date quebrada
  return value ?? null;
}

// GET /api/gift-lists/:giftListId/layout
export async function GET(
  _req: Request,
  { params }: { params: { giftListId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const giftListId = params.giftListId;

    const list = await prisma.giftList.findFirst({
      where: { id: giftListId, userId },
      include: { pageLayout: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });
    }

    // se não tiver layout ainda, cria
    if (!list.pageLayout) {
      const created = await prisma.pageLayout.create({
        data: {
          giftListId: list.id,
          blocks: [],
          theme: {},
          customCss: null,
        },
      });

      return NextResponse.json({
        giftListId: list.id,
        blocks: created.blocks,
        theme: created.theme,
        customCss: created.customCss,
      });
    }

    return NextResponse.json({
      giftListId: list.id,
      blocks: list.pageLayout.blocks,
      theme: list.pageLayout.theme,
      customCss: list.pageLayout.customCss,
    });
  } catch (error) {
    console.error("GET layout error:", error);
    return NextResponse.json({ error: "Erro ao buscar layout" }, { status: 500 });
  }
}

// PUT /api/gift-lists/:giftListId/layout
export async function PUT(
  req: Request,
  { params }: { params: { giftListId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const giftListId = params.giftListId;

    // garante que a lista é do usuário logado
    const list = await prisma.giftList.findFirst({
      where: { id: giftListId, userId },
      select: { id: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const blocks = safeJson(body.blocks);
    const theme = safeJson(body.theme);
    const customCss = typeof body.customCss === "string" ? body.customCss : null;

    // upsert do layout (cria se não existe, atualiza se existe)
    const layout = await prisma.pageLayout.upsert({
      where: { giftListId },
      create: {
        giftListId,
        blocks: blocks ?? [],
        theme: theme ?? {},
        customCss,
      },
      update: {
        blocks: blocks ?? [],
        theme: theme ?? {},
        customCss,
      },
    });

    return NextResponse.json({
      giftListId,
      blocks: layout.blocks,
      theme: layout.theme,
      customCss: layout.customCss,
    });
  } catch (error) {
    console.error("PUT layout error:", error);
    return NextResponse.json({ error: "Erro ao salvar layout" }, { status: 500 });
  }
}
