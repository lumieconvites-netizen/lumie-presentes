import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getGiftModelTemplateBySlug, saveGiftModelItems } from "@/lib/gift-model-store";

const copyGiftsSchema = z.object({
  categorySlug: z.string().min(2).max(80),
  giftIds: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = copyGiftsSchema.parse(await request.json());
    const category = await getGiftModelTemplateBySlug(body.categorySlug);

    if (!category) {
      return NextResponse.json({ error: "Categoria de modelo nao encontrada." }, { status: 404 });
    }

    const gifts = await prisma.giftItem.findMany({
      where: {
        giftListId: params.id,
        id: { in: body.giftIds },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        basePrice: true,
        totalQuantity: true,
      },
    });

    if (!gifts.length) {
      return NextResponse.json({ error: "Nenhum presente encontrado para copiar." }, { status: 404 });
    }

    const selectedIds = new Set(body.giftIds);
    const copiedItems = gifts
      .filter((gift) => selectedIds.has(gift.id))
      .map((gift) => ({
        id: randomUUID(),
        name: gift.name,
        description: gift.description,
        imageUrl: gift.imageUrl,
        basePrice: Number(gift.basePrice),
        totalQuantity: gift.totalQuantity,
      }));

    await saveGiftModelItems(category.id, [...category.items, ...copiedItems]);

    return NextResponse.json({
      ok: true,
      importedCount: copiedItems.length,
      categorySlug: category.slug,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao copiar presentes para modelo", error);
    return NextResponse.json({ error: "Erro ao copiar presentes para modelo" }, { status: 500 });
  }
}
