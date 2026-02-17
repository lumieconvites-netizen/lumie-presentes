import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const role = searchParams.get("role");
  const blocked = searchParams.get("blocked");

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role === "ADMIN" || role === "CLIENT" ? { role: role as any } : {}),
      ...(blocked === "true" ? { isBlocked: true } : {}),
      ...(blocked === "false" ? { isBlocked: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { giftLists: true } },
    },
    take: 100,
  });

  return NextResponse.json({ users });
}
