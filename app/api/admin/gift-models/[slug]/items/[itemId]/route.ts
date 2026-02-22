import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/admin-auth';
import { getGiftModelTemplateBySlug, saveGiftModelItems } from '@/lib/gift-model-store';

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(240).optional().nullable(),
  imageUrl: z.string().max(400).optional().nullable(),
  basePrice: z.number().min(50).max(400).optional(),
  totalQuantity: z.number().int().min(1).max(999).optional(),
});

export async function PATCH(request: Request, { params }: { params: { slug: string; itemId: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  try {
    const category = await getGiftModelTemplateBySlug(params.slug);
    if (!category) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }

    const body = patchSchema.parse(await request.json());
    const idx = category.items.findIndex((item) => item.id === params.itemId);
    if (idx < 0) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    const current = category.items[idx];
    const nextItems = [...category.items];
    nextItems[idx] = {
      ...current,
      ...(typeof body.name === 'string' ? { name: body.name.trim() } : {}),
      ...(typeof body.description !== 'undefined' ? { description: body.description?.trim() || null } : {}),
      ...(typeof body.imageUrl !== 'undefined' ? { imageUrl: body.imageUrl?.trim() || null } : {}),
      ...(typeof body.basePrice === 'number' ? { basePrice: body.basePrice } : {}),
      ...(typeof body.totalQuantity === 'number' ? { totalQuantity: body.totalQuantity } : {}),
    };

    await saveGiftModelItems(category.id, nextItems);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao atualizar item em modelo de presentes', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string; itemId: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const category = await getGiftModelTemplateBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
  }

  const nextItems = category.items.filter((item) => item.id !== params.itemId);
  if (nextItems.length === category.items.length) {
    return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
  }

  await saveGiftModelItems(category.id, nextItems);
  return NextResponse.json({ ok: true });
}
