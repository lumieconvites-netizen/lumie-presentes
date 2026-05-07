'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Crown, Gift, Globe2, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const freeFeatures = [
  'Lista de presentes online',
  'Site gratuito da Lumie',
  'Checkout com PIX e cartao',
  'Dashboard de pagamentos',
  'Recados dos convidados',
  'RSVP e check-in por QR Code',
];

const exclusiveFeatures = [
  'Tudo do plano gratuito',
  'Dominio personalizado por 1 ano',
  'Taxa reduzida nos presentes',
  'Suporte exclusivo com a nossa equipe',
];

const faqs = [
  {
    q: 'A Lumie Exclusive inclui o dominio?',
    a: 'Sim. O plano inclui um dominio personalizado por 1 ano, dentro das extensoes disponiveis na busca do dashboard.',
  },
  {
    q: 'O plano gratuito continua existindo?',
    a: 'Sim. Voce pode criar sua lista gratuitamente e pagar apenas a taxa sobre presentes recebidos.',
  },
  {
    q: 'O que muda nas taxas?',
    a: 'No plano gratuito, a taxa sobre presentes e de 7,99% no PIX e 13,99% no credito. No Lumie Exclusive, a taxa cai para 3,69% no PIX e 7,99% no credito.',
  },
  {
    q: 'Posso escolher quem paga a taxa?',
    a: 'Sim. Voce pode repassar a taxa para o convidado ou assumir o custo no valor recebido.',
  },
];

type PlanKey = 'FREE' | 'PREMIUM';

type CurrentPlan = 'FREE' | 'PREMIUM' | null;

const feeExamples: Record<
  PlanKey,
  {
    passToGuest: { title: string; text: string };
    absorb: { title: string; text: string };
  }
> = {
  FREE: {
    passToGuest: {
      title: 'Repassar ao convidado',
      text: 'Exemplo no Gratuito: presente de R$ 100,00 vira R$ 107,99 para o convidado no PIX.',
    },
    absorb: {
      title: 'Assumir a taxa',
      text: 'Exemplo no Gratuito: presente de R$ 100,00 gera repasse de R$ 93,01.',
    },
  },
  PREMIUM: {
    passToGuest: {
      title: 'Repassar ao convidado',
      text: 'Exemplo no Exclusive: presente de R$ 100,00 vira R$ 103,69 para o convidado.',
    },
    absorb: {
      title: 'Assumir a taxa',
      text: 'Exemplo no Exclusive: presente de R$ 100,00 gera repasse de R$ 96,31.',
    },
  },
};

function PlanFeature({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className={cn('mt-0.5 h-5 w-5 shrink-0', dark ? 'text-[#9df0bb]' : 'text-[#1f8e5b]')} />
      <p className={cn('text-sm', dark ? 'text-[#f4e8e1]' : 'text-[#554840]')}>{children}</p>
    </div>
  );
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('FREE');
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(null);
  const { status } = useSession();
  const selectedExample = feeExamples[selectedPlan];
  const exclusiveHref =
    status === 'authenticated' ? '/dashboard/premium' : '/auth/cadastro?callbackUrl=/dashboard/premium';

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentPlan() {
      if (status !== 'authenticated') {
        setCurrentPlan(null);
        return;
      }

      try {
        const res = await fetch('/api/plans/exclusive', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        setCurrentPlan(json?.user?.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE');
      } catch {
        if (!cancelled) setCurrentPlan(null);
      }
    }

    loadCurrentPlan();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <main className="bg-[#f8f2ed] text-[#2b2422]">
      <section className="border-b border-[#ead6c8] bg-[#fffaf6]">
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a5a42]">Planos Lumie</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-primary md:text-6xl">
              Escolha como sua lista vai receber presentes
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[#5f4b42]">
              Comece gratis ou ative o Lumie Exclusive para usar dominio personalizado e taxas menores nos presentes.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e8d3c5] bg-white p-6 shadow-[0_14px_34px_rgba(84,56,42,0.07)] md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0e8] text-[#b54b2f]">
                  <Gift className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-[#ead6c8] px-3 py-1 text-xs font-medium text-[#6f584e]">
                  Gratuito
                </span>
              </div>

              <h2 className="mt-5 font-display text-3xl text-[#2b2422]">Plano Gratuito</h2>
              <p className="mt-2 text-[#66544b]">Para criar sua lista sem custo fixo e comecar a receber presentes.</p>

              <div className="mt-7 flex items-end gap-2">
                <span className="font-display text-6xl leading-none text-primary">R$ 0</span>
                <span className="pb-2 text-sm text-[#7a665d]">para criar</span>
              </div>

              <div className="mt-6 rounded-xl border border-[#ecd9cc] bg-[#fff8f3] p-4">
                <p className="text-sm font-medium text-[#4a3a33]">Taxa sobre presentes recebidos</p>
                <p className="mt-2 font-display text-4xl text-[#b54b2f]">7,99%</p>
                <p className="mt-1 text-xs text-[#7a665d]">Aplicada em pagamentos aprovados.</p>
              </div>

              <div className="mt-6 space-y-3">
                {freeFeatures.map((item) => (
                  <PlanFeature key={item}>{item}</PlanFeature>
                ))}
              </div>

              {currentPlan === 'FREE' ? (
                <span className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-[#ecd9cc] bg-[#f9f3ee] px-5 text-sm font-semibold text-[#86695c]">
                  Plano atual
                </span>
              ) : (
                <Link
                  href="/auth/cadastro"
                  className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c65a3a] px-5 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  Criar lista gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[#d5b09e] bg-[#302622] p-6 text-white shadow-[0_18px_44px_rgba(50,35,29,0.18)] md:p-8">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[5rem] bg-[#c65a3a]/25" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/12 text-[#ffd9c8]">
                    <Crown className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    Mais completo
                  </span>
                </div>

                <h2 className="mt-5 font-display text-3xl">Lumie Exclusive</h2>
                <p className="mt-2 text-[#eadbd3]">Para quem quer uma experiencia premium com endereco proprio.</p>

                <div className="mt-7 flex items-end gap-2">
                  <span className="font-display text-6xl leading-none">R$ 150</span>
                  <span className="pb-2 text-sm text-[#d8c5bb]">por 1 ano</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/15 bg-white/8 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-[#ffd9c8]" />
                      Taxa reduzida
                    </div>
                    <p className="mt-2 font-display text-4xl">3,69%</p>
                    <p className="mt-1 text-xs text-[#d8c5bb]">Sobre presentes recebidos.</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/8 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe2 className="h-4 w-4 text-[#ffd9c8]" />
                      Dominio incluso
                    </div>
                    <p className="mt-2 font-display text-4xl">1 ano</p>
                    <p className="mt-1 text-xs text-[#d8c5bb]">Escolhido pelo dashboard.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {exclusiveFeatures.map((item) => (
                    <PlanFeature key={item} dark>
                      {item}
                    </PlanFeature>
                  ))}
                </div>

                <Link
                  href={exclusiveHref}
                  className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#2f2622] transition hover:bg-[#fff1e8]"
                >
                  Adquirir Lumie Exclusive
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ead6c8] bg-[#fffaf6] py-14 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-3xl text-primary md:text-4xl">Como a cobranca funciona</h2>
                <p className="mt-2 max-w-2xl text-[#5f4b42]">
                  Voce escolhe se a taxa sera repassada ao convidado ou descontada do valor recebido.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d2c5] bg-white px-4 py-2 text-sm text-[#5f4b42]">
                <Shield className="h-4 w-4 text-[#1f8e5b]" />
                Checkout seguro via Pagar.me
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan('FREE')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  selectedPlan === 'FREE'
                    ? 'border-[#c65a3a] bg-[#c65a3a] text-white'
                    : 'border-[#e5d2c5] bg-white text-[#6a544a] hover:bg-[#fff3ea]'
                )}
              >
                Ver taxas do Gratuito
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('PREMIUM')}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  selectedPlan === 'PREMIUM'
                    ? 'border-[#3a2d28] bg-[#3a2d28] text-white'
                    : 'border-[#e5d2c5] bg-white text-[#6a544a] hover:bg-[#fff3ea]'
                )}
              >
                Ver taxas do Exclusive
              </button>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
                <h3 className="font-display text-2xl text-foreground">{selectedExample.passToGuest.title}</h3>
                <p className="mt-3 text-[#615047]">
                  O convidado paga o valor do presente com a taxa aplicada, e voce recebe o valor cheio do presente.
                </p>
                <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4 text-sm text-[#5f4b42]">
                  {selectedExample.passToGuest.text}
                </div>
              </div>

              <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
                <h3 className="font-display text-2xl text-foreground">{selectedExample.absorb.title}</h3>
                <p className="mt-3 text-[#615047]">
                  O convidado paga apenas o valor do presente, e a taxa e descontada no repasse.
                </p>
                <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4 text-sm text-[#5f4b42]">
                  {selectedExample.absorb.text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-3xl text-primary md:text-4xl">Perguntas frequentes</h2>
            <div className="mt-6 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-[#eddccf] bg-white px-5 py-4">
                  <h3 className="flex items-start gap-2 font-medium text-[#332924]">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#c65a3a]" />
                    {faq.q}
                  </h3>
                  <p className="mt-2 pl-7 text-[#655249]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
