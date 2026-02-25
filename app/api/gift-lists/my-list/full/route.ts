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

    // Mantem dashboard/recados/pagamentos alinhados quando webhook atrasar ou falhar.
    try {
      await reconcilePendingOrdersForGiftList(primaryGiftListId, {
        throttleKey: `my-list-full:${primaryGiftListId}`,
        minIntervalMs: 15_000,
        take: 30,
      });
    } catch (error) {
      console.error("Falha ao reconciliar pedidos pendentes em my-list/full:", error);
    }

    if (view === "dashboard") {
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          slug: true,
          isPublished: true,
          title: true,
          description: true,
        },
      });
      if (!giftList) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });

      const [totalGifts, activeGifts, recentMessages, recentPayments, pendingOrdersCount] =
        await Promise.all([
          prisma.giftItem.count({
            where: {
              giftListId: primaryGiftListId,
            },
          }),
          prisma.giftItem.count({
            where: {
              giftListId: primaryGiftListId,
              availableQty: { gt: 0 },
            },
          }),
          prisma.message.findMany({
            where: {
              giftListId: primaryGiftListId,
              order: {
                status: { in: ["PAID", "AUTHORIZED"] },
              },
            },
            select: {
              id: true,
              guestName: true,
              content: true,
              createdAt: true,
              order: {
                select: {
                  giftItem: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 4,
          }),
          prisma.order.findMany({
            where: {
              giftListId: primaryGiftListId,
              status: "PAID",
            },
            select: {
              id: true,
              guestName: true,
              totalAmount: true,
              feeAmount: true,
              createdAt: true,
              giftItem: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 4,
          }),
          prisma.order.count({
            where: {
              giftListId: primaryGiftListId,
              status: { in: ["PENDING", "AUTHORIZED"] },
            },
          }),
        ]);

      return NextResponse.json({
        ...giftList,
        summary: {
          totalGifts,
          activeGifts,
          pendingOrdersCount,
          recentPayments,
          recentMessages,
        },
      });
    }

    if (view === "recados") {
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          messages: {
            where: {
              order: {
                status: { in: ["PAID", "AUTHORIZED"] },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 120,
            select: {
              id: true,
              guestName: true,
              content: true,
              signature: true,
              isPublic: true,
              isFavorite: true,
              createdAt: true,
              order: {
                select: {
                  totalAmount: true,
                  giftItem: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!giftList) return NextResponse.json({ error: "Lista nao encontrada" }, { status: 404 });
      return NextResponse.json(giftList);
    }

    if (view === "pagamentos") {
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          orders: {
            orderBy: { createdAt: "desc" },
            take: 120,
            select: {
              id: true,
              guestName: true,
              guestEmail: true,
              totalAmount: true,
              feeAmount: true,
              status: true,
              createdAt: true,
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

    if (view === "preview") {
      const giftList = await prisma.giftList.findUnique({
        where: { id: primaryGiftListId },
        select: {
          id: true,
          slug: true,
          pageLayout: {
            select: {
              blocks: true,
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
          messages: {
            where: {
              order: {
                status: { in: ["PAID", "AUTHORIZED"] },
              },
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              guestName: true,
              content: true,
              createdAt: true,
              isPublic: true,
              isFavorite: true,
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
