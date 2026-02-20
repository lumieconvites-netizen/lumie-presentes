import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeJson(value: any) {
  return value ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: { giftListId: string } }
) {
  try {
    const ctx = await getActingUserContext();
    const userId = ctx?.effectiveUserId;

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftListId = params.giftListId;

    const list = await prisma.giftList.findFirst({
      where: { id: giftListId, userId },
      include: { pageLayout: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

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

export async function PUT(
  req: Request,
  { params }: { params: { giftListId: string } }
) {
  try {
    const ctx = await getActingUserContext();
    const userId = ctx?.effectiveUserId;

    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const giftListId = params.giftListId;

    const list = await prisma.giftList.findFirst({
      where: { id: giftListId, userId },
      select: { id: true },
    });

    if (!list) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body invalido" }, { status: 400 });
    }

    const blocks = safeJson(body.blocks);
    const theme = safeJson(body.theme);
    const customCss = typeof body.customCss === "string" ? body.customCss : null;

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
