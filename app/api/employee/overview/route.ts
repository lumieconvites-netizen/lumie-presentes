import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActingUserContext } from "@/lib/acting-user";

export async function GET(request: Request) {
  const ctx = await getActingUserContext();
  if (!ctx) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  if (ctx.effectiveUser.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Acesso permitido apenas para funcionarios." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { giftLists: true } },
      giftLists: {
        select: { id: true, isPublished: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const normalized = clients.map((client) => ({
    id: client.id,
    name: client.name || "Sem nome",
    email: client.email,
    hasGiftList: client._count.giftLists > 0,
    published: Boolean(client.giftLists[0]?.isPublished),
  }));

  return NextResponse.json({
    employee: {
      id: ctx.effectiveUser.id,
      name: ctx.effectiveUser.name || "Sem nome",
      email: ctx.effectiveUser.email,
    },
    kpis: {
      clientsCount: normalized.length,
      clientsWithGiftList: normalized.filter((c) => c.hasGiftList).length,
      publishedLists: normalized.filter((c) => c.published).length,
    },
    clients: normalized,
  });
}
