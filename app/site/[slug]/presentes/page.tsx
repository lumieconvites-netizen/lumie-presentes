import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { buildEffectiveAvailabilityMap } from "@/lib/gift-availability";
import { reconcilePendingOrdersForGiftList } from "@/lib/order-status-reconciliation";
import { resolveThemeBodyFont, resolveThemeTitleFont } from "@/lib/theme-fonts";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const fallbackFeePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 11.99);
const feePercentPix = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE_PIX ?? fallbackFeePercent);

function calculateDisplayPrice(basePrice: number, feeMode: "PASS_TO_GUEST" | "ABSORB") {
  if (feeMode !== "PASS_TO_GUEST") return basePrice;
  return Number((basePrice * (1 + feePercentPix / 100)).toFixed(2));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteGiftsBySlugPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { f?: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const activeFilter = searchParams?.f === "available" ? "available" : "all";

  const list = await prisma.giftList.findUnique({
    where: { slug },
    include: {
      pageLayout: true,
    },
  });

  if (!list || !list.isPublished) return notFound();

  await reconcilePendingOrdersForGiftList(list.id);

  const gifts = await prisma.giftItem.findMany({
    where: { giftListId: list.id, isActive: true },
    orderBy: { order: "asc" },
  });

  const availabilityByGiftId = await buildEffectiveAvailabilityMap(
    gifts.map((gift) => ({ id: gift.id, totalQuantity: gift.totalQuantity }))
  );

  const theme = (list.pageLayout?.theme as any) || {};
  const primaryColor = theme.primary_color || "#C86E52";
  const fontTitle = resolveThemeTitleFont(theme.gifts_page_title_font || theme.font_title);
  const fontBody = resolveThemeBodyFont(theme.gifts_page_message_font || theme.font_body);
  const titleColor = theme.gifts_page_title_color || theme.title_color || "#FFFFFF";
  const messageColor = theme.gifts_page_message_color || theme.caption_color || "#5F4A41";
  const pageTitle = list.title || "Lista de Presentes";
  const pageMessage = list.description || "Escolha um presente especial e participe desse momento.";
  const pageCoverImage = typeof theme.gifts_page_cover_image === "string" ? theme.gifts_page_cover_image : "";
  const giftsWithAvailability = gifts.map((gift) => {
    const availableQty = availabilityByGiftId.get(gift.id) ?? Math.max(0, gift.availableQty);
    const soldOut = availableQty <= 0;
    const displayPrice = calculateDisplayPrice(Number(gift.basePrice || 0), list.feeMode);
    return {
      gift,
      availableQty,
      soldOut,
      displayPrice,
    };
  });
  const visibleGifts =
    activeFilter === "available"
      ? giftsWithAvailability.filter((entry) => !entry.soldOut)
      : giftsWithAvailability;

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href={`/site/${encodeURIComponent(slug)}`} aria-label="Voltar ao site" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="w-10" />
        </div>
      </header>

      {pageCoverImage ? (
        <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-[78vh]">
          <Image
            src={pageCoverImage}
            alt={`Capa da pagina ${pageTitle}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
              <h1
                className="text-3xl md:text-5xl leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
                style={{ fontFamily: fontTitle, color: titleColor }}
              >
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <section className="max-w-6xl mx-auto px-4 pt-8">
          <h1 className="text-3xl md:text-5xl leading-tight" style={{ fontFamily: fontTitle, color: titleColor }}>
            {pageTitle}
          </h1>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-10">
        {pageMessage ? (
          <p className="mb-8 max-w-3xl" style={{ fontFamily: fontBody, color: messageColor }}>
            {pageMessage}
          </p>
        ) : null}
        {gifts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-600">
            Ainda nao ha presentes cadastrados.
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtrar:</span>
              <Link
                href={`/site/${encodeURIComponent(slug)}/presentes?f=all`}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeFilter === "all"
                    ? "text-white border-transparent"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                style={activeFilter === "all" ? { backgroundColor: primaryColor } : undefined}
              >
                Todos
              </Link>
              <Link
                href={`/site/${encodeURIComponent(slug)}/presentes?f=available`}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  activeFilter === "available"
                    ? "text-white border-transparent"
                    : "text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                style={activeFilter === "available" ? { backgroundColor: primaryColor } : undefined}
              >
                Disponíveis
              </Link>
            </div>

            {visibleGifts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-600">
                Nenhum presente disponivel no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleGifts.map(({ gift, availableQty, soldOut, displayPrice }) => {
                  return (
                    <article key={gift.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="relative h-52 bg-gray-100">
                        {gift.imageUrl ? (
                          <Image
                            src={gift.imageUrl}
                            alt={gift.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="p-5">
                        <h2 className="text-xl font-semibold">{gift.name}</h2>
                        {gift.description ? (
                          <p className="text-sm text-gray-600 mt-2 min-h-10">{gift.description}</p>
                        ) : null}
                        <div className="flex items-center justify-between mt-5">
                          <div>
                            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                              {formatBRL(displayPrice)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Disponivel: {availableQty} de {gift.totalQuantity}
                            </p>
                          </div>
                          {soldOut ? (
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg text-sm font-medium text-white opacity-60 cursor-not-allowed"
                              style={{ backgroundColor: primaryColor }}
                              disabled
                            >
                              Esgotado
                            </button>
                          ) : (
                            <Link
                              href={`/checkout/${gift.id}?slug=${encodeURIComponent(slug)}`}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Presentear
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
