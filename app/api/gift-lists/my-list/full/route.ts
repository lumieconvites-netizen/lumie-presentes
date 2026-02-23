import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildGiftListSlug, isLegacyGiftListSlug } from "@/lib/gift-list-slug";
import { getActingUserContext } from "@/lib/acting-user";
import { getPrimaryGiftListIdForUser } from "@/lib/primary-gift-list";
import { reconcilePendingOrdersForGiftList } from "@/lib/order-status-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    const ctx = await getActingUserContext();
    if (!ctx) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
    if (!primaryGiftListId) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });

    if (view !== "dashboard") {
      await reconcilePendingOrdersForGiftList(primaryGiftListId);
    }

    if (view === "dashboard") {
      const cardLiquidationCutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          slug: true,
          isPublished: true,
          title: true,
          description: true,
          gifts: {
            select: {
              id: true,
              availableQty: true,
            },
          },
          messages: {
            where: {
              order: {
                status: { in: ["PAID", "AUTHORIZED"] },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
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
            where: {
              OR: [
                { status: { in: ["PENDING", "AUTHORIZED"] } },
                {
                  status: "PAID",
                  OR: [
                    { paidAt: { gte: cardLiquidationCutoff } },
                    { paidAt: null, createdAt: { gte: cardLiquidationCutoff } },
                  ],
                },
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 120,
            include: {
              giftItem: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!giftList) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
      return NextResponse.json(giftList);
    }

    const giftList = await prisma.giftList.findUnique({
      where: { id: primaryGiftListId },
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
