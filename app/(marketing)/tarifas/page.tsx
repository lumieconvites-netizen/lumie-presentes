import Link from 'next/link';
import { ArrowRight, CheckCircle2, HelpCircle, Shield, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const inclusions = [
    'Criação da lista sem custo de assinatura mensal',
    'Editor visual e templates personalizáveis',
    'Site exclusivo do evento com múltiplos recursos premium',
    'Checkout com PIX e cartão de crédito',
    'RSVP com sistema de check-in por QR Code',
    'Dashboard de pagamentos e acompanhamento',
    'Recados dos convidados e relatórios',
    'Infraestrutura, segurança e suporte contínuo',
  ];

  const faqs = [
    {
      q: 'Por que existe taxa na plataforma?',
      a: 'A taxa cobre custos operacionais da Lumie, processamento de pagamentos, antifraude, infraestrutura e suporte. Assim, você só paga quando realmente recebe.',
    },
    {
      q: 'Quais taxas são aplicadas?',
      a: 'A taxa padrão da plataforma é de 11,99%. Em pagamentos com cartão de crédito, o custo total da operação é de 15,99%.',
    },
    {
      q: 'Eu pago para criar a lista?',
      a: 'Não. Criar e configurar sua lista é gratuito. A cobrança acontece apenas quando houver pagamento aprovado.',
    },
    {
      q: 'O convidado compra o presente físico?',
      a: 'Não. O convidado escolhe um presente fictício da sua lista e paga o valor correspondente. Você recebe esse valor em dinheiro na sua conta e usa como preferir.',
    },
    {
      q: 'Posso escolher quem arca com a taxa?',
      a: 'Sim. Você pode repassar para o convidado ou assumir o custo, e ajustar essa configuração quando precisar.',
    },
  ];

  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-primary leading-tight">
            Tarifas transparentes, sem surpresa
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg md:text-xl text-[#5f4b42]">
            A Lumie foi pensada para ser justa: você cria grátis e só paga quando recebe.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white shadow-[0_16px_40px_rgba(84,56,42,0.08)] overflow-hidden">
            <div className="bg-gradient-to-r from-[#a5482d] to-[#c65a3a] px-7 py-7 text-white">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">Site Gratuito</h2>
              <p className="mt-2 text-white/90">Sem mensalidade. Sem custo fixo.</p>
            </div>

            <div className="grid md:grid-cols-[1.1fr,1fr] gap-0">
              <div className="p-7 md:p-9 border-b md:border-b-0 md:border-r border-[#efdfd3]">
                <p className="text-sm tracking-[0.18em] uppercase text-[#9c7866]">Taxa padrão da plataforma</p>
                <p className="mt-3 font-display text-6xl leading-none text-primary">11,99%</p>
                <p className="mt-3 text-[#635249]">Cobrança por pagamento aprovado.</p>

                <div className="mt-6 rounded-xl border border-[#ead7ca] bg-[#fff8f3] px-4 py-3">
                  <p className="text-sm text-[#7a6054]">
                    Cartão de crédito: <strong className="text-[#5a4238]">15,99%</strong> (custos da operação de crédito).
                  </p>
                </div>

                <div className="mt-7">
                  <Link
                    href="/cadastro"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#c65a3a] px-6 py-3 font-semibold text-white transition hover:brightness-105"
                  >
                    Criar Minha Lista
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>

              <div className="p-7 md:p-9">
                <p className="text-lg font-medium text-[#3f322d]">O que está incluído</p>
                <div className="mt-4 space-y-3">
                  {inclusions.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1fa05a] mt-0.5" />
                      <p className="text-[#56453d]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-[#f5ebe2] border-y border-[#ead6c8]">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-3xl md:text-5xl text-center text-primary">Como a cobrança funciona</h2>
          <p className="mt-4 text-center text-[#5f4b42] max-w-3xl mx-auto">
            As taxas são aplicadas para sustentar os custos operacionais da plataforma, manter os sistemas implementados,
            cobrir encargos bancários, garantir pagamentos seguros, prevenir fraudes e oferecer suporte especializado.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
              <h3 className="font-display text-2xl text-foreground">Repassar ao convidado</h3>
              <p className="mt-3 text-[#615047]">
                O convidado paga o valor do presente com a taxa aplicada, e você recebe o valor cheio do presente.
              </p>
              <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9c7866]">Exemplo sobre R$ 100,00</p>
                <div className="mt-2 space-y-1.5 text-[#5f4b42]">
                  <p>Convidado paga: <strong className="text-[#3f322d]">R$ 111,99</strong></p>
                  <p>Você recebe: <strong className="text-[#1f8e5b]">R$ 100,00</strong></p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e7d3c6] bg-white p-6">
              <h3 className="font-display text-2xl text-foreground">Assumir a taxa</h3>
              <p className="mt-3 text-[#615047]">
                O convidado paga apenas o valor do presente, e o custo da operação é descontado no repasse.
              </p>
              <div className="mt-5 rounded-xl border border-[#ead7ca] bg-[#fff8f3] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9c7866]">Exemplo sobre R$ 100,00</p>
                <div className="mt-2 space-y-1.5 text-[#5f4b42]">
                  <p>Convidado paga: <strong className="text-[#3f322d]">R$ 100,00</strong></p>
                  <p>Você recebe: <strong className="text-[#c65a3a]">R$ 88,01</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#e8d3c5] bg-white p-8 md:p-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7ee] text-[#1fa05a]">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-display text-3xl md:text-4xl text-primary">Perguntas frequentes</h2>

            <div className="mt-7 space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-[#eddccf] bg-[#fffaf6] px-5 py-4">
                  <h3 className="flex items-start gap-2 text-[#332924] font-medium">
                    <HelpCircle className="h-5 w-5 mt-0.5 text-[#c65a3a] shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="mt-2 pl-7 text-[#655249]">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-[#c65a3a] text-center">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl md:text-6xl text-white">Pronto para começar?</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Crie sua lista agora e pague apenas quando começar a receber.
          </p>
          <Link
            href="/cadastro"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-[#c65a3a] transition hover:bg-[#fff3ea]"
          >
            Criar Minha Lista Grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
