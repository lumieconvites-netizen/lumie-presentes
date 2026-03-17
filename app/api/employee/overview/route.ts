import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

type SortMode = "recent" | "alpha";

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

function parseSortMode(value: string | null): SortMode {
  return value === "alpha" ? "alpha" : "recent";
}

function buildClientWhere(q: string) {
  return {
    role: "CLIENT" as const,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (ctx.effectiveUser.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionários." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const sort = parseSortMode(searchParams.get("sort"));
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? "10") || 10, 1), 50);
  const skip = Math.max(Number(searchParams.get("skip") ?? "0") || 0, 0);

  const where = buildClientWhere(q);
  const orderBy =
    sort === "alpha"
      ? [{ name: "asc" as const }, { email: "asc" as const }]
      : [{ createdAt: "desc" as const }];

  const [clients, total, clientsCount, clientsWithGiftList, publishedLists] = await Promise.all([
    prisma.user.findMany({
      where,
      select: CLIENT_SELECT,
      orderBy,
      take,
      skip,
    }),
    prisma.user.count({ where }),
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
    createdAt: client.createdAt,
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
    total,
    take,
    skip,
    hasMore: skip + normalized.length < total,
  });
}
