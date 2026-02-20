import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";

const patchSchema = z.object({
  isPublished: z.boolean().optional(),
  title: z.string().min(2).max(140).optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "Slug invalido")
    .optional(),
  description: z.string().max(500).optional().nullable(),
  feeMode: z.enum(["PASS_TO_GUEST", "ABSORB"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const giftList = await prisma.giftList.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      gifts: {
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      },
      rsvpSettings: true,
      _count: { select: { orders: true, messages: true } },
    },
  });

  if (!giftList) {
    return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
  }

  return NextResponse.json({ giftList });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    if (data.slug) {
      const conflict = await prisma.giftList.findFirst({
        where: {
          slug: data.slug.toLowerCase(),
          id: { not: params.id },
        },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug da lista ja existe." }, { status: 409 });
      }
    }

    const giftList = await prisma.giftList.update({
      where: { id: params.id },
      data: {
        ...(typeof data.isPublished === "boolean" ? { isPublished: data.isPublished } : {}),
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.slug ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(typeof data.description !== "undefined" ? { description: data.description?.trim() || null } : {}),
        ...(data.feeMode ? { feeMode: data.feeMode } : {}),
      },
      select: { id: true, isPublished: true, title: true, slug: true, description: true, feeMode: true },
    });

    return NextResponse.json({ giftList });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 });
  }
}
