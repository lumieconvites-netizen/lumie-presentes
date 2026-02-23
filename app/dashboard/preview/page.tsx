'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import PublicPageView from '@/components/public/PublicPageView';

function mapGift(g: any) {
  return {
    id: g.id,
    title: g.name,
    description: g.description,
    value: Number(g.basePrice ?? 0),
    photo: g.imageUrl,
    quantity: g.totalQuantity,
    quantityAvailable: g.availableQty,
    status: g.isActive ? 'active' : 'inactive',
  };
}

function mapMessage(m: any) {
  return {
    id: m.id,
    guestName: m.guestName,
    message: m.content,
    date: m.createdAt,
    isPublic: m.isPublic,
    isFavorite: m.isFavorite,
  };
}

export default function PreviewPage() {
  const [loading, setLoading] = useState(true);
  const [giftList, setGiftList] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/gift-lists/my-list/full?view=preview', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Erro ao carregar preview');
        if (!cancelled) setGiftList(data);
      } catch (error: any) {
        if (!cancelled) alert(error?.message ?? 'Erro ao carregar preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const blocks = useMemo(() => (Array.isArray(giftList?.pageLayout?.blocks) ? giftList.pageLayout.blocks : []), [giftList]);
  const theme = useMemo(() => (giftList?.pageLayout?.theme && typeof giftList.pageLayout.theme === 'object' ? giftList.pageLayout.theme : {}), [giftList]);
  const gifts = useMemo(() => (giftList?.gifts ?? []).map(mapGift), [giftList]);
  const messages = useMemo(() => (giftList?.messages ?? []).map(mapMessage), [giftList]);

  if (loading) return <div className="p-4 md:p-6">Carregando preview...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Button variant="ghost" className="w-full sm:w-auto justify-start" asChild>
                <Link href="/dashboard/editor">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Editor
                </Link>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-gray-300" />
              <span className="text-sm text-gray-600">Modo Preview - Visualizacao como convidado</span>
            </div>
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/dashboard/editor">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicPageView blocks={blocks} gifts={gifts} messages={messages} settings={{ slug: giftList?.slug }} theme={theme} />
    </div>
  );
}
