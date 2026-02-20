import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildGiftListSlug, isLegacyGiftListSlug } from "@/lib/gift-list-slug";
import { getActingUserContext } from "@/lib/acting-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const giftList = await prisma.giftList.findFirst({
      where: { userId: ctx.effectiveUserId },
      include: {
        pageLayout: true,
        gifts: { orderBy: { order: "asc" } },
        messages: {
          where: {
            order: {
              status: { in: ["PAID", "AUTHORIZED"] },
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            order: {
              select: {
                totalAmount: true,
                giftItem: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            giftItem: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!giftList) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });

    if (isLegacyGiftListSlug(giftList.slug)) {
      const nextSlug = buildGiftListSlug(ctx.effectiveUser.name, ctx.effectiveUserId);
      if (nextSlug !== giftList.slug) {
        const migrated = await prisma.giftList.update({
          where: { id: giftList.id },
          data: { slug: nextSlug },
          include: {
            pageLayout: true,
            gifts: { orderBy: { order: "asc" } },
            messages: {
              where: {
                order: {
                  status: { in: ["PAID", "AUTHORIZED"] },
                },
              },
              orderBy: { createdAt: "desc" },
              include: {
                order: {
                  select: {
                    totalAmount: true,
                    giftItem: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
            orders: {
              orderBy: { createdAt: "desc" },
              include: {
                giftItem: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });
        return NextResponse.json(migrated);
      }
    }

    return NextResponse.json(giftList);
  } catch (error) {
    console.error("Erro ao carregar lista completa:", error);
    return NextResponse.json({ error: "Erro ao carregar lista completa" }, { status: 500 });
  }
}
