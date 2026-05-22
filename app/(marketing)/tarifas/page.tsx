import Link from 'next/link';
import { ArrowRight, CheckCircle2, Gift, HelpCircle, Shield } from 'lucide-react';

const freeFeatures = [
  'Lista de presentes online',
  'Site gratuito da Lumie',
  'Checkout com PIX e cartão',
  'Dashboard de pagamentos',
  'Recados dos convidados',
  'RSVP e check-in por QR Code',
];

const faqs = [
  {
    q: 'Quanto custa criar uma lista?',
    a: 'Criar sua lista é gratuito. Você só paga a taxa de intermediação quando um convidado presentear você.',
  },
  {
    q: 'Qual é a taxa cobrada?',
    a: 'A taxa é de 7,99% no PIX e 13,99% no cartão de crédito, aplicada somente em pagamentos aprovados.',
  },
  {
    q: 'Posso escolher quem paga a taxa?',
    a: 'Sim. Você pode repassar a taxa para o convidado ou assumir esse custo no valor recebido.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos PIX e cartão de crédito. O checkout é processado pela Pagar.me.',
  },
];

function PlanFeature({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1f8e5b]" />
      <p className="text-sm text-[#554840]">{children}</p>
    </div>
  );
}

export default function TarifasPage() {
  return (
    <main className="bg-[#f8f2ed] text-[#2b2422]">
      <section className="border-b border-[#ead6c8] bg-[#fffaf6]">
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a5a42]">Tarifas Lumie</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-primary md:text-6xl">
              Tarifa simples para receber presentes
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[#5f4b42]">
              Crie sua lista sem custo fixo e pague apenas quando receber um presente aprovado.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#e8d3c5] bg-white p-6 shadow-[0_14px_34px_rgba(84,56,42,0.07)] md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0e8] text-[#b54b2f]">
                <Gift className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-[#ead6c8] px-3 py-1 text-xs font-medium text-[#6f584e]">
                Gratuito
              </span>
            </div>

            <h2 className="mt-5 font-display text-3xl text-[#2b2422]">Plano gratuito</h2>
            <p className="mt-2 text-[#66544b]">Para criar sua lista sem custo fixo e começar a receber presentes.</p>

            <div className="mt-7 flex items-end gap-2">
              <span className="font-display text-6xl leading-none text-primary">R$ 0</span>
              <span className="pb-2 text-sm text-[#7a665d]">para criar</span>
            </div>

            <div className="mt-6 rounded-xl border border-[#ecd9cc] bg-[#fff8f3] p-4">
              <p className="text-sm font-medium text-[#4a3a33]">Taxa sobre presentes recebidos</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-display text-4xl text-[#b54b2f]">7,99%</p>
                  <p className="mt-1 text-xs text-[#7a665d]">PIX aprovado</p>
                </div>
                <div>
                  <p className="font-display text-4xl text-[#b54b2f]">13,99%</p>
                  <p className="mt-1 text-xs text-[#7a665d]">Cartão aprovado</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {freeFeatures.map((item) => (
                <PlanFeature key={item}>{item}</PlanFeature>
              ))}
            </div>

            <Link
              href="/auth/cadastro"
              className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c65a3a] px-5 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Criar lista grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ead6c8] bg-[#fffaf6] py-14 md:py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-3xl text-primary md:text-4xl">Como a cobrança funciona</h2>
                <p className="mt-2 max-w-2xl text-[#5f4b42]">
                  Você escolhe se a taxa será repassada ao convidado ou descontada do valor recebido.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d2c5] bg-white px-4 py-2 text-sm text-[#5f4b42]">
                <Shield className="h-4 w-4 text-[#1f8e5b]" />
                Checkout seguro via Pagar.me
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
                <h3 className="font-display text-2xl text-foreground">Repassar ao convidado</h3>
                <p className="mt-3 text-[#615047]">
                  O convidado paga o valor do presente com a taxa aplicada, e você recebe o valor cheio do presente.
                </p>
                <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4 text-sm text-[#5f4b42]">
                  Exemplo no PIX: presente de R$ 100,00 vira R$ 107,99 para o convidado.
                </div>
              </div>

              <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
                <h3 className="font-display text-2xl text-foreground">Assumir a taxa</h3>
                <p className="mt-3 text-[#615047]">
                  O convidado paga apenas o valor do presente, e a taxa é descontada no repasse.
                </p>
                <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4 text-sm text-[#5f4b42]">
                  Exemplo no PIX: presente de R$ 100,00 gera repasse de R$ 92,01.
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
