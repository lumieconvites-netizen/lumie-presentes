import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { isCategoryMetaTemplate } from "@/lib/template-categories";

function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function makeUniqueTemplateSlug(baseSlug: string) {
  let candidate = slugify(baseSlug) || `template-${Date.now()}`;
  let suffix = 2;

  // Keep slug under 120 chars while adding numeric suffixes.
  while (true) {
    const exists = await prisma.template.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    const suffixLabel = `-${suffix}`;
    const trimmedBase = candidate.replace(/-\d+$/, "").slice(0, 120 - suffixLabel.length);
    candidate = `${trimmedBase}${suffixLabel}`;
    suffix += 1;
  }
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const original = await prisma.template.findUnique({ where: { id: params.id } });
    if (!original || isCategoryMetaTemplate(original)) {
      return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 });
    }

    const nextSlug = await makeUniqueTemplateSlug(`${original.slug}-copia`);
    const maxOrder = await prisma.template.aggregate({ _max: { order: true } });

    const duplicated = await prisma.template.create({
      data: {
        name: `${original.name} (copia)`,
        slug: nextSlug,
        description: original.description,
        category: original.category,
        thumbnail: original.thumbnail,
        defaultBlocks: JSON.parse(JSON.stringify(original.defaultBlocks)) as Prisma.InputJsonValue,
        defaultTheme: JSON.parse(JSON.stringify(original.defaultTheme)) as Prisma.InputJsonValue,
        isActive: false,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ template: duplicated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao duplicar template" }, { status: 500 });
  }
}
