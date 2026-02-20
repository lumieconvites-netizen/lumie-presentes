import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const createGiftSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  basePrice: z.coerce.number().positive(),
  totalQuantity: z.coerce.number().int().min(1).max(999).optional(),
  availableQty: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const gifts = await prisma.giftItem.findMany({
    where: { giftListId: params.id },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ gifts });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createGiftSchema.parse(body);

    const existingCount = await prisma.giftItem.count({ where: { giftListId: params.id } });
    const totalQuantity = data.totalQuantity ?? 1;
    const availableQty = typeof data.availableQty === "number" ? data.availableQty : totalQuantity;

    const gift = await prisma.giftItem.create({
      data: {
        giftListId: params.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        basePrice: data.basePrice,
        totalQuantity,
        availableQty: Math.min(availableQty, totalQuantity),
        isActive: data.isActive ?? true,
        order: existingCount + 1,
      },
    });

    return NextResponse.json({ gift });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar presente" }, { status: 500 });
  }
}

