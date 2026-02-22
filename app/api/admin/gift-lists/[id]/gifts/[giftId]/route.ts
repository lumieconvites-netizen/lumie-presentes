import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { getLegacyStorageRejectMessage, isLegacySupabaseStorageUrl } from "@/lib/storage-url";

const updateGiftSchema = z.object({
  name: z.string().min(2).max(140).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  basePrice: z.coerce.number().positive().optional(),
  totalQuantity: z.coerce.number().int().min(1).max(999).optional(),
  availableQty: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; giftId: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = updateGiftSchema.parse(body);
    if (typeof data.imageUrl !== "undefined" && isLegacySupabaseStorageUrl(data.imageUrl || null)) {
      return NextResponse.json({ error: getLegacyStorageRejectMessage("imageUrl") }, { status: 400 });
    }

    const currentGift = await prisma.giftItem.findFirst({
      where: { id: params.giftId, giftListId: params.id },
      select: { totalQuantity: true },
    });

    if (!currentGift) {
      return NextResponse.json({ error: "Presente nao encontrado" }, { status: 404 });
    }

    const nextTotal = typeof data.totalQuantity === "number" ? data.totalQuantity : currentGift.totalQuantity;

    const gift = await prisma.giftItem.update({
      where: { id: params.giftId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(typeof data.description !== "undefined" ? { description: data.description?.trim() || null } : {}),
        ...(typeof data.imageUrl !== "undefined" ? { imageUrl: data.imageUrl?.trim() || null } : {}),
        ...(typeof data.basePrice === "number" ? { basePrice: data.basePrice } : {}),
        ...(typeof data.totalQuantity === "number" ? { totalQuantity: data.totalQuantity } : {}),
        ...(typeof data.availableQty === "number" ? { availableQty: Math.min(data.availableQty, nextTotal) } : {}),
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
        ...(typeof data.order === "number" ? { order: data.order } : {}),
      },
    });

    return NextResponse.json({ gift });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar presente" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; giftId: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const gift = await prisma.giftItem.findFirst({
      where: { id: params.giftId, giftListId: params.id },
      select: { id: true },
    });

    if (!gift) {
      return NextResponse.json({ error: "Presente nao encontrado" }, { status: 404 });
    }

    await prisma.giftItem.delete({ where: { id: params.giftId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir presente" }, { status: 500 });
  }
}

