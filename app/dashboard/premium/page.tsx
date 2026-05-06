'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  Gift,
  Globe2,
  Heart,
  Loader2,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('pt-BR');
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
  const [copyFeedback, setCopyFeedback] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/plans/exclusive', { cache: 'no-store' });
      const json = await parseJsonSafe(res);
      if (!res.ok) throw new Error(json?.error || 'Não foi possível carregar o plano.');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível carregar o plano.');
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
      if (!res.ok) throw new Error(json?.details || json?.error || 'Não foi possível processar a compra.');

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
      alert(error?.message || 'Não foi possível concluir a compra.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixPayload?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixPayload.qrCode);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 1800);
    } catch {
      alert('Não foi possível copiar o código PIX.');
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
      <Card className="overflow-hidden border-[#e6d3c8] bg-[radial-gradient(circle_at_top_left,_rgba(255,241,232,0.95),_rgba(255,255,255,1)_58%)] shadow-[0_18px_48px_rgba(77,51,39,0.10)]">
        <CardContent className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ecd7ca] bg-white/90 px-4 py-2 text-sm text-[#6e594f]">
              <Crown className="h-4 w-4 text-[#8e3d2c]" />
              Lumie Exclusive
            </div>

            <div>
              <h1 className="font-display text-3xl leading-tight text-[#2d221f] md:text-5xl">
                Seu plano premium com domínio próprio, taxa menor e suporte exclusivo.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#67544a]">
                Ative agora e deixe sua lista pronta para receber presentes com uma experiência mais elegante, mais
                profissional e com domínio escolhido direto pelo dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#ecd8cc] bg-white/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8e6b5d]">Valor</p>
                <p className="mt-2 font-display text-4xl text-[#9a3f2a]">{formatBRL(amount)}</p>
                <p className="mt-1 text-sm text-[#705b51]">por 1 ano</p>
              </div>
              <div className="rounded-2xl border border-[#ecd8cc] bg-white/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8e6b5d]">Taxa</p>
                <p className="mt-2 font-display text-4xl text-[#2d221f]">3,69%</p>
                <p className="mt-1 text-sm text-[#705b51]">nos presentes</p>
              </div>
              <div className="rounded-2xl border border-[#ecd8cc] bg-white/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8e6b5d]">Ativação</p>
                <p className="mt-2 font-display text-4xl text-[#2d221f]">Imediata</p>
                <p className="mt-1 text-sm text-[#705b51]">após pagamento</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Domínio personalizado por 1 ano',
                'Tudo do plano gratuito, com taxa reduzida',
                'Suporte exclusivo com a nossa equipe',
                'Checkout por PIX e cartão com confirmação automática',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#ead7ca] bg-white/85 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8e5b]" />
                  <p className="text-sm leading-6 text-[#564841]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-[#dfc6b7] bg-[#f7ede4] shadow-[0_20px_44px_rgba(49,34,28,0.12)]">
              <div className="border-b border-[#ead7ca] bg-[#f9f3ee] px-5 py-3">
                <p className="text-sm font-medium text-[#6e594f]">Mock da página que os convidados veem</p>
              </div>

              <div className="flex justify-center p-5">
                <div className="w-full max-w-[360px] rounded-[32px] bg-[#2a211d] p-3 shadow-[0_24px_40px_rgba(32,22,18,0.28)]">
                  <div className="overflow-hidden rounded-[26px] bg-[#faeee3]">
                    <div className="flex items-center gap-2 bg-[#2f362d] px-4 py-3 text-white">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/55" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
                      </div>
                      <div className="flex-1 rounded-full bg-black/20 px-4 py-1.5 text-center text-xs">
                        seudominio.com/site/isabella-beatriz-15
                      </div>
                    </div>

                    <div className="bg-[#7d1408] px-4 py-3 text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl">I&R</span>
                        <span className="text-lg">≡</span>
                      </div>
                    </div>

                    <div
                      className="relative h-[260px] bg-cover bg-center"
                      style={{ backgroundImage: "linear-gradient(to bottom, rgba(27,18,14,0.15), rgba(27,18,14,0.58)), url('/hero-image.jpg')" }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                        <span className="text-sm tracking-wide">15 anos</span>
                        <h3 className="mt-2 font-display text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">Isabella</h3>
                      </div>
                    </div>

                    <div className="space-y-5 bg-[#faeee3] p-4">
                      <div className="text-center">
                        <p className="font-display text-3xl text-[#d29d2f]">Falta Pouco!</p>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          ['188', 'DIAS'],
                          ['15', 'HORAS'],
                          ['33', 'MINUTOS'],
                          ['17', 'SEGUNDOS'],
                        ].map(([value, label]) => (
                          <div key={label} className="rounded-2xl bg-white px-2 py-4 text-center shadow-[0_8px_16px_rgba(82,56,41,0.08)]">
                            <div className="text-2xl font-bold text-[#161616]">{value}</div>
                            <div className="mt-1 text-[10px] tracking-[0.18em] text-[#b28658]">{label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="h-px bg-[#ead5c3]" />

                      <div className="overflow-hidden rounded-[22px] bg-[#1f1d1d] text-white shadow-[0_16px_24px_rgba(31,29,29,0.18)]">
                        <div
                          className="h-[210px] bg-cover bg-center p-4"
                          style={{ backgroundImage: "linear-gradient(to bottom, rgba(16,16,16,0.16), rgba(16,16,16,0.8)), url('/hero-image.jpg')" }}
                        >
                          <div className="flex h-full flex-col justify-end">
                            <p className="font-display text-3xl">Lista de Presentes</p>
                            <p className="mt-2 max-w-[250px] text-sm text-white/90">
                              Esta é nossa lista de presentes. Ficamos felizes em compartilhar esse momento com você.
                            </p>
                            <div className="mt-4 inline-flex w-fit items-center rounded-xl bg-[#b66439] px-5 py-2.5 text-sm font-medium text-white">
                              Presentear
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 pb-2 pt-4 text-center">
                        <p className="font-display text-4xl text-[#d29d2f]">A trajetória</p>
                        <p className="mt-5 text-[15px] leading-8 text-[#8a5d32]">
                          Sou feita de sentimentos intensos, de risadas sinceras e de uma fé enorme no futuro.
                        </p>
                        <p className="mt-5 text-[15px] leading-8 text-[#8a5d32]">
                          Ao longo desses anos, fui descobrindo quem eu sou e construindo memórias com quem eu amo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dfc6b7] bg-[#2f2622] p-6 text-white shadow-[0_20px_44px_rgba(49,34,28,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#d7c5bb]">Status do seu plano</p>
                  <p className="mt-2 text-2xl font-semibold">{isPremium ? 'Premium ativo' : 'Plano gratuito'}</p>
                </div>
                <Badge variant={isPremium ? 'default' : 'outline'} className="border-white/20 bg-white/10 text-white">
                  {isPremium ? 'Ativo' : 'Disponível'}
                </Badge>
              </div>

              <div className="mt-6 space-y-3 text-sm text-[#ebddd6]">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Preço do plano</span>
                  <strong>{formatBRL(amount)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Duração</span>
                  <strong>1 ano</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Domínio</span>
                  <strong>Escolhido depois da ativação</strong>
                </div>
              </div>
            </div>

            <Card className="border-[#e6d3c8] bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#2d221f]">O que acontece depois da compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[#625046]">
                <div className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff2ea] text-xs font-semibold text-[#b45133]">
                    1
                  </span>
                  <p>Seu plano é ativado automaticamente assim que o pagamento for confirmado.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff2ea] text-xs font-semibold text-[#b45133]">
                    2
                  </span>
                  <p>Depois disso, você escolhe o domínio pela área de domínio no dashboard.</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fff2ea] text-xs font-semibold text-[#b45133]">
                    3
                  </span>
                  <p>A Lumie registra o endereço escolhido dentro das opções disponíveis para o plano.</p>
                </div>
              </CardContent>
            </Card>
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-[#e7d5c9] shadow-[0_10px_28px_rgba(84,56,42,0.06)]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl text-[#2d221f]">Finalizar compra</CardTitle>
                <p className="mt-1 text-sm text-[#67544a]">
                  Preencha seus dados e escolha a forma de pagamento para ativar o Lumie Exclusive.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e6d4c9] bg-[#fff9f5] px-4 py-2 text-sm text-[#67544a]">
                <ShieldCheck className="h-4 w-4 text-[#1f8e5b]" />
                Checkout seguro
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${
                  paymentMethod === 'PIX'
                    ? 'border-[#b85537] bg-[#fff1e8] shadow-[0_8px_22px_rgba(182,85,55,0.10)]'
                    : 'border-[#ead8cc] bg-white hover:bg-[#fffaf6]'
                }`}
                onClick={() => setPaymentMethod('PIX')}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffefe5] text-[#b85537]">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#2d221f]">PIX</p>
                    <p className="text-sm text-[#6a554a]">Aprovação rápida e acompanhamento automático.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-[#b85537] bg-[#fff1e8] shadow-[0_8px_22px_rgba(182,85,55,0.10)]'
                    : 'border-[#ead8cc] bg-white hover:bg-[#fffaf6]'
                }`}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffefe5] text-[#b85537]">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#2d221f]">Cartão</p>
                    <p className="text-sm text-[#6a554a]">Ativação imediata quando o pagamento for aprovado.</p>
                  </div>
                </div>
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#43342e]">Nome</label>
                <Input value={data?.user.name ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#43342e]">E-mail</label>
                <Input value={data?.user.email ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#43342e]">CPF</label>
                <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#43342e]">Telefone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>

            {paymentMethod === 'CREDIT_CARD' ? (
              <div className="rounded-2xl border border-[#ecd8cc] bg-[#fffaf6] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#564841]">
                  <CreditCard className="h-4 w-4 text-[#b85537]" />
                  Dados do cartão
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-[#43342e]">Número do cartão</label>
                    <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-[#43342e]">Nome do titular</label>
                    <Input value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#43342e]">Mês</label>
                    <Input value={cardExpMonth} onChange={(e) => setCardExpMonth(e.target.value)} placeholder="12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#43342e]">Ano</label>
                    <Input value={cardExpYear} onChange={(e) => setCardExpYear(e.target.value)} placeholder="2028" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#43342e]">CVV</label>
                    <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#dcecdf] bg-[#f8fffa] p-4 text-sm text-[#476152]">
                Ao gerar o PIX, você recebe o QR Code e o código copia e cola aqui mesmo na tela. A página acompanha a
                confirmação automaticamente.
              </div>
            )}

            <Button
              type="button"
              onClick={handleCheckout}
              disabled={submitting}
              className="h-12 w-full bg-[#8e3d2c] text-white hover:bg-[#7a3426]"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {paymentMethod === 'PIX' ? 'Gerar PIX do plano' : 'Pagar com cartão'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[#e7d5c9]">
            <CardHeader>
              <CardTitle className="text-xl text-[#2d221f]">Resumo do plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#b85537]" />
                  Valor do plano
                </span>
                <strong>{formatBRL(amount)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#b85537]" />
                  Duração
                </span>
                <strong>1 ano</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#b85537]" />
                  Taxa dos presentes
                </span>
                <strong>3,69%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-[#b85537]" />
                  Domínio
                </span>
                <strong>1 ano incluso</strong>
              </div>
            </CardContent>
          </Card>

          {(data?.referrals.partner || data?.referrals.ambassador) && (
            <Card className="border-[#e7d5c9]">
              <CardHeader>
                <CardTitle className="text-xl text-[#2d221f]">Comissão da compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {data.referrals.partner ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#efdfd5] bg-[#fffaf6] px-4 py-3">
                    <span>Parceiro vinculado</span>
                    <strong>R$ 10,00</strong>
                  </div>
                ) : null}
                {data.referrals.ambassador ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#efdfd5] bg-[#fffaf6] px-4 py-3">
                    <span>Embaixador vinculado</span>
                    <strong>R$ 5,00</strong>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {data?.latestPurchase ? (
            <Card className="border-[#e7d5c9]">
              <CardHeader>
                <CardTitle className="text-xl text-[#2d221f]">Última tentativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[#625046]">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <strong>{data.latestPurchase.status}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Método</span>
                  <strong>{data.latestPurchase.paymentMethod ?? '-'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Criado em</span>
                  <strong>{formatDate(data.latestPurchase.createdAt) ?? '-'}</strong>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {pixPayload ? (
            <Card className="border-[#e6dac5] bg-[#fffaf3]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2d221f]">
                  <QrCode className="h-5 w-5 text-[#8e3d2c]" />
                  PIX gerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[160px,1fr]">
                  {pixPayload.qrCodeUrl ? (
                    <img src={pixPayload.qrCodeUrl} alt="QR Code PIX" className="h-40 w-40 rounded-2xl border bg-white p-2" />
                  ) : null}
                  <div className="space-y-3">
                    {pixPayload.qrCode ? (
                      <>
                        <textarea
                          readOnly
                          value={pixPayload.qrCode}
                          className="min-h-[128px] w-full rounded-xl border border-[#e4d2c5] bg-white p-3 text-xs text-gray-700"
                        />
                        <Button type="button" variant="outline" className="w-full" onClick={handleCopyPix}>
                          <Copy className="mr-2 h-4 w-4" />
                          {copyFeedback ? 'Código copiado' : 'Copiar código PIX'}
                        </Button>
                      </>
                    ) : null}
                    {pixPayload.expiresAt ? (
                      <p className="text-xs text-[#78655b]">Válido até {formatDate(pixPayload.expiresAt)}.</p>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    purchaseStatus === 'PAID'
                      ? 'border-[#cfe7d6] bg-[#f6fff8] text-[#2e5e42]'
                      : 'border-[#ead7ca] bg-white text-[#6b574d]'
                  }`}
                >
                  {purchaseStatus === 'PAID'
                    ? 'Pagamento confirmado. Seu plano foi ativado.'
                    : 'Estamos acompanhando o pagamento do PIX automaticamente.'}
                </div>

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
