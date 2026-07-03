import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildGiftListSlug } from "@/lib/gift-list-slug";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const published = searchParams.get("published");
  const take = Math.min(Math.max(Number(searchParams.get("take") || 30), 1), 100);
  const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(published === "true" ? { isPublished: true } : {}),
    ...(published === "false" ? { isPublished: false } : {}),
  };

  const total = await prisma.giftList.count({ where });

  const giftLists = await prisma.giftList.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      feeMode: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          referredByPartner: { select: { id: true, name: true, email: true } },
          referredByAmbassador: { select: { id: true, name: true, email: true } },
        },
      },
      _count: {
        select: {
          gifts: true,
          orders: true,
          messages: true,
        },
      },
    },
  });

  return NextResponse.json({ giftLists, total, hasMore: skip + giftLists.length < total });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const titleInput = typeof body?.title === "string" ? body.title.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "userId e obrigatorio" }, { status: 400 });
    }

    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    const baseTitle = titleInput || "Minha Lista de Presentes";
    const baseSlug = buildGiftListSlug(owner.name, owner.id);
    let slug = baseSlug;

    for (let i = 0; i < 20; i++) {
      const exists = await prisma.giftList.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${baseSlug}-${i + 1}`;
    }

    const giftList = await prisma.giftList.create({
      data: {
        userId: owner.id,
        title: baseTitle,
        description: "Ajude a realizar nossos sonhos!",
        slug,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ giftList }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lista admin:", error);
    return NextResponse.json({ error: "Erro ao criar lista" }, { status: 500 });
  }
}
