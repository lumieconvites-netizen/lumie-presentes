'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Crown, Loader2, QrCode, ShieldCheck } from 'lucide-react';

type ExclusiveData = {
  user: {
    id: string;
    name: string | null;
    email: string;
    plan: 'FREE' | 'PREMIUM';
    planExpiresAt: string | null;
  };
  plan: {
    name: string;
    priceInCents: number;
    partnerCommissionInCents: number;
    ambassadorCommissionInCents: number;
  };
  referrals: {
    partner: { id: string; name: string | null; email: string } | null;
    ambassador: { id: string; name: string | null; email: string } | null;
  };
  latestPurchase: {
    id: string;
    status: string;
    amount: number;
    paymentMethod: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
  } | null;
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

export default function PremiumCheckoutPage() {
  const [data, setData] = useState<ExclusiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardExpMonth, setCardExpMonth] = useState('');
  const [cardExpYear, setCardExpYear] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [pixPayload, setPixPayload] = useState<{
    purchaseId: string;
    qrCode: string | null;
    qrCodeUrl: string | null;
    expiresAt: string | null;
  } | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/plans/exclusive', { cache: 'no-store' });
      const json = await parseJsonSafe(res);
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel carregar o plano.');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Nao foi possivel carregar o plano.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!pixPayload?.purchaseId) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/plans/exclusive/status/${pixPayload.purchaseId}`, { cache: 'no-store' });
        const json = await parseJsonSafe(res);
        if (!res.ok || cancelled) return;
        const status = String(json?.status ?? '');
        setPurchaseStatus(status);
        if (status === 'PAID') {
          clearInterval(interval);
          await load();
        }
      } catch {}
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pixPayload?.purchaseId]);

  const isPremium = data?.user.plan === 'PREMIUM';
  const amount = Number(data?.plan.priceInCents ?? 15000) / 100;

  const handleCheckout = async () => {
    if (submitting) return;

    const digits = phone.replace(/\D/g, '');
    const areaCode = digits.length >= 10 ? digits.slice(0, 2) : '';
    const number = digits.length >= 10 ? digits.slice(2) : '';

    try {
      setSubmitting(true);
      const res = await fetch('/api/plans/exclusive/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          document,
          phoneArea: areaCode,
          phoneNumber: number,
          card:
            paymentMethod === 'CREDIT_CARD'
              ? {
                  number: cardNumber,
                  holderName: cardHolderName,
                  expMonth: cardExpMonth,
                  expYear: cardExpYear,
                  cvv: cardCvv,
                }
              : undefined,
        }),
      });
      const json = await parseJsonSafe(res);
      if (!res.ok) throw new Error(json?.details || json?.error || 'Nao foi possivel processar a compra.');

      setPurchaseStatus(String(json?.status ?? 'PENDING'));

      if (paymentMethod === 'PIX') {
        setPixPayload({
          purchaseId: String(json?.purchaseId),
          qrCode: json?.pixQrCode ?? null,
          qrCodeUrl: json?.pixQrCodeUrl ?? null,
          expiresAt: json?.expiresAt ?? null,
        });
        return;
      }

      alert('Pagamento aprovado. Seu plano Lumie Exclusive foi ativado.');
      window.location.assign('/dashboard/dominio');
    } catch (error: any) {
      alert(error?.message || 'Nao foi possivel concluir a compra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando plano
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="border-[#e4d2c5] bg-gradient-to-r from-[#fff8f2] to-white">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#3b2d28] text-white">
              <Crown className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-display text-[#2d221f]">Lumie Exclusive</h1>
              <p className="mt-1 text-sm text-gray-600">
                Domínio personalizado por 1 ano, taxa reduzida e suporte exclusivo com a nossa equipe.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Badge variant={isPremium ? 'default' : 'outline'}>{isPremium ? 'Premium ativo' : 'Plano gratuito'}</Badge>
            <p className="font-display text-4xl text-[#8e3d2c]">{formatBRL(amount)}</p>
          </div>
        </CardContent>
      </Card>

      {isPremium ? (
        <Card className="border-[#d8eadb] bg-[#fbfffc]">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-[#1f8e5b]" />
              <div>
                <p className="font-semibold text-[#22352a]">Seu Lumie Exclusive já está ativo.</p>
                <p className="mt-1 text-sm text-gray-600">
                  {data?.user.planExpiresAt
                    ? `Expira em ${new Date(data.user.planExpiresAt).toLocaleDateString('pt-BR')}.`
                    : 'Seu plano já está habilitado.'}
                </p>
              </div>
            </div>
            <Button asChild className="bg-[#1f8e5b] text-white hover:bg-[#18764b]">
              <Link href="/dashboard/dominio">Ir para domínio</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Finalizar compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                type="button"
                variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                className={paymentMethod === 'PIX' ? 'bg-[#8e3d2c] text-white hover:bg-[#7a3426]' : ''}
                onClick={() => setPaymentMethod('PIX')}
              >
                PIX
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                className={paymentMethod === 'CREDIT_CARD' ? 'bg-[#8e3d2c] text-white hover:bg-[#7a3426]' : ''}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                Cartão
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input value={data?.user.name ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input value={data?.user.email ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF</label>
                <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            {paymentMethod === 'CREDIT_CARD' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Número do cartão</label>
                  <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Nome do titular</label>
                  <Input value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mês</label>
                  <Input value={cardExpMonth} onChange={(e) => setCardExpMonth(e.target.value)} placeholder="12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Input value={cardExpYear} onChange={(e) => setCardExpYear(e.target.value)} placeholder="2028" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CVV</label>
                  <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" />
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full bg-[#8e3d2c] text-white hover:bg-[#7a3426]"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {paymentMethod === 'PIX' ? 'Gerar PIX do plano' : 'Pagar com cartão'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Valor do plano</span>
                <strong>{formatBRL(amount)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Duração</span>
                <strong>1 ano</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxa dos presentes</span>
                <strong>3,69%</strong>
              </div>
            </CardContent>
          </Card>

          {(data?.referrals.partner || data?.referrals.ambassador) && (
            <Card>
              <CardHeader>
                <CardTitle>Comissão da compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {data.referrals.partner ? (
                  <div className="flex items-center justify-between">
                    <span>Parceiro vinculado</span>
                    <strong>R$ 10,00</strong>
                  </div>
                ) : null}
                {data.referrals.ambassador ? (
                  <div className="flex items-center justify-between">
                    <span>Embaixador vinculado</span>
                    <strong>R$ 5,00</strong>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {pixPayload ? (
            <Card className="border-[#e6dac5] bg-[#fffaf3]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#8e3d2c]" />
                  PIX gerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pixPayload.qrCodeUrl ? (
                  <img src={pixPayload.qrCodeUrl} alt="QR Code PIX" className="h-44 w-44 rounded-lg border bg-white p-2" />
                ) : null}
                {pixPayload.qrCode ? (
                  <textarea
                    readOnly
                    value={pixPayload.qrCode}
                    className="min-h-[120px] w-full rounded-lg border border-[#e4d2c5] bg-white p-3 text-xs text-gray-700"
                  />
                ) : null}
                <p className="text-sm text-gray-600">
                  {purchaseStatus === 'PAID'
                    ? 'Pagamento confirmado. Seu plano foi ativado.'
                    : 'Estamos acompanhando o pagamento do PIX automaticamente.'}
                </p>
                {purchaseStatus === 'PAID' ? (
                  <Button asChild className="w-full bg-[#1f8e5b] text-white hover:bg-[#18764b]">
                    <Link href="/dashboard/dominio">Ir para domínio</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
