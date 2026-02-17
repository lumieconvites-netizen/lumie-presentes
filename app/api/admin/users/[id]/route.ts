import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "CLIENT", "PARTNER", "AMBASSADOR"]).optional(),
  isBlocked: z.boolean().optional(),
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

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const currentUserId = (session.user as any).id as string;
    if (params.id === currentUserId && data.role && data.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Voce nao pode remover seu proprio papel de admin." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: params.id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
        },
      });

      await ensureDefaultReferralCodesForUser({ id: user.id, role: user.role }, tx);
      return user;
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao atualizar usuario" }, { status: 500 });
  }
}
