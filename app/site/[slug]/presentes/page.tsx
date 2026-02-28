import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { buildEffectiveAvailabilityMap } from "@/lib/gift-availability";
import { resolveThemeBodyFont, resolveThemeTitleFont } from "@/lib/theme-fonts";
import GiftsFilterMenu from "@/components/public/GiftsFilterMenu";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const fallbackFeePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 11.99);
const feePercentPix = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE_PIX ?? fallbackFeePercent);

function calculateDisplayPrice(basePrice: number, feeMode: "PASS_TO_GUEST" | "ABSORB") {
  if (feeMode !== "PASS_TO_GUEST") return basePrice;
  return Number((basePrice * (1 + feePercentPix / 100)).toFixed(2));
}

const heroTextShadow = "0 2px 10px rgba(0,0,0,0.32)";

export const runtime = "nodejs";
export const revalidate = 60;

export default async function SiteGiftsBySlugPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { f?: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const rawFilter = (searchParams?.f || "").toLowerCase();
  const activeFilter: "all" | "available" | "price_desc" | "price_asc" | "name_asc" =
    rawFilter === "available" ||
    rawFilter === "price_desc" ||
    rawFilter === "price_asc" ||
    rawFilter === "name_asc"
      ? (rawFilter as "available" | "price_desc" | "price_asc" | "name_asc")
      : "all";

  const list = await prisma.giftList.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      title: true,
      description: true,
      feeMode: true,
      pageLayout: {
        select: {
          theme: true,
        },
      },
    },
  });

  if (!list || !list.isPublished) return notFound();

  const gifts = await prisma.giftItem.findMany({
    where: { giftListId: list.id, isActive: true },
    orderBy: { order: "asc" },
  });

  const availabilityByGiftId = await buildEffectiveAvailabilityMap(
    gifts.map((gift) => ({ id: gift.id, totalQuantity: gift.totalQuantity }))
  );

  const theme = (list.pageLayout?.theme as any) || {};
  const primaryColor = theme.primary_color || "#C86E52";
  const fontTitle = resolveThemeTitleFont(
    typeof theme.gifts_page_title_font === "string" && theme.gifts_page_title_font.trim()
      ? theme.gifts_page_title_font
      : "Cormorant Garamond"
  );
  const fontBody = resolveThemeBodyFont(
    typeof theme.gifts_page_message_font === "string" && theme.gifts_page_message_font.trim()
      ? theme.gifts_page_message_font
      : "Inter"
  );
  const titleColor =
    typeof theme.gifts_page_title_color === "string" && theme.gifts_page_title_color.trim()
      ? theme.gifts_page_title_color
      : "#FFFFFF";
  const messageColor =
    typeof theme.gifts_page_message_color === "string" && theme.gifts_page_message_color.trim()
      ? theme.gifts_page_message_color
      : "#5F4A41";
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
      : activeFilter === "price_desc"
        ? [...giftsWithAvailability].sort((a, b) => b.displayPrice - a.displayPrice)
        : activeFilter === "price_asc"
          ? [...giftsWithAvailability].sort((a, b) => a.displayPrice - b.displayPrice)
          : activeFilter === "name_asc"
            ? [...giftsWithAvailability].sort((a, b) => a.gift.name.localeCompare(b.gift.name, "pt-BR"))
            : giftsWithAvailability;
  return (
    <main className="min-h-screen bg-[#faf7f5]">
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
          <Link
            href={`/site/${encodeURIComponent(slug)}`}
            aria-label="Voltar ao site"
            className="absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/14 text-white backdrop-blur-sm transition hover:bg-white/22 md:left-6 md:top-6"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="absolute inset-0 p-6 md:p-10 flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-3xl md:text-5xl leading-tight"
                style={{ fontFamily: fontTitle, color: titleColor, textShadow: heroTextShadow }}
              >
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <section className="max-w-6xl mx-auto px-4 pt-8">
          <Link
            href={`/site/${encodeURIComponent(slug)}`}
            aria-label="Voltar ao site"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
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
            <GiftsFilterMenu activeFilter={activeFilter} primaryColor={primaryColor} />

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

