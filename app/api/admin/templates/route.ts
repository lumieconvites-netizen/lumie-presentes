import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { isCategoryMetaTemplate, normalizeCategorySlug } from "@/lib/template-categories";
import { isGiftModelTemplate } from "@/lib/gift-models";

const templateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "Slug deve conter apenas letras, numeros e hifen"),
  description: z.string().max(400).optional().nullable(),
  category: z.string().min(2).max(60),
  thumbnail: z.string().max(400).optional().nullable(),
  defaultBlocks: z.any(),
  defaultTheme: z.any(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = normalizeCategorySlug(searchParams.get("category") || "");
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const take = Math.min(Math.max(Number(searchParams.get("take") || 100), 1), 100);
  const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

  const rawTemplates = await prisma.template.findMany({
    where: {
      ...(category ? { category } : {}),
    },
    orderBy: [{ isActive: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  const templates = rawTemplates.filter(
    (template) => !isCategoryMetaTemplate(template) && !isGiftModelTemplate(template)
  );
  const filteredTemplates = q
    ? templates.filter((template) =>
        template.name.toLowerCase().includes(q) ||
        template.slug.toLowerCase().includes(q) ||
        template.category.toLowerCase().includes(q)
      )
    : templates;
  const page = filteredTemplates.slice(skip, skip + take);

  return NextResponse.json({
    templates: page,
    total: filteredTemplates.length,
    take,
    skip,
    hasMore: skip + page.length < filteredTemplates.length,
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = templateSchema.parse(body);
    const categorySlug = normalizeCategorySlug(parsed.category);
    if (!categorySlug) {
      return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });
    }

    const existing = await prisma.template.findUnique({ where: { slug: parsed.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug de template ja existe." }, { status: 409 });
    }

    const maxOrder = await prisma.template.aggregate({ _max: { order: true } });

    const created = await prisma.template.create({
      data: {
        name: parsed.name.trim(),
        slug: parsed.slug.trim().toLowerCase(),
        description: parsed.description?.trim() || null,
        category: categorySlug,
        thumbnail: parsed.thumbnail?.trim() || null,
        defaultBlocks: parsed.defaultBlocks,
        defaultTheme: parsed.defaultTheme,
        isActive: parsed.isActive ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ template: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 });
  }
}
