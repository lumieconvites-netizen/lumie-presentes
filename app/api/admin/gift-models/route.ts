import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/admin-auth';
import {
  buildGiftModelBlocks,
  buildGiftModelDescription,
  GIFT_MODEL_CATEGORY,
  isGiftModelTemplate,
  normalizeGiftModelSlug,
} from '@/lib/gift-models';
import { listGiftModelTemplates } from '@/lib/gift-model-store';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80),
  summary: z.string().max(300).optional(),
  thumbnail: z.string().max(400).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const categories = await listGiftModelTemplates();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  try {
    const body = createSchema.parse(await request.json());
    const slug = normalizeGiftModelSlug(body.slug);
    if (!slug) {
      return NextResponse.json({ error: 'Slug invalido.' }, { status: 400 });
    }

    const existing = await prisma.template.findUnique({ where: { slug } });
    if (existing) {
      if (isGiftModelTemplate(existing)) {
        return NextResponse.json({ error: 'Categoria ja existe.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Slug em uso por outro recurso.' }, { status: 409 });
    }

    const maxOrder = await prisma.template.aggregate({ _max: { order: true } });
    const created = await prisma.template.create({
      data: {
        name: body.name.trim(),
        slug,
        description: buildGiftModelDescription(body.summary),
        category: GIFT_MODEL_CATEGORY,
        thumbnail: body.thumbnail?.trim() || null,
        defaultBlocks: buildGiftModelBlocks([]),
        defaultTheme: {},
        isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Erro ao criar categoria de modelo de presente', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
