import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { isCategoryMetaTemplate, normalizeCategorySlug, parseCategoryMarkerName, prettyCategoryName } from '@/lib/template-categories';
import { isGiftModelTemplate } from '@/lib/gift-models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TemplatesCategoryFilter from '@/components/marketing/TemplatesCategoryFilter';

type TemplateCard = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  preview: string;
};

type TemplatesPageProps = {
  searchParams?: { categoria?: string };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildPreview(template: { thumbnail?: string | null; defaultTheme?: any }) {
  const theme = (template.defaultTheme as any) || {};
  if (typeof template.thumbnail === 'string' && template.thumbnail) {
    return `url(${template.thumbnail}) center / cover no-repeat`;
  }
  return `linear-gradient(135deg, ${theme.secondary_color || '#8E3D2C'}, ${theme.primary_color || '#C65A3A'})`;
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const session = await getServerSession(authOptions);
  const chooseHref = (slug: string) =>
    session?.user?.id ? `/dashboard/editor?template=${encodeURIComponent(slug)}` : `/auth/cadastro?template=${encodeURIComponent(slug)}`;

  const selectedCategory = normalizeCategorySlug(searchParams?.categoria || '');

  const rawTemplates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    select: {
      slug: true,
      name: true,
      category: true,
      description: true,
      thumbnail: true,
      defaultTheme: true,
    },
  });

  const dbTemplates = rawTemplates.filter(
    (template) => !isCategoryMetaTemplate(template) && !isGiftModelTemplate(template)
  );

  const templateCards: TemplateCard[] = dbTemplates.map((template) => {
    const category = normalizeCategorySlug(template.category || 'geral') || 'geral';
    return {
      slug: template.slug,
      name: template.name,
      category,
      categoryLabel: prettyCategoryName(category),
      description: template.description || 'Template pronto para sua lista de presentes.',
      preview: buildPreview(template),
    };
  });

  const markerTemplates = await prisma.template.findMany({
    where: {
      description: { startsWith: '__CATEGORY_MARKER__:' },
    },
    select: {
      category: true,
      description: true,
    },
  });

  const categoryNameMap = new Map<string, string>();
  for (const marker of markerTemplates) {
    const slug = normalizeCategorySlug(marker.category || '');
    if (!slug) continue;
    categoryNameMap.set(slug, parseCategoryMarkerName(marker.description, prettyCategoryName(slug)));
  }

  const grouped = new Map<string, TemplateCard[]>();
  for (const card of templateCards) {
    const arr = grouped.get(card.category) || [];
    arr.push(card);
    grouped.set(card.category, arr);
  }

  const categories = Array.from(grouped.entries())
    .map(([slug, cards]) => ({
      slug,
      name: categoryNameMap.get(slug) || cards[0]?.categoryLabel || prettyCategoryName(slug),
      count: cards.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  categories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const visibleCategories = selectedCategory
    ? categories.filter((category) => category.slug === selectedCategory)
    : categories;

  return (
    <div className="min-h-screen bg-[#FAF4EF] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl text-[#8E3D2C]">Templates por Tipo de Evento</h1>
          <p className="text-gray-600">Escolha o tipo e depois selecione o template ideal para sua lista.</p>
        </div>

        <div className="rounded-2xl border border-[#ead9cd] bg-white p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Tipo de evento</p>
              <p className="font-semibold text-[#8E3D2C]">
                {selectedCategory
                  ? categories.find((category) => category.slug === selectedCategory)?.name || 'Todos'
                  : 'Todos'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <TemplatesCategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                totalCount={templateCards.length}
              />
            </div>
          </div>
        </div>

        {templateCards.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#d9b9a4] bg-white p-8 text-center text-[#8E3D2C]">
            Nenhum template publicado ainda.
          </section>
        ) : null}

        {visibleCategories.map((category) => {
          const cards = grouped.get(category.slug) || [];
          const cardsToRender = selectedCategory ? cards : cards.slice(0, 4);
          return (
            <section key={category.slug} className="space-y-4">
              <h2 className="font-display text-3xl text-[#8E3D2C]">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardsToRender.map((template) => (
                  <article key={template.slug} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-40" style={{ background: template.preview }} />
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight min-w-0">{template.name}</h3>
                        <span className="shrink-0 whitespace-nowrap text-[11px] leading-none px-2.5 py-1.5 rounded-full bg-[#F1E3D6] text-[#8E3D2C]">
                          {category.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 min-h-[40px]">{template.description}</p>

                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="border-[#d7b7a3] text-[#8E3D2C] hover:bg-[#fff7f1]">
                          <Link href={`/templates/${encodeURIComponent(template.slug)}`}>Ver</Link>
                        </Button>
                        <Button asChild className="bg-[#C65A3A] hover:bg-[#8E3D2C] text-white">
                          <Link href={chooseHref(template.slug)}>Usar modelo</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
                {cards.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-[#d9b9a4] bg-white p-6 text-sm text-gray-600">
                    Em breve novos templates para esta categoria.
                  </div>
                ) : null}
              </div>
              {!selectedCategory && cards.length > 4 ? (
                <div>
                  <Button asChild variant="outline" className="border-[#d7b7a3] text-[#8E3D2C] hover:bg-[#fff7f1]">
                    <Link href={`/templates?categoria=${encodeURIComponent(category.slug)}`}>Ver mais</Link>
                  </Button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
