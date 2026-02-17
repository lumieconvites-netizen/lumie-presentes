import Link from 'next/link';
import { TEMPLATE_PRESETS } from '@/lib/template-presets';
import { Button } from '@/components/ui/button';

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#FAF4EF] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl text-[#8E3D2C]">Escolha seu Template</h1>
          <p className="text-gray-600">5 opcoes prontas para voce comecar e personalizar em minutos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATE_PRESETS.map((template) => (
            <article key={template.slug} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-40" style={{ background: template.preview }} />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{template.name}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#F1E3D6] text-[#8E3D2C]">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 min-h-[40px]">{template.description}</p>

                <div className="flex gap-2">
                  <Button asChild className="flex-1 bg-[#C65A3A] hover:bg-[#8E3D2C] text-white">
                    <Link href={`/auth/cadastro?template=${encodeURIComponent(template.slug)}`}>
                      Escolher template
                    </Link>
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
