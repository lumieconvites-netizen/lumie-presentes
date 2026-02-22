import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/admin-auth';
import {
  buildGiftModelDescription,
  isGiftModelTemplate,
  normalizeGiftModelSlug,
} from '@/lib/gift-models';
import { getGiftModelTemplateBySlug } from '@/lib/gift-model-store';

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(80).optional(),
  summary: z.string().max(300).optional(),
  thumbnail: z.string().max(400).optional().nullable(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const category = await getGiftModelTemplateBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
  }

  return NextResponse.json({ category });
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  try {
    const current = await getGiftModelTemplateBySlug(params.slug);
    if (!current) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
    }

    const body = patchSchema.parse(await request.json());

    let nextSlug: string | undefined;
    if (body.slug) {
      nextSlug = normalizeGiftModelSlug(body.slug);
      if (!nextSlug) {
        return NextResponse.json({ error: 'Slug invalido' }, { status: 400 });
      }

      if (nextSlug !== current.slug) {
        const conflict = await prisma.template.findUnique({ where: { slug: nextSlug }, select: { id: true, category: true, description: true } });
        if (conflict && (!isGiftModelTemplate(conflict) || conflict.id !== current.id)) {
          return NextResponse.json({ error: 'Slug em uso por outro registro' }, { status: 409 });
        }
      }
    }

    const summary = typeof body.summary === 'string' ? body.summary : current.summary || '';

    const updated = await prisma.template.update({
      where: { id: current.id },
      data: {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(typeof nextSlug === 'string' ? { slug: nextSlug } : {}),
        ...(typeof body.summary !== 'undefined' ? { description: buildGiftModelDescription(summary) } : {}),
        ...(typeof body.thumbnail !== 'undefined' ? { thumbnail: body.thumbnail?.trim() || null } : {}),
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
        ...(typeof body.order === 'number' ? { order: body.order } : {}),
      },
      select: { id: true, slug: true, name: true },
    });

    return NextResponse.json({ category: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao atualizar categoria de modelo de presente', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const category = await getGiftModelTemplateBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 });
  }

  await prisma.template.delete({ where: { id: category.id } });
  return NextResponse.json({ ok: true });
}
