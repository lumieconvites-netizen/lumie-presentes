import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

const userSelectWithRelations = {
  id: true,
  name: true,
  email: true,
  role: true,
  isBlocked: true,
  blockReason: true,
  blockedAt: true,
  emailVerified: true,
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
    select: {
      giftLists: true,
      referredClientsAsPartner: true,
      referredClientsAsAmbassador: true,
      partnerReferrals: true,
    },
  },
} as const;

const userSelectFallback = {
  id: true,
  name: true,
  email: true,
  role: true,
  isBlocked: true,
  emailVerified: true,
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
    select: {
      giftLists: true,
      referredClientsAsPartner: true,
      referredClientsAsAmbassador: true,
      partnerReferrals: true,
    },
  },
} as const;

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
  const buildWhere = (activeRoles: any[]) => ({
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(activeRoles.length === 1 ? { role: activeRoles[0] } : {}),
    ...(activeRoles.length > 1 ? { role: { in: activeRoles } } : {}),
    ...(blocked === "true" ? { isBlocked: true } : {}),
    ...(blocked === "false" ? { isBlocked: false } : {}),
  });
  const where = buildWhere(roles);
  const rolesWithoutEmployee = roles.filter((value) => value !== "EMPLOYEE");

  let users: any[] = [];
  let total = 0;
  try {
    [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: userSelectWithRelations,
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);
  } catch {
    try {
      // Backward compatibility while blockReason columns are not present in DB.
      [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          select: userSelectFallback,
          take,
          skip,
        }),
        prisma.user.count({ where }),
      ]);
      users = users.map((u) => ({ ...u, blockReason: null, blockedAt: null }));
    } catch {
      // Backward compatibility while EMPLOYEE enum is not present in DB yet.
      if (roles.includes("EMPLOYEE")) {
        if (!rolesWithoutEmployee.length) {
          return NextResponse.json({ users: [], total: 0, take, skip, hasMore: false });
        }

        const fallbackWhere = buildWhere(rolesWithoutEmployee);
        [users, total] = await Promise.all([
          prisma.user.findMany({
            where: fallbackWhere,
            orderBy: { createdAt: "desc" },
            select: userSelectFallback,
            take,
            skip,
          }),
          prisma.user.count({ where: fallbackWhere }),
        ]);
        users = users.map((u) => ({ ...u, blockReason: null, blockedAt: null }));
      } else {
        throw new Error("Erro ao carregar usuários");
      }
    }
  }

  return NextResponse.json({ users, total, take, skip, hasMore: skip + users.length < total });
}
