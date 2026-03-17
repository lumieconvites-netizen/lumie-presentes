import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

const CLIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  referredByPartner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  referredByAmbassador: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: { giftLists: true },
  },
  giftLists: {
    select: { id: true, isPublished: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

export async function GET() {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (ctx.effectiveUser.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionários." }, { status: 403 });
  }

  const [clients, clientsCount, clientsWithGiftList, publishedLists] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: CLIENT_SELECT,
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.giftList.count({
      where: {
        user: {
          role: "CLIENT",
        },
      },
    }),
    prisma.giftList.count({
      where: {
        isPublished: true,
        user: {
          role: "CLIENT",
        },
      },
    }),
  ]);

  const normalized = clients.map((client) => ({
    id: client.id,
    name: client.name || "Sem nome",
    email: client.email,
    createdAt: client.createdAt.toISOString(),
    hasGiftList: client._count.giftLists > 0,
    published: Boolean(client.giftLists[0]?.isPublished),
    referredByPartner: client.referredByPartner,
    referredByAmbassador: client.referredByAmbassador,
  }));

  return NextResponse.json({
    employee: {
      id: ctx.effectiveUser.id,
      name: ctx.effectiveUser.name || "Sem nome",
      email: ctx.effectiveUser.email,
    },
    kpis: {
      clientsCount,
      clientsWithGiftList,
      publishedLists,
    },
    clients: normalized,
  });
}
