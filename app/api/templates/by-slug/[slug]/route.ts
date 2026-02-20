import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCategoryMetaTemplate } from "@/lib/template-categories";
import { extractTemplateGiftItemsFromBlocks } from "@/lib/template-gifts";

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
    const blocks = Array.isArray(dbTemplate.defaultBlocks) ? dbTemplate.defaultBlocks : [];
    return NextResponse.json({
      template: {
        source: "db",
        id: dbTemplate.id,
        slug: dbTemplate.slug,
        name: dbTemplate.name,
        description: dbTemplate.description,
        blocks,
        theme: dbTemplate.defaultTheme || {},
        giftItems: extractTemplateGiftItemsFromBlocks(blocks),
      },
    });
  }

  return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 });
}
