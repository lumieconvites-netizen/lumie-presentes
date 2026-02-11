'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit, Copy, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Gift {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  totalQuantity: number;
  availableQty: number;
  isActive: boolean;
}

export default function GiftsPage() {
  const { data: session, status } = useSession();

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftListId, setGiftListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // espera o next-auth resolver o status
    if (status === 'loading') return;

    // se não estiver logado, manda pro login
    if (status === 'unauthenticated') {
      window.location.href = '/login';
      return;
    }

    const ac = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        // Buscar gift list do usuário
        const listRes = await fetch('/api/gift-lists/my-list', {
          signal: ac.signal,
          cache: 'no-store',
        });

        if (!listRes.ok) {
          const data = await listRes.json().catch(() => ({}));
          throw new Error(data?.error || 'Erro ao buscar lista');
        }

        const listData = await listRes.json();

        if (!listData?.id) {
          throw new Error('Lista não encontrada');
        }

        setGiftListId(listData.id);

        // Buscar presentes
        const giftsRes = await fetch(`/api/gifts?giftListId=${listData.id}`, {
          signal: ac.signal,
          cache: 'no-store',
        });

        if (!giftsRes.ok) {
          const data = await giftsRes.json().catch(() => ({}));
          throw new Error(data?.error || 'Erro ao buscar presentes');
        }

        const giftsData = await giftsRes.json();
        setGifts(Array.isArray(giftsData) ? giftsData : []);
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        toast.error(error?.message || 'Erro ao carregar presentes');
      } finally {
        setIsLoading(false);
      }
    })();

    return () => ac.abort();
  }, [status]);

  const refetch = async () => {
    // só reaproveita o mesmo fluxo
    setIsLoading(true);
    try {
      const listRes = await fetch('/api/gift-lists/my-list', { cache: 'no-store' });
      const listData = await listRes.json();

      if (!listRes.ok || !listData?.id) {
        throw new Error(listData?.error || 'Lista não encontrada');
      }

      setGiftListId(listData.id);

      const giftsRes = await fetch(`/api/gifts?giftListId=${listData.id}`, { cache: 'no-store' });
      const giftsData = await giftsRes.json();

      if (!giftsRes.ok) {
        throw new Error(giftsData?.error || 'Erro ao buscar presentes');
      }

      setGifts(Array.isArray(giftsData) ? giftsData : []);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar presentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/gifts/${id}/duplicate`, {
        method: 'POST',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao duplicar presente');
      }

      toast.success('Presente duplicado!');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao duplicar presente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este presente?')) return;

    try {
      const res = await fetch(`/api/gifts/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao deletar presente');
      }

      toast.success('Presente deletado!');
      setGifts((prev) => prev.filter((g) => g.id !== id));
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao deletar presente');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-terracota-700">
            Meus Presentes
          </h1>
          <p className="text-muted-foreground">
            {gifts.length} de 100 presentes cadastrados
          </p>
        </div>

        <Button
          asChild
          className="bg-terracota-500 hover:bg-terracota-600"
          disabled={gifts.length >= 100}
        >
          <Link href="/dashboard/presentes/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo presente
          </Link>
        </Button>
      </div>

      {/* Lista de presentes */}
      {gifts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="font-display text-2xl font-bold text-terracota-700 mb-2">
              Nenhum presente cadastrado
            </h2>
            <p className="text-muted-foreground mb-6">
              Comece criando seu primeiro presente para sua lista
            </p>
            <Button asChild className="bg-terracota-500 hover:bg-terracota-600">
              <Link href="/dashboard/presentes/novo">
                Cadastrar primeiro presente
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => (
            <Card key={gift.id} className="overflow-hidden">
              {/* Imagem */}
              <div className="relative h-48 bg-gradient-to-br from-terracota-100 to-gold-100">
                {gift.imageUrl ? (
                  <Image
                    src={gift.imageUrl}
                    alt={gift.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">
                    🎁
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <CardContent className="p-4">
                <h3 className="font-display text-xl font-bold text-terracota-700 mb-1">
                  {gift.name}
                </h3>

                {gift.description ? (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {gift.description}
                  </p>
                ) : null}

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-terracota-600">
                    {formatCurrency(Number(gift.basePrice))}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {gift.availableQty} de {gift.totalQuantity} disponível(eis)
                  </span>
                </div>

                {!gift.isActive && (
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mb-3">
                    Inativo
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/dashboard/presentes/${gift.id}/editar`}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(gift.id)}
                    disabled={gifts.length >= 100}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(gift.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
