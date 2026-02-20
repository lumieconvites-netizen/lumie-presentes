import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTemplatePresetBySlug } from "@/lib/template-presets";
import { isCategoryMetaTemplate } from "@/lib/template-categories";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: "Slug invalido" }, { status: 400 });

  const dbTemplate = await prisma.template.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      defaultBlocks: true,
      defaultTheme: true,
      isActive: true,
    },
  });

  if (dbTemplate && dbTemplate.isActive && !isCategoryMetaTemplate(dbTemplate)) {
    return NextResponse.json({
      template: {
        source: "db",
        id: dbTemplate.id,
        slug: dbTemplate.slug,
        name: dbTemplate.name,
        description: dbTemplate.description,
        blocks: Array.isArray(dbTemplate.defaultBlocks) ? dbTemplate.defaultBlocks : [],
        theme: dbTemplate.defaultTheme || {},
      },
    });
  }

  const preset = getTemplatePresetBySlug(slug);
  if (preset) {
    return NextResponse.json({
      template: {
        source: "preset",
        id: null,
        slug: preset.slug,
        name: preset.name,
        description: preset.description,
        blocks: preset.blocks,
        theme: preset.theme,
      },
    });
  }

  return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 });
}
