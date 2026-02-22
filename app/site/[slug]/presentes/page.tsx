import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

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
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);

  const list = await prisma.giftList.findUnique({
    where: { slug },
    include: {
      pageLayout: true,
      gifts: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });

  if (!list || !list.isPublished) return notFound();

  const theme = (list.pageLayout?.theme as any) || {};
  const primaryColor = theme.primary_color || "#C86E52";
  const fontTitle = theme.font_title || "Cormorant Garamond";
  const pageTitle = list.title || "Lista de Presentes";
  const pageMessage = list.description || "Escolha um presente especial e participe desse momento.";
  const pageCoverImage = typeof theme.gifts_page_cover_image === "string" ? theme.gifts_page_cover_image : "";

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href={`/site/${encodeURIComponent(slug)}`} aria-label="Voltar ao site" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl" style={{ fontFamily: fontTitle }}>
            {pageTitle}
          </h1>
          <span className="w-10" />
        </div>
      </header>

      {pageCoverImage ? (
        <div className="w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pageCoverImage} alt={`Capa da pagina ${pageTitle}`} className="w-full aspect-[16/9] object-cover md:aspect-auto md:h-[78vh]" />
        </div>
      ) : null}

      <section className="max-w-6xl mx-auto px-4 py-10">
        {pageMessage ? <p className="text-gray-600 mb-8 max-w-3xl">{pageMessage}</p> : null}
        {list.gifts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-600">
            Ainda nao ha presentes cadastrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.gifts.map((gift) => {
              const soldOut = gift.availableQty <= 0;
              const displayPrice = calculateDisplayPrice(Number(gift.basePrice || 0), list.feeMode);
              return (
                <article key={gift.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="h-52 bg-gray-100">
                    {gift.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-semibold">{gift.name}</h2>
                    <p className="text-sm text-gray-600 mt-2 min-h-10">{gift.description || "Sem descricao"}</p>
                    <div className="flex items-center justify-between mt-5">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                          {formatBRL(displayPrice)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Disponivel: {gift.availableQty} de {gift.totalQuantity}
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
      </section>
    </main>
  );
}
