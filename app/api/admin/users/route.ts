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
  const validRoles = new Set(["ADMIN", "CLIENT", "PARTNER", "AMBASSADOR", "EMPLOYEE"]);

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(role && validRoles.has(role) ? { role: role as any } : {}),
    ...(blocked === "true" ? { isBlocked: true } : {}),
    ...(blocked === "false" ? { isBlocked: false } : {}),
  };

  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        blockReason: true,
        blockedAt: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { giftLists: true } },
      },
      take: 100,
    });
  } catch {
    // Backward compatibility while blockReason columns are not present in DB.
    users = await prisma.user.findMany({
      where,
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
    users = users.map((u) => ({ ...u, blockReason: null, blockedAt: null }));
  }

  return NextResponse.json({ users });
}
