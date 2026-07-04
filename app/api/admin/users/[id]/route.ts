import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";
import { ensureDefaultReferralCodesForUser } from "@/lib/referrals";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "CLIENT", "PARTNER", "AMBASSADOR", "EMPLOYEE"]).optional(),
  plan: z.enum(["FREE", "PREMIUM"]).optional(),
  planExpiresAt: z.string().datetime().optional().nullable(),
  isBlocked: z.boolean().optional(),
  blockReason: z.string().max(400).optional().nullable(),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  referredByPartnerId: z.string().optional().nullable(),
  referredByAmbassadorId: z.string().optional().nullable(),
  partnerAmbassadorId: z.string().optional().nullable(),
});

function normalizeRelationId(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "none") return null;
  return normalized;
}

function resolveAcquisitionSource(partnerId?: string | null, ambassadorId?: string | null) {
  if (partnerId && ambassadorId) return "PARTNER_WITH_AMBASSADOR";
  if (partnerId) return "PARTNER_DIRECT";
  if (ambassadorId) return "AMBASSADOR_DIRECT";
  return "PLATFORM_DIRECT";
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
    const clientRelationPatchRequested =
      typeof data.referredByPartnerId !== "undefined" ||
      typeof data.referredByAmbassadorId !== "undefined";
    const partnerRelationPatchRequested = typeof data.partnerAmbassadorId !== "undefined";
    const relationPatchRequested =
      clientRelationPatchRequested ||
      partnerRelationPatchRequested ||
      typeof data.role === "string";

    let relationUpdateData: Record<string, unknown> = {};

    if (relationPatchRequested) {
      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          role: true,
          referredByPartnerId: true,
          referredByAmbassadorId: true,
          partnerAmbassadorId: true,
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
      }

      const nextRole = data.role ?? targetUser.role;

      if (clientRelationPatchRequested && nextRole !== "CLIENT") {
        return NextResponse.json(
          { error: "Vinculos de parceiro/embaixador so podem ser alterados em clientes." },
          { status: 400 }
        );
      }

      if (partnerRelationPatchRequested && nextRole !== "PARTNER") {
        return NextResponse.json(
          { error: "Vinculo de embaixador do parceiro so pode ser alterado em parceiros." },
          { status: 400 }
        );
      }

      const nextPartnerId =
        nextRole === "CLIENT"
          ? typeof data.referredByPartnerId !== "undefined"
            ? normalizeRelationId(data.referredByPartnerId)
            : targetUser.referredByPartnerId
          : null;
      const nextAmbassadorId =
        nextRole === "CLIENT"
          ? typeof data.referredByAmbassadorId !== "undefined"
            ? normalizeRelationId(data.referredByAmbassadorId)
            : targetUser.referredByAmbassadorId
          : null;
      const nextPartnerAmbassadorId =
        nextRole === "PARTNER"
          ? typeof data.partnerAmbassadorId !== "undefined"
            ? normalizeRelationId(data.partnerAmbassadorId)
            : targetUser.partnerAmbassadorId ?? targetUser.referredByAmbassadorId
          : null;

      if (nextPartnerId) {
        if (nextPartnerId === params.id) {
          return NextResponse.json({ error: "O cliente nao pode ser parceiro dele mesmo." }, { status: 400 });
        }
        const partner = await prisma.user.findUnique({
          where: { id: nextPartnerId },
          select: { id: true, role: true },
        });
        if (!partner || partner.role !== "PARTNER") {
          return NextResponse.json({ error: "Parceiro selecionado invalido." }, { status: 400 });
        }
      }

      if (nextAmbassadorId) {
        if (nextAmbassadorId === params.id) {
          return NextResponse.json({ error: "O cliente nao pode ser embaixador dele mesmo." }, { status: 400 });
        }
        const ambassador = await prisma.user.findUnique({
          where: { id: nextAmbassadorId },
          select: { id: true, role: true },
        });
        if (!ambassador || ambassador.role !== "AMBASSADOR") {
          return NextResponse.json({ error: "Embaixador selecionado invalido." }, { status: 400 });
        }
      }

      if (nextPartnerAmbassadorId) {
        if (nextPartnerAmbassadorId === params.id) {
          return NextResponse.json({ error: "O parceiro nao pode ser embaixador dele mesmo." }, { status: 400 });
        }
        const ambassador = await prisma.user.findUnique({
          where: { id: nextPartnerAmbassadorId },
          select: { id: true, role: true },
        });
        if (!ambassador || ambassador.role !== "AMBASSADOR") {
          return NextResponse.json({ error: "Embaixador selecionado invalido." }, { status: 400 });
        }
      }

      relationUpdateData = {
        referredByPartnerId: nextPartnerId,
        referredByAmbassadorId: nextAmbassadorId,
        partnerAmbassadorId: nextPartnerAmbassadorId,
        ...(nextRole === "CLIENT"
          ? {
              acquisitionSource: resolveAcquisitionSource(nextPartnerId, nextAmbassadorId),
              appliedReferralCode: null,
            }
          : {}),
      };
    }

    const updateData: any = {
      ...(typeof data.role === "string" ? { role: data.role } : {}),
      ...(typeof data.plan === "string" ? { plan: data.plan } : {}),
      ...(typeof data.planExpiresAt !== "undefined"
        ? { planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null }
        : {}),
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
      ...relationUpdateData,
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
            plan: true,
            planExpiresAt: true,
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
            ...(typeof data.plan === "string" ? { plan: data.plan } : {}),
            ...(typeof data.planExpiresAt !== "undefined"
              ? { planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null }
              : {}),
            ...(typeof data.isBlocked === "boolean" ? { isBlocked: data.isBlocked } : {}),
            ...(typeof data.name === "string" ? { name: data.name.trim() } : {}),
            ...(typeof data.email === "string" ? { email: data.email.trim().toLowerCase() } : {}),
            ...relationUpdateData,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            planExpiresAt: true,
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
