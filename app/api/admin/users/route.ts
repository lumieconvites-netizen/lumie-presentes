import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const role = searchParams.get("role");
  const rolesParam = (searchParams.get("roles") ?? "").trim();
  const blocked = searchParams.get("blocked");
  const validRoles = new Set(["ADMIN", "CLIENT", "PARTNER", "AMBASSADOR", "EMPLOYEE"]);
  const roles = (
    rolesParam
      ? rolesParam
          .split(",")
          .map((value) => value.trim())
          .filter((value) => validRoles.has(value))
      : role && validRoles.has(role)
        ? [role]
        : []
  ) as any[];
  const take = Math.min(Math.max(Number(searchParams.get("take") ?? "100") || 100, 1), 200);
  const skip = Math.max(Number(searchParams.get("skip") ?? "0") || 0, 0);

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(roles.length === 1 ? { role: roles[0] } : {}),
    ...(roles.length > 1 ? { role: { in: roles } } : {}),
    ...(blocked === "true" ? { isBlocked: true } : {}),
    ...(blocked === "false" ? { isBlocked: false } : {}),
  };

  let users: any[] = [];
  let total = 0;
  try {
    [users, total] = await Promise.all([
      prisma.user.findMany({
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
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);
  } catch {
    // Backward compatibility while blockReason columns are not present in DB.
    [users, total] = await Promise.all([
      prisma.user.findMany({
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
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);
    users = users.map((u) => ({ ...u, blockReason: null, blockedAt: null }));
  }

  return NextResponse.json({ users, total, take, skip, hasMore: skip + users.length < total });
}
