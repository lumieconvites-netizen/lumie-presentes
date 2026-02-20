import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

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

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const templates = await prisma.template.findMany({
    orderBy: [{ isActive: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = templateSchema.parse(body);

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
        category: parsed.category.trim().toLowerCase(),
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

