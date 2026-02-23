'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type GiftModelCategory = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  thumbnail: string | null;
  itemsCount: number;
};

export default function GiftModelsCategoriesPage() {
  const [categories, setCategories] = useState<GiftModelCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/gift-models', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Erro ao carregar categorias');
        }
        if (!cancelled) {
          setCategories(Array.isArray(data?.categories) ? data.categories : []);
        }
      } catch (error: any) {
        if (!cancelled) {
          alert(error?.message || 'Erro ao carregar modelos prontos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fbf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Modelos prontos</h1>
            <p className="text-sm text-gray-600 mt-1">Escolha uma categoria para importar presentes para sua lista.</p>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard/presentes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para presentes
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Carregando categorias...</p>
        ) : categories.length === 0 ? (
          <Card className="p-6 border-[#ead9cd] text-sm text-gray-600">Nenhuma categoria dispon?vel no momento.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border-[#ead9cd] overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                  {category.thumbnail ? (
                    <img src={category.thumbnail} alt={category.name} className="h-20 w-28 rounded-md object-cover border border-[#ead9cd]" />
                  ) : (
                    <div className="h-20 w-28 rounded-md bg-[#f8eee6] border border-[#ead9cd]" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg text-gray-900 truncate">{category.name}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{category.summary || 'Categoria de modelos prontos.'}</p>
                    <p className="text-xs text-gray-500 mt-2">{category.itemsCount} presentes</p>
                  </div>

                  <Button asChild variant="outline" className="shrink-0 w-full sm:w-auto">
                    <Link href={`/dashboard/presentes/modelos/${encodeURIComponent(category.slug)}`}>
                      Abrir
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
