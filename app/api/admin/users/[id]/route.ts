import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "CLIENT", "PARTNER", "AMBASSADOR", "EMPLOYEE"]).optional(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().max(400).optional().nullable(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
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

    if (typeof data.email === "string") {
      const conflict = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: params.id },
        },
        select: { id: true },
      });
      if (conflict) {
        return NextResponse.json({ error: "Este email ja esta em uso." }, { status: 409 });
      }
    }

    const isBlockedToggle = typeof data.isBlocked === "boolean";
    const shouldSetBlockedMeta = isBlockedToggle ? data.isBlocked : undefined;

    const updateData: any = {
      ...(typeof data.role === "string" ? { role: data.role } : {}),
      ...(typeof data.isBlocked === "boolean" ? { isBlocked: data.isBlocked } : {}),
      ...(typeof data.blockReason !== "undefined"
        ? { blockReason: data.blockReason?.trim() || null }
        : {}),
      ...(typeof shouldSetBlockedMeta === "boolean"
        ? {
            blockedAt: shouldSetBlockedMeta ? new Date() : null,
            ...(shouldSetBlockedMeta
              ? {}
              : { blockReason: typeof data.blockReason === "undefined" ? null : data.blockReason?.trim() || null }),
          }
        : {}),
      ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
      ...(typeof data.email === "string" ? { email: data.email.trim().toLowerCase() } : {}),
    };

    const updated = await prisma.$transaction(async (tx) => {
      let user: any;
      try {
        user = await tx.user.update({
          where: { id: params.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBlocked: true,
            blockReason: true,
            blockedAt: true,
          },
        });
      } catch {
        // Backward compatibility while blockReason columns are not present in DB.
        user = await tx.user.update({
          where: { id: params.id },
          data: {
            ...(typeof data.role === "string" ? { role: data.role } : {}),
            ...(typeof data.isBlocked === "boolean" ? { isBlocked: data.isBlocked } : {}),
            ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
            ...(typeof data.email === "string" ? { email: data.email.trim().toLowerCase() } : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBlocked: true,
          },
        });
        user = { ...user, blockReason: null, blockedAt: null };
      }

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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const currentUserId = (session.user as any).id as string;
    if (params.id === currentUserId) {
      return NextResponse.json({ error: "Voce nao pode excluir sua propria conta admin." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Admins nao podem ser excluidos por esta tela." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir usuario" }, { status: 500 });
  }
}
