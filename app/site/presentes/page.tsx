'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StatusFilter = 'all' | 'active' | 'inactive';

function formatBRL(v: number) {
  // Evita inconsistência: garante number + formatação só no client (vamos renderizar só após mounted)
  const n = Number(v || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SitePresentesPage() {
  const { gifts, settings } = useUser();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // pede sync quando abrir (pega dados atualizados do editor/dashboard)
  useEffect(() => {
    try {
      const ch = new BroadcastChannel('lumie_preview');
      ch.postMessage({ type: 'REQUEST_SYNC' });
      ch.close();
    } catch {}
  }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const themePrimary = settings?.theme?.primary_color ?? '#C86E52';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return gifts
      .filter((g) => {
        const matchesSearch =
          !q ||
          (g.title || '').toLowerCase().includes(q) ||
          (g.description || '').toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all' || g.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // ativos primeiro, depois inativos
        const aScore = a.status === 'active' ? 0 : 1;
        const bScore = b.status === 'active' ? 0 : 1;
        return aScore - bScore;
      });
  }, [gifts, search, statusFilter]);

  // ✅ Evita hydration mismatch: só renderiza quando estiver no client
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="h-8 w-44 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-80 bg-gray-100 rounded-md animate-pulse mt-3" />
              </div>
              <div className="h-10 w-32 bg-gray-100 rounded-md animate-pulse" />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 bg-gray-100 rounded-md animate-pulse" />
              <div className="w-full sm:w-56 h-10 bg-gray-100 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-xl overflow-hidden">
                <div className="h-52 bg-gray-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-100 rounded-md animate-pulse" />
                  <div className="flex items-end justify-between pt-2">
                    <div className="space-y-2">
                      <div className="h-8 w-28 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-3 w-36 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                    <div className="h-10 w-28 bg-gray-100 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Presentes</h1>
              <p className="text-gray-600 mt-1">Escolha um presente para contribuir com carinho ✨</p>
            </div>

            <Button variant="outline" asChild>
              <Link href="/site">Voltar ao site</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar presentes..."
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-5xl mb-3">🎁</div>
            <div className="text-lg font-semibold">Nenhum presente encontrado</div>
            <div className="text-sm text-gray-500 mt-1">Tente ajustar a busca ou filtros.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((gift) => {
              const soldOut = (gift.quantityAvailable ?? 0) <= 0;
              const inactive = gift.status !== 'active';

              return (
                <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-52 bg-gray-100">
                    {gift.photo ? (
                      <Image src={gift.photo} alt={gift.title} fill className="object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300">
                        <Gift className="w-14 h-14" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-lg leading-tight">{gift.title}</h3>
                      <Badge variant={gift.status === 'active' ? 'default' : 'secondary'}>
                        {gift.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {gift.description ? (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{gift.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">Sem descrição</p>
                    )}

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-2xl font-bold" style={{ color: themePrimary }}>
                          {formatBRL(Number(gift.value || 0))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Disponível: <b>{gift.quantityAvailable ?? 0}</b> / {gift.quantity ?? 0}
                        </div>
                      </div>

                      {soldOut || inactive ? (
                        <Button
                          className="text-white opacity-70 cursor-not-allowed"
                          style={{ backgroundColor: themePrimary }}
                          disabled
                        >
                          {soldOut ? 'Esgotado' : 'Indisponível'}
                        </Button>
                      ) : (
                        <Button className="text-white" style={{ backgroundColor: themePrimary }} asChild>
                          <Link href={`/checkout/${gift.id}`}>Presentear</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
