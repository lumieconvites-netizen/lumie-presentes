'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const feePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 7.99);

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcTotals(base: number, feePassedToGuest: boolean) {
  const fee = Number((base * (feePercent / 100)).toFixed(2));
  const amount = feePassedToGuest ? Number((base + fee).toFixed(2)) : base;
  const netAmount = feePassedToGuest ? base : Number((base - fee).toFixed(2));
  return { amount, fee, netAmount };
}

export default function CheckoutPage({ params }: { params: { giftId: string } }) {
  const router = useRouter();
  const { gifts, settings, addMessage, addPayment, updateGift } = useUser();

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

  const gift = useMemo(
    () => gifts.find((g) => g.id === params.giftId) ?? null,
    [gifts, params.giftId]
  );

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const feePassedToGuest = !!settings?.feePassedToGuest;

  const baseTotal = useMemo(() => {
    const v = Number(gift?.value ?? 0) * Math.max(1, Number(qty || 1));
    return Number(v.toFixed(2));
  }, [gift?.value, qty]);

  const totals = useMemo(
    () => calcTotals(baseTotal, feePassedToGuest),
    [baseTotal, feePassedToGuest]
  );

  if (!mounted) return null;

  if (!gift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-3xl mb-2">🎁</div>
          <div className="text-lg font-semibold">Presente não encontrado</div>
          <div className="text-sm text-gray-500 mt-1">
            Volte para o site e selecione um presente novamente.
          </div>
          <Button className="mt-6" onClick={() => router.push('/site')}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const available = gift.quantityAvailable ?? 0;
  const qtyMax = Math.max(1, available);

  async function handlePay() {
    // ✅ trava o gift para o TS não acusar null em build
    const currentGift = gift;
    if (!currentGift) return;

    const q = Math.max(1, Number(qty || 1));

    if (!guestName.trim()) return alert('Digite seu nome.');
    if (!guestEmail.trim()) return alert('Digite seu e-mail.');

    const currentAvailable = currentGift.quantityAvailable ?? 0;

    if (currentAvailable <= 0) return alert('Esse presente não está mais disponível.');
    if (q > currentAvailable) return alert(`Quantidade indisponível. Máximo: ${currentAvailable}.`);

    setLoading(true);

    // 1) baixa estoque
    updateGift(currentGift.id, { quantityAvailable: currentAvailable - q });

    // 2) cria pagamento
    addPayment({
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      giftTitle: currentGift.title,
      amount: totals.amount,
      fee: totals.fee,
      netAmount: totals.netAmount,
      status: 'paid',
      date: new Date(),
      message: note.trim() ? note.trim() : undefined,
    });

    // 3) salva recado no mural
    if (note.trim()) {
      addMessage({
        guestName: guestName.trim(),
        message: note.trim(),
        giftId: currentGift.id,
        giftTitle: currentGift.title,
        amount: totals.amount,
        date: new Date(),
        isPublic: !!settings?.messagesPublic,
        isFavorite: false,
      });
    }

    setLoading(false);

    alert('Pagamento registrado! ✅ (MVP local)');
    router.push('/site');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Resumo do presente */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="relative w-full h-56 bg-gray-100">
              {gift.photo ? (
                <Image src={gift.photo} alt={gift.title} fill className="object-cover" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Sem foto
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold">{gift.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{gift.description}</div>
                </div>
                <Badge variant={gift.status === 'active' ? 'default' : 'secondary'}>
                  {gift.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Disponível: <b>{gift.quantityAvailable}</b> de {gift.quantity}
              </div>

              <div className="mt-4">
                <div className="text-2xl font-bold">{formatBRL(gift.value)}</div>
                <div className="text-xs text-gray-500">
                  {feePassedToGuest
                    ? `Taxa repassada (${feePercent}%)`
                    : `Taxa assumida por você (${feePercent}%)`}
                </div>
              </div>
            </div>
          </Card>

          {/* Form checkout */}
          <Card className="lg:col-span-3 p-6">
            <div className="text-xl font-semibold">Checkout</div>
            <div className="text-sm text-gray-500 mt-1">
              Finalize seu presente e deixe um recado (opcional).
            </div>

            <div className="grid gap-3 mt-6">
              <Input
                placeholder="Seu nome"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <Input
                placeholder="Seu e-mail"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={1}
                  max={qtyMax}
                  placeholder="Quantidade"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
                <Input disabled value={`Máx: ${qtyMax}`} />
              </div>

              <Input
                placeholder="Recado para o mural (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="mt-6 rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <b>{formatBRL(baseTotal)}</b>
              </div>

              <div className="flex items-center justify-between text-sm mt-2">
                <span>Taxa ({feePercent}%)</span>
                <b>{formatBRL(totals.fee)}</b>
              </div>

              <div className="flex items-center justify-between text-base mt-3 pt-3 border-t">
                <span>Total</span>
                <b>{formatBRL(totals.amount)}</b>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {feePassedToGuest
                  ? 'O convidado paga a taxa (total acima).'
                  : 'A taxa é descontada do recebedor (netAmount).'}
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={handlePay}
              disabled={loading || gift.status !== 'active' || (gift.quantityAvailable ?? 0) <= 0}
            >
              {loading ? 'Processando...' : `Pagar ${formatBRL(totals.amount)}`}
            </Button>

            <div className="text-xs text-gray-400 mt-3">
              MVP local: salva pagamento e recado no dashboard. Depois trocamos por Pagar.me.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
