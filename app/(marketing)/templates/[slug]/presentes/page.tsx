import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isCategoryMetaTemplate } from '@/lib/template-categories';
import { extractTemplateGiftItemsFromBlocks } from '@/lib/template-gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function TemplateGiftsPreviewPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug || '').trim().toLowerCase();
  if (!slug) return notFound();

  const template = await prisma.template.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      thumbnail: true,
      defaultBlocks: true,
      defaultTheme: true,
      isActive: true,
    },
  });

  if (!template || !template.isActive || isCategoryMetaTemplate(template)) return notFound();

  const gifts = extractTemplateGiftItemsFromBlocks(template.defaultBlocks || []);
  const blocks = (Array.isArray(template.defaultBlocks) ? template.defaultBlocks : []) as any[];
  const giftsBlock = blocks.find((block) => block?.type === 'gifts');
  const giftsConfig = (giftsBlock?.config as any) || {};
  const theme = (template.defaultTheme as any) || {};
  const pageTitle = giftsConfig?.title || 'Lista de Presentes';
  const pageMessage = giftsConfig?.description || '';
  const pageCoverImage =
    (typeof theme?.gifts_page_cover_image === 'string' && theme.gifts_page_cover_image) ||
    (typeof giftsConfig?.coverImage === 'string' && giftsConfig.coverImage) ||
    '';

  return (
    <div className="min-h-screen bg-[#FAF4EF] py-8">
      <div className="max-w-6xl mx-auto space-y-6 px-4">
        <div className="rounded-2xl border border-[#e7d8cb] bg-[#fffaf7] p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl text-[#8E3D2C] truncate">Presentes do modelo</h1>
              <p className="text-[#6f584d]">{template.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/templates/${encodeURIComponent(template.slug)}`}
                className="inline-flex h-10 items-center rounded-md border border-[#d7b7a3] px-3 text-sm text-[#8E3D2C] hover:bg-[#fff2ea]"
              >
                Voltar ao preview
              </Link>
              <Link
                href={`/auth/cadastro?template=${encodeURIComponent(template.slug)}`}
                className="inline-flex h-10 items-center rounded-md bg-[#C65A3A] px-3 text-sm text-white hover:bg-[#8E3D2C]"
              >
                Usar modelo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {pageCoverImage ? (
        <div className="w-full bg-black">
          <img src={pageCoverImage} alt={`Capa da página ${pageTitle}`} className="w-full aspect-[16/9] object-cover md:aspect-auto md:h-[78vh]" />
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-[#e8dbcf] bg-white p-4 md:p-6">
          <h2 className="font-display text-2xl text-[#8E3D2C]">{pageTitle}</h2>
          {pageMessage ? <p className="mt-2 text-[#6f584d]">{pageMessage}</p> : null}
        </div>

        {gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d9b9a4] bg-white p-8 text-center text-[#8E3D2C]">
            Este modelo ainda não possui presentes cadastrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {gifts.map((gift, index) => (
              <article key={`${gift.name}-${index}`} className="rounded-2xl overflow-hidden border border-[#e8dbcf] bg-white shadow-sm">
                {gift.imageUrl ? (
                  <img src={gift.imageUrl} alt={gift.name} className="h-44 w-full object-cover" />
                ) : template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} className="h-44 w-full object-cover" />
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-[#f6ece4] to-[#efe1d7]" />
                )}
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold text-[#2b2b2b]">{gift.name}</h2>
                  {gift.description ? <p className="text-sm text-gray-600 line-clamp-2">{gift.description}</p> : null}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#8E3D2C]">{formatBRL(Number(gift.basePrice || 0))}</span>
                    <span className="text-gray-500">Qtd: {Number(gift.totalQuantity || 1)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
