import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { normalizeCategorySlug } from "@/lib/template-categories";

const copyTemplateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(120).optional(),
  category: z.string().min(2).max(60).optional(),
  description: z.string().max(400).optional().nullable(),
  isActive: z.boolean().optional(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function uniqueTemplateSlug(baseSlug: string) {
  const base = slugify(baseSlug) || "template-cliente";
  let candidate = base;
  let suffix = 2;

  while (await prisma.template.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = copyTemplateSchema.parse(await request.json());
    const category = normalizeCategorySlug(body.category || "modelos-clientes");

    if (!category) {
      return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });
    }

    const giftList = await prisma.giftList.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        slug: true,
        description: true,
        pageLayout: {
          select: {
            blocks: true,
            theme: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada." }, { status: 404 });
    }

    if (!giftList.pageLayout) {
      return NextResponse.json({ error: "Essa lista ainda nao tem site salvo para copiar." }, { status: 400 });
    }

    const maxOrder = await prisma.template.aggregate({ _max: { order: true } });
    const name = (body.name || `${giftList.title} - modelo`).trim();
    const slug = await uniqueTemplateSlug(body.slug || `${giftList.slug}-modelo`);
    const owner = giftList.user.name || giftList.user.email;
    const defaultBlocks = (giftList.pageLayout.blocks ?? []) as Prisma.InputJsonValue;
    const defaultTheme = (giftList.pageLayout.theme ?? {}) as Prisma.InputJsonValue;

    const template = await prisma.template.create({
      data: {
        name,
        slug,
        description:
          body.description?.trim() ||
          `Copiado da lista ${giftList.title} (${giftList.slug}) de ${owner}.`,
        category,
        thumbnail: null,
        defaultBlocks,
        defaultTheme,
        isActive: body.isActive ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao copiar lista como template", error);
    return NextResponse.json({ error: "Erro ao copiar site como template" }, { status: 500 });
  }
}
