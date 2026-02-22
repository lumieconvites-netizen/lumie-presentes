'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckSquare, Square, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type GiftModelItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  totalQuantity: number;
};

type GiftModelCategory = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  thumbnail: string | null;
  itemsCount: number;
  items: GiftModelItem[];
};

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function GiftModelDetailsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [giftListId, setGiftListId] = useState('');
  const [category, setCategory] = useState<GiftModelCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [listRes, categoryRes] = await Promise.all([
          fetch('/api/gift-lists/my-list', { cache: 'no-store' }),
          fetch(`/api/gift-models/${encodeURIComponent(params.slug)}`, { cache: 'no-store' }),
        ]);

        const listData = await parseJsonSafe(listRes);
        if (!listRes.ok) {
          throw new Error(listData?.error || 'Erro ao carregar lista');
        }

        const categoryData = await parseJsonSafe(categoryRes);
        if (!categoryRes.ok) {
          throw new Error(categoryData?.error || 'Erro ao carregar categoria');
        }

        if (!cancelled) {
          setGiftListId(String(listData?.id || ''));
          setCategory(categoryData?.category || null);
        }
      } catch (error: any) {
        if (!cancelled) {
          alert(error?.message || 'Erro ao carregar modelos');
          router.push('/dashboard/presentes/modelos');
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
  }, [params.slug, router]);

  const selectedCount = selectedIds.length;
  const totalCount = category?.items?.length || 0;

  const allSelected = useMemo(() => {
    if (!category?.items?.length) return false;
    return selectedIds.length === category.items.length;
  }, [selectedIds, category?.items]);

  function toggleSelection(itemId: string) {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }

  function toggleSelectAll() {
    if (!category?.items?.length) return;
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(category.items.map((item) => item.id));
    }
  }

  async function importItems(mode: 'all' | 'selected') {
    if (!category || !giftListId) return;
    if (mode === 'selected' && selectedIds.length === 0) {
      alert('Selecione ao menos um presente.');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch(`/api/gift-models/${encodeURIComponent(category.slug)}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftListId,
          selectedItemIds: mode === 'selected' ? selectedIds : undefined,
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao importar presentes');
      }

      alert(`${data?.importedCount || 0} presente(s) importado(s) para sua lista.`);
      router.push('/dashboard/presentes');
    } catch (error: any) {
      alert(error?.message || 'Erro ao importar presentes');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">{category?.name || 'Modelos prontos'}</h1>
            <p className="text-sm text-gray-600 mt-1">{category?.summary || 'Escolha os presentes que deseja adicionar na sua lista.'}</p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/presentes/modelos">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar categorias
              </Link>
            </Button>
            <Button variant="outline" onClick={toggleSelectAll} disabled={loading || importing || !totalCount}>
              {allSelected ? <Square className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              {allSelected ? 'Limpar selecao' : 'Selecionar todos'}
            </Button>
            <Button onClick={() => importItems('selected')} disabled={loading || importing || selectedCount === 0}>
              Importar selecionados ({selectedCount})
            </Button>
            <Button onClick={() => importItems('all')} disabled={loading || importing || !totalCount}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Importar todos ({totalCount})
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Carregando presentes da categoria...</p>
        ) : !category || category.items.length === 0 ? (
          <Card className="p-6 border-[#ead9cd] text-sm text-gray-600">
            Ainda nao ha presentes cadastrados nesta categoria.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {category.items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <Card key={item.id} className="border-[#ead9cd] overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggleSelection(item.id)}
                  >
                    <div className="relative h-52 bg-[#f8eee6]">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
                      <span className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium ${checked ? 'bg-[#c65a3a] text-white' : 'bg-white text-gray-700 border border-[#ead9cd]'}`}>
                        {checked ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600 min-h-[40px]">{item.description || 'Sem descricao'}</p>
                      <p className="text-lg font-bold text-[#8E3D2C]">{formatBRL(item.basePrice)}</p>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
