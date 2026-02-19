import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeGiftListSlugInput, validateGiftListSlug } from "@/lib/gift-list-slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const input = searchParams.get("slug") ?? "";
    const normalized = normalizeGiftListSlugInput(input);
    const validation = validateGiftListSlug(normalized);

    if (!validation.ok) {
      return NextResponse.json(
        {
          available: false,
          normalizedSlug: normalized,
          error: validation.error,
        },
        { status: 200 }
      );
    }

    const conflict = await prisma.giftList.findFirst({
      where: {
        slug: normalized,
        NOT: {
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      available: !conflict,
      normalizedSlug: normalized,
      error: conflict ? "Essa URL ja esta em uso. Tente outra." : null,
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade de slug:", error);
    return NextResponse.json({ error: "Erro ao verificar disponibilidade" }, { status: 500 });
  }
}
