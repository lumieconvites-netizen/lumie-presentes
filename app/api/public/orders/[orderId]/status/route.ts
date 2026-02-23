import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcilePendingOrdersForGiftList } from "@/lib/order-status-reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") ?? "").trim().toLowerCase();

    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        guestEmail: true,
        status: true,
        giftListId: true,
        giftList: {
          select: { slug: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
    }

    if (email && String(order.guestEmail ?? "").trim().toLowerCase() !== email) {
      return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 });
    }

    await reconcilePendingOrdersForGiftList(order.giftListId);

    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });

    return NextResponse.json({
      orderId: order.id,
      status: refreshed?.status ?? order.status,
      slug: order.giftList.slug,
    });
  } catch (error) {
    console.error("Erro ao consultar status publico do pedido:", error);
    return NextResponse.json({ error: "Erro ao consultar pedido" }, { status: 500 });
  }
}
