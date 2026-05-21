import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const PERIODS = new Set(["24h", "7d", "30d", "all"]);

function buildCreatedAtWhere(period: string) {
  if (period === "all") return undefined;

  const now = new Date();
  const since = new Date(now);
  if (period === "24h") since.setHours(since.getHours() - 24);
  else if (period === "7d") since.setDate(since.getDate() - 7);
  else since.setDate(since.getDate() - 30);

  return { gte: since };
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "all";
  const periodParam = searchParams.get("period")?.trim() ?? "24h";
  const period = PERIODS.has(periodParam) ? periodParam : "24h";
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? "100") || 100, 1), 300);
  const skip = Math.max(Number(searchParams.get("skip") ?? "0") || 0, 0);
  const createdAt = buildCreatedAtWhere(period);

  const where: any = {
    ...(type !== "all" ? { type } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { ip: { contains: q, mode: "insensitive" as const } },
            { userId: { contains: q, mode: "insensitive" as const } },
            { route: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [events, total, byType, byIp, byEmail] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.securityEvent.count({ where }),
    prisma.securityEvent.groupBy({
      by: ["type"],
      where: createdAt ? { createdAt } : {},
      _count: { _all: true },
      orderBy: { _count: { type: "desc" } },
      take: 12,
    }),
    prisma.securityEvent.groupBy({
      by: ["ip"],
      where: {
        ...(createdAt ? { createdAt } : {}),
        ip: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { ip: "desc" } },
      take: 8,
    }),
    prisma.securityEvent.groupBy({
      by: ["email"],
      where: {
        ...(createdAt ? { createdAt } : {}),
        email: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { email: "desc" } },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    events,
    total,
    take,
    skip,
    hasMore: skip + events.length < total,
    summary: {
      byType: byType.map((item) => ({ type: item.type, count: item._count._all })),
      byIp: byIp.map((item) => ({ ip: item.ip, count: item._count._all })),
      byEmail: byEmail.map((item) => ({ email: item.email, count: item._count._all })),
    },
  });
}
