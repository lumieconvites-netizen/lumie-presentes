import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getActingUserContext } from "@/lib/acting-user";

const updateSchema = z.object({
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.message.findFirst({
      where: {
        id: params.id,
        giftList: { userId: ctx.effectiveUserId },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Recado nao encontrado" }, { status: 404 });
    }

    const updated = await prisma.message.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Erro ao atualizar recado:", error);
    return NextResponse.json({ error: "Erro ao atualizar recado" }, { status: 500 });
  }
}
