'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, EyeOff } from 'lucide-react';

type MessageRow = {
  id: string;
  guestName: string;
  content: string;
  signature?: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string;
  order?: {
    totalAmount?: number | string;
    giftItem?: { name?: string } | null;
  } | null;
};

export default function RecadosPage() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch('/api/gift-lists/my-list/full?view=recados', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao carregar recados');
      setMessages(data?.messages ?? []);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao carregar recados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function patchMessage(id: string, payload: { isPublic?: boolean; isFavorite?: boolean }) {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? 'Erro ao atualizar recado');

    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...payload } : m)));
  }

  if (loading) return <div className="p-4 md:p-6">Carregando recados...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">Recados</h1>
        <p className="text-gray-500">Mensagens carinhosas dos seus convidados</p>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-500">Nenhum recado ainda.</CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-medium text-foreground">{message.guestName}</h3>
                    <p className="text-sm text-gray-500">{new Date(message.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={message.isFavorite ? 'default' : 'outline'}
                      onClick={() => patchMessage(message.id, { isFavorite: !message.isFavorite })}
                    >
                      <Heart className={`w-4 h-4 ${message.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchMessage(message.id, { isPublic: !message.isPublic })}
                    >
                      {message.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {message.order?.giftItem?.name ? <Badge className="mb-2">{message.order.giftItem.name}</Badge> : null}
                <p className="text-gray-600">{message.content}</p>
                {message.signature ? <p className="text-xs text-gray-500 mt-2">- {message.signature}</p> : null}
                {message.order?.totalAmount ? (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    {Number(message.order.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
