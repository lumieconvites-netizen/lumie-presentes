import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildGiftListSlug,
  isLegacyGiftListSlug,
  normalizeGiftListSlugInput,
  validateGiftListSlug,
} from "@/lib/gift-list-slug";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function hasConfiguredBankAccount(bankAccount: any) {
  if (!bankAccount || typeof bankAccount !== "object") return false;
  const required = ["holderName", "holderDocument", "bankCode", "agency", "accountNumber", "accountType"];
  return required.every((field) => String(bankAccount?.[field] ?? "").trim().length > 0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    let giftList = primaryGiftListId
      ? await prisma.giftList.findUnique({ where: { id: primaryGiftListId } })
      : null;

    if (!giftList) {
      const nextSlug = buildGiftListSlug(ctx.effectiveUser.name, ctx.effectiveUserId);
      giftList = await prisma.giftList.create({
        data: {
          userId: ctx.effectiveUserId,
          slug: nextSlug,
          title: "Minha Lista de Presentes",
          description: "Ajude a realizar nossos sonhos!",
        },
      });
    } else if (isLegacyGiftListSlug(giftList.slug)) {
      const nextSlug = buildGiftListSlug(ctx.effectiveUser.name, ctx.effectiveUserId);
      if (nextSlug !== giftList.slug) {
        giftList = await prisma.giftList.update({
          where: { id: giftList.id },
          data: { slug: nextSlug },
        });
      }
    }

    if (view === "editor") {
      const editorPayload = await prisma.giftList.findUnique({
        where: { id: giftList.id },
        select: {
          id: true,
          slug: true,
          isPublished: true,
          feeMode: true,
          title: true,
          description: true,
          pageLayout: {
            select: {
              blocks: true,
              theme: true,
              customCss: true,
            },
          },
        },
      });

      return NextResponse.json(editorPayload ?? giftList);
    }

    if (view === "header") {
      const headerPayload = await prisma.giftList.findUnique({
        where: { id: giftList.id },
        select: {
          id: true,
          slug: true,
        },
      });
      return NextResponse.json(headerPayload ?? { id: giftList.id, slug: giftList.slug });
    }

    if (view === "presentes") {
      const [presentesPayload, recipient] = await Promise.all([
        prisma.giftList.findUnique({
          where: { id: giftList.id },
          select: {
            id: true,
            slug: true,
            isPublished: true,
            feeMode: true,
            title: true,
            description: true,
            pageLayout: {
              select: {
                theme: true,
              },
            },
            gifts: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                basePrice: true,
                totalQuantity: true,
                availableQty: true,
                isActive: true,
                order: true,
              },
            },
          },
        }),
        prisma.recipient.findUnique({
          where: { userId: ctx.effectiveUserId },
          select: { bankAccount: true },
        }),
      ]);

      return NextResponse.json({
        ...(presentesPayload ?? giftList),
        bankAccountConfigured: hasConfiguredBankAccount(recipient?.bankAccount),
      });
    }

    // Regra de seguranca: sem conta bancaria valida, lista nao pode permanecer publicada.
    if (giftList.isPublished) {
      const recipient = await prisma.recipient.findUnique({
        where: { userId: ctx.effectiveUserId },
        select: { bankAccount: true },
      });

      if (!hasConfiguredBankAccount(recipient?.bankAccount)) {
        giftList = await prisma.giftList.update({
          where: { id: giftList.id },
          data: { isPublished: false },
        });
      }
    }

    return NextResponse.json(giftList);
  } catch (error) {
    console.error("Erro ao buscar lista:", error);
    return NextResponse.json({ error: "Erro ao buscar lista" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));

    const targetGiftListId =
      typeof body?.giftListId === "string" && body.giftListId
        ? body.giftListId
        : await getPrimaryGiftListIdForUser(ctx.effectiveUserId);

    const giftList = await prisma.giftList.findFirst({
      where: {
        userId: ctx.effectiveUserId,
        ...(targetGiftListId ? { id: targetGiftListId } : {}),
      },
      select: { id: true },
    });

    if (!giftList) {
      return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
    }

    const nextFeeMode =
      body?.feeMode === "PASS_TO_GUEST" || body?.feeMode === "ABSORB"
        ? body.feeMode
        : null;

    const data: any = {};
    if (typeof body?.isPublished === "boolean") data.isPublished = body.isPublished;
    if (typeof body?.title === "string") data.title = body.title.trim() || "Minha Lista de Presentes";
    if (typeof body?.description === "string") data.description = body.description.trim() || null;
    if (typeof body?.slug === "string") {
      const normalizedSlug = normalizeGiftListSlugInput(body.slug);
      const validation = validateGiftListSlug(normalizedSlug);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const conflict = await prisma.giftList.findFirst({
        where: {
          slug: normalizedSlug,
          NOT: { id: giftList.id },
        },
        select: { id: true },
      });

      if (conflict) {
        return NextResponse.json({ error: "Essa URL ja esta em uso. Tente outra." }, { status: 409 });
      }

      data.slug = normalizedSlug;
    }

    if (Object.keys(data).length === 0 && !nextFeeMode) {
      return NextResponse.json({ error: "Nenhum campo valido para atualizar" }, { status: 400 });
    }

    if (data.isPublished === true) {
      const recipient = await prisma.recipient.findUnique({
        where: { userId: ctx.effectiveUserId },
        select: { bankAccount: true },
      });

      if (!hasConfiguredBankAccount(recipient?.bankAccount)) {
        return NextResponse.json(
          { error: "Cadastre a conta bancaria antes de publicar os presentes." },
          { status: 400 }
        );
      }
    }

    if (nextFeeMode) {
      await prisma.giftList.updateMany({
        where: { userId: ctx.effectiveUserId },
        data: { feeMode: nextFeeMode },
      });
    }

    let updated = giftList as any;
    if (Object.keys(data).length > 0) {
      updated = await prisma.giftList.update({
        where: { id: giftList.id },
        data,
      });
    } else {
      updated = await prisma.giftList.findUnique({
        where: { id: giftList.id },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar lista:", error);
    return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 });
  }
}
