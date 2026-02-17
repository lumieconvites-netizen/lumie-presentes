import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";

const patchSchema = z.object({
  isPublished: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);

    const giftList = await prisma.giftList.update({
      where: { id: params.id },
      data: { isPublished: data.isPublished },
      select: { id: true, isPublished: true },
    });

    return NextResponse.json({ giftList });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 });
  }
}
