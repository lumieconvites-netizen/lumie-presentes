import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { isCategoryMetaTemplate, normalizeCategorySlug, parseCategoryMarkerName, prettyCategoryName } from '@/lib/template-categories';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

  const dbTemplates = rawTemplates.filter((template) => !isCategoryMetaTemplate(template));

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/templates"
            className={`rounded-2xl border p-4 bg-white ${!selectedCategory ? 'border-[#c65a3a] ring-2 ring-[#f1d8cc]' : 'border-[#ead9cd]'}`}
          >
            <p className="font-semibold text-[#8E3D2C]">Todos</p>
            <p className="text-sm text-gray-500">{templateCards.length} templates</p>
          </Link>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/templates?categoria=${encodeURIComponent(category.slug)}`}
              className={`rounded-2xl border p-4 bg-white ${selectedCategory === category.slug ? 'border-[#c65a3a] ring-2 ring-[#f1d8cc]' : 'border-[#ead9cd]'}`}
            >
              <p className="font-semibold text-[#8E3D2C]">{category.name}</p>
              <p className="text-sm text-gray-500">{category.count} templates</p>
            </Link>
          ))}
        </div>

        {templateCards.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#d9b9a4] bg-white p-8 text-center text-[#8E3D2C]">
            Nenhum template publicado ainda.
          </section>
        ) : null}

        {visibleCategories.map((category) => {
          const cards = grouped.get(category.slug) || [];
          return (
            <section key={category.slug} className="space-y-4">
              <h2 className="font-display text-3xl text-[#8E3D2C]">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((template) => (
                  <article key={template.slug} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-40" style={{ background: template.preview }} />
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-[#F1E3D6] text-[#8E3D2C]">{category.name}</span>
                      </div>
                      <p className="text-sm text-gray-600 min-h-[40px]">{template.description}</p>

                      <Button asChild className="w-full bg-[#C65A3A] hover:bg-[#8E3D2C] text-white">
                        <Link href={chooseHref(template.slug)}>Escolher template</Link>
                      </Button>
                    </div>
                  </article>
                ))}
                {cards.length === 0 ? (
                  <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-[#d9b9a4] bg-white p-6 text-sm text-gray-600">
                    Em breve novos templates para esta categoria.
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
