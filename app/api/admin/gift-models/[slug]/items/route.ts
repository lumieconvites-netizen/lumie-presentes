import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/admin-auth';
import { getGiftModelTemplateBySlug, saveGiftModelItems } from '@/lib/gift-model-store';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(240).optional(),
  imageUrl: z.string().max(400).optional(),
  basePrice: z.number().min(50).max(400),
  totalQuantity: z.number().int().min(1).max(999).optional(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  try {
    const category = await getGiftModelTemplateBySlug(params.slug);
    if (!category) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }

    const body = createSchema.parse(await request.json());

    const nextItems = [
      ...category.items,
      {
        id: randomUUID(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        basePrice: body.basePrice,
        totalQuantity: body.totalQuantity ?? 1,
      },
    ];

    await saveGiftModelItems(category.id, nextItems);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao adicionar item em modelo de presentes', error);
    return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 });
  }
}
