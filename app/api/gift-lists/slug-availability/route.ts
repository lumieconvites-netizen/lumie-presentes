import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeGiftListSlugInput, validateGiftListSlug } from "@/lib/gift-list-slug";
import { getActingUserContext } from "@/lib/acting-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const ctx = await getActingUserContext();
    if (!ctx) {
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
          userId: ctx.effectiveUserId,
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
