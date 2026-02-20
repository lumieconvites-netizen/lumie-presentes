import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PublicPageView from '@/components/public/PublicPageView';
import { isCategoryMetaTemplate } from '@/lib/template-categories';
import { extractTemplateGiftItemsFromBlocks } from '@/lib/template-gifts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapTemplateGift(gift: any, index: number) {
  return {
    id: `template-gift-${index}`,
    title: gift.name,
    description: gift.description || '',
    value: Number(gift.basePrice || 0),
    photo: gift.imageUrl || '',
    quantity: Number(gift.totalQuantity || 1),
    quantityAvailable: Number(gift.totalQuantity || 1),
    status: 'active',
  };
}

export default async function TemplatePreviewPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug || '').trim().toLowerCase();
  if (!slug) return notFound();

  const template = await prisma.template.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      defaultBlocks: true,
      defaultTheme: true,
      isActive: true,
      description: true,
    },
  });

  if (!template || !template.isActive || isCategoryMetaTemplate(template)) return notFound();

  const blocks = Array.isArray(template.defaultBlocks) ? template.defaultBlocks : [];
  const gifts = extractTemplateGiftItemsFromBlocks(blocks).map(mapTemplateGift);

  return (
    <div className="min-h-screen bg-[#FAF4EF]">
      <div className="sticky top-0 z-40 border-b border-[#e7d8cb] bg-[#fffaf7]/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[#8E3D2C]/70">Preview de template</p>
            <h1 className="font-display text-xl text-[#8E3D2C] truncate">{template.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="inline-flex h-9 items-center rounded-md border border-[#d7b7a3] px-3 text-sm text-[#8E3D2C] hover:bg-[#fff2ea]"
            >
              Voltar
            </Link>
            <Link
              href={`/auth/cadastro?template=${encodeURIComponent(template.slug)}`}
              className="inline-flex h-9 items-center rounded-md bg-[#C65A3A] px-3 text-sm text-white hover:bg-[#8E3D2C]"
            >
              Escolher este template
            </Link>
          </div>
        </div>
      </div>

      <PublicPageView
        blocks={blocks}
        gifts={gifts}
        messages={[]}
        settings={{ slug: `template-${template.slug}` }}
        theme={(template.defaultTheme as any) || {}}
      />
    </div>
  );
}

