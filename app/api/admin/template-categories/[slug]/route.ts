import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  buildCategoryMarkerDescription,
  categoryMetaTemplateSlug,
  isCategoryMetaTemplate,
  normalizeCategorySlug,
} from "@/lib/template-categories";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  slug: z.string().min(2).max(60).optional(),
});

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const oldCategorySlug = normalizeCategorySlug(params.slug);
    const nextCategorySlug = normalizeCategorySlug(parsed.slug || oldCategorySlug);
    if (!oldCategorySlug || !nextCategorySlug) {
      return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });
    }

    const marker = await prisma.template.findUnique({
      where: { slug: categoryMetaTemplateSlug(oldCategorySlug) },
      select: { id: true, slug: true },
    });
    if (!marker) {
      return NextResponse.json({ error: "Categoria nao encontrada." }, { status: 404 });
    }

    if (oldCategorySlug !== nextCategorySlug) {
      const conflict = await prisma.template.findFirst({
        where: {
          category: nextCategorySlug,
          slug: { not: marker.slug },
        },
        select: { id: true },
      });
      if (conflict) return NextResponse.json({ error: "Slug de categoria ja existe." }, { status: 409 });

      const markerSlugConflict = await prisma.template.findUnique({
        where: { slug: categoryMetaTemplateSlug(nextCategorySlug) },
        select: { id: true },
      });
      if (markerSlugConflict) return NextResponse.json({ error: "Slug de categoria ja existe." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.template.updateMany({
        where: { category: oldCategorySlug },
        data: { category: nextCategorySlug },
      });

      await tx.template.update({
        where: { id: marker.id },
        data: {
          slug: categoryMetaTemplateSlug(nextCategorySlug),
          name: parsed.name ? `[Categoria] ${parsed.name.trim()}` : undefined,
          description: parsed.name ? buildCategoryMarkerDescription(parsed.name) : undefined,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const categorySlug = normalizeCategorySlug(params.slug);
    if (!categorySlug) return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });

    const categoryTemplates = await prisma.template.findMany({
      where: { category: categorySlug },
      select: { id: true, slug: true, description: true },
    });

    const nonMetaTemplates = categoryTemplates.filter((template) => !isCategoryMetaTemplate(template));
    if (nonMetaTemplates.length > 0) {
      return NextResponse.json(
        { error: "Nao e possivel excluir categoria com templates ativos. Exclua os templates primeiro." },
        { status: 400 }
      );
    }

    await prisma.template.deleteMany({
      where: { category: categorySlug },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 });
  }
}
