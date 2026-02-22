import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  buildCategoryMarkerDescription,
  categoryMetaTemplateSlug,
  isCategoryMetaTemplate,
  normalizeCategorySlug,
  parseCategoryMarkerName,
  prettyCategoryName,
} from "@/lib/template-categories";
import { isGiftModelTemplate } from "@/lib/gift-models";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(60).optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const templates = await prisma.template.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      category: true,
      description: true,
      isActive: true,
    },
  });

  const categoriesMap = new Map<string, { slug: string; name: string; templatesCount: number; activeTemplatesCount: number }>();

  for (const template of templates) {
    if (isGiftModelTemplate(template)) continue;
    const categorySlug = normalizeCategorySlug(template.category || "");
    if (!categorySlug) continue;
    const current = categoriesMap.get(categorySlug) ?? {
      slug: categorySlug,
      name: prettyCategoryName(categorySlug),
      templatesCount: 0,
      activeTemplatesCount: 0,
    };

    if (isCategoryMetaTemplate(template)) {
      current.name = parseCategoryMarkerName(template.description, current.name);
    } else {
      current.templatesCount += 1;
      if (template.isActive) current.activeTemplatesCount += 1;
    }

    categoriesMap.set(categorySlug, current);
  }

  const categories = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const categorySlug = normalizeCategorySlug(parsed.slug || parsed.name);
    if (!categorySlug) {
      return NextResponse.json({ error: "Slug invalido para categoria." }, { status: 400 });
    }

    const existingCategoryTemplates = await prisma.template.findFirst({
      where: { category: categorySlug },
      select: { id: true },
    });
    if (existingCategoryTemplates) {
      return NextResponse.json({ error: "Categoria ja existe." }, { status: 409 });
    }

    const markerSlug = categoryMetaTemplateSlug(categorySlug);
    const markerSlugConflict = await prisma.template.findUnique({
      where: { slug: markerSlug },
      select: { id: true },
    });
    if (markerSlugConflict) {
      return NextResponse.json({ error: "Categoria ja existe." }, { status: 409 });
    }

    const maxOrder = await prisma.template.aggregate({ _max: { order: true } });
    await prisma.template.create({
      data: {
        name: `[Categoria] ${parsed.name.trim()}`,
        slug: markerSlug,
        description: buildCategoryMarkerDescription(parsed.name),
        category: categorySlug,
        thumbnail: null,
        defaultBlocks: [],
        defaultTheme: {},
        isActive: false,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ ok: true, slug: categorySlug });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
