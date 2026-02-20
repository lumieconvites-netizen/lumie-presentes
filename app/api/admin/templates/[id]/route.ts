import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "Slug deve conter apenas letras, numeros e hifen")
    .optional(),
  description: z.string().max(400).optional().nullable(),
  category: z.string().min(2).max(60).optional(),
  thumbnail: z.string().max(400).optional().nullable(),
  defaultBlocks: z.any().optional(),
  defaultTheme: z.any().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.slug) {
      const slugConflict = await prisma.template.findFirst({
        where: { slug: parsed.slug.toLowerCase(), id: { not: params.id } },
        select: { id: true },
      });

      if (slugConflict) {
        return NextResponse.json({ error: "Slug de template ja existe." }, { status: 409 });
      }
    }

    const updated = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(parsed.name ? { name: parsed.name.trim() } : {}),
        ...(parsed.slug ? { slug: parsed.slug.trim().toLowerCase() } : {}),
        ...(typeof parsed.description !== "undefined" ? { description: parsed.description?.trim() || null } : {}),
        ...(parsed.category ? { category: parsed.category.trim().toLowerCase() } : {}),
        ...(typeof parsed.thumbnail !== "undefined" ? { thumbnail: parsed.thumbnail?.trim() || null } : {}),
        ...(typeof parsed.defaultBlocks !== "undefined" ? { defaultBlocks: parsed.defaultBlocks } : {}),
        ...(typeof parsed.defaultTheme !== "undefined" ? { defaultTheme: parsed.defaultTheme } : {}),
        ...(typeof parsed.isActive === "boolean" ? { isActive: parsed.isActive } : {}),
        ...(typeof parsed.order === "number" ? { order: parsed.order } : {}),
      },
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar template" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const linked = await prisma.giftList.count({ where: { templateId: params.id } });
    if (linked > 0) {
      return NextResponse.json({ error: "Template em uso por listas, nao pode excluir." }, { status: 400 });
    }

    await prisma.template.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir template" }, { status: 500 });
  }
}

