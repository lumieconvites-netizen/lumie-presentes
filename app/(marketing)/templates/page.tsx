import Link from 'next/link';
import { TEMPLATE_PRESETS } from '@/lib/template-presets';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';

type TemplateCard = {
  slug: string;
  name: string;
  category: string;
  description: string;
  preview: string;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const dbTemplates = await prisma.template.findMany({
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

  const templateCards: TemplateCard[] =
    dbTemplates.length > 0
      ? dbTemplates.map((template) => {
          const theme = (template.defaultTheme as any) || {};
          const preview =
            typeof template.thumbnail === 'string' && template.thumbnail
              ? `url(${template.thumbnail}) center / cover no-repeat`
              : `linear-gradient(135deg, ${theme.secondary_color || '#8E3D2C'}, ${theme.primary_color || '#C65A3A'})`;

          return {
            slug: template.slug,
            name: template.name,
            category: template.category || 'geral',
            description: template.description || 'Template pronto para sua lista de presentes.',
            preview,
          };
        })
      : TEMPLATE_PRESETS.map((template) => ({
          slug: template.slug,
          name: template.name,
          category: template.category,
          description: template.description,
          preview: template.preview,
        }));

  return (
    <div className="min-h-screen bg-[#FAF4EF] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl text-[#8E3D2C]">Escolha seu Template</h1>
          <p className="text-gray-600">{templateCards.length} opcoes prontas para voce comecar e personalizar em minutos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templateCards.map((template) => (
            <article key={template.slug} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-40" style={{ background: template.preview }} />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{template.name}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#F1E3D6] text-[#8E3D2C]">{template.category}</span>
                </div>
                <p className="text-sm text-gray-600 min-h-[40px]">{template.description}</p>

                <div className="flex gap-2">
                  <Button asChild className="flex-1 bg-[#C65A3A] hover:bg-[#8E3D2C] text-white">
                    <Link href={`/auth/cadastro?template=${encodeURIComponent(template.slug)}`}>Escolher template</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

