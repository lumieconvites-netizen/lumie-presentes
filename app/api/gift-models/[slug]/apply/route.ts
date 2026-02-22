import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getActingUserContext } from '@/lib/acting-user';
import { getGiftModelTemplateBySlug } from '@/lib/gift-model-store';

const bodySchema = z.object({
  giftListId: z.string().min(1, 'giftListId e obrigatorio'),
  selectedItemIds: z.array(z.string().min(1)).optional(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const category = await getGiftModelTemplateBySlug(params.slug);
    if (!category || !category.isActive) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }

    const list = await prisma.giftList.findFirst({
      where: {
        id: body.giftListId,
        userId: ctx.effectiveUserId,
      },
      include: {
        _count: {
          select: {
            gifts: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'Lista nao encontrada' }, { status: 404 });
    }

    const selectedSet = new Set((body.selectedItemIds || []).map((id) => id.trim()).filter(Boolean));
    const itemsToImport = selectedSet.size
      ? category.items.filter((item) => selectedSet.has(item.id))
      : category.items;

    if (itemsToImport.length === 0) {
      return NextResponse.json({ error: 'Nenhum presente selecionado para importar' }, { status: 400 });
    }

    const availableSlots = Math.max(0, 100 - list._count.gifts);
    if (itemsToImport.length > availableSlots) {
      return NextResponse.json(
        { error: `Sua lista permite no maximo ${availableSlots} presente(s) agora.` },
        { status: 400 }
      );
    }

    const lastGift = await prisma.giftItem.findFirst({
      where: { giftListId: list.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const startOrder = (lastGift?.order ?? -1) + 1;

    await prisma.giftItem.createMany({
      data: itemsToImport.map((item, index) => ({
        giftListId: list.id,
        name: item.name,
        description: item.description || null,
        imageUrl: item.imageUrl || null,
        basePrice: item.basePrice,
        totalQuantity: item.totalQuantity,
        availableQty: item.totalQuantity,
        order: startOrder + index,
        isActive: true,
      })),
    });

    return NextResponse.json({ importedCount: itemsToImport.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao importar modelos de presentes', error);
    return NextResponse.json({ error: 'Erro ao importar presentes' }, { status: 500 });
  }
}
