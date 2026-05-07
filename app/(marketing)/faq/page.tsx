'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Sparkles, HelpCircle, Mail } from 'lucide-react';

const faqs = [
  {
    category: 'Sobre a Lumie',
    questions: [
      {
        q: 'O que é a Lumie?',
        a: 'A Lumie é uma plataforma de lista de presentes online em que você monta uma vitrine simbólica e recebe os valores em dinheiro. Assim, você evita presentes repetidos e usa os recursos com liberdade no que realmente faz sentido para o seu evento.',
      },
      {
        q: 'O convidado compra o presente físico?',
        a: 'Não. O convidado escolhe um presente fictício da sua lista e paga o valor correspondente. Você recebe esse valor em dinheiro na sua conta. Dessa forma, você tem liberdade para usar o dinheiro como preferir.',
      },
      {
        q: 'Quais tipos de eventos posso criar listas?',
        a: 'Você pode criar listas para casamentos, aniversários, chás, formaturas, noivados, bodas e outros momentos especiais. A estrutura da página é personalizável para se adaptar ao estilo de cada celebração.',
      },
    ],
  },
  {
    category: 'Criando sua Lista',
    questions: [
      {
        q: 'Quanto custa criar uma lista?',
        a: 'Criar sua lista é totalmente gratuito. Você só paga a taxa do plano escolhido quando um convidado presentear você. No plano gratuito, a taxa é de 7,99% no PIX e 13,99% no crédito.',
      },
      {
        q: 'Quantos presentes posso cadastrar?',
        a: 'Você pode cadastrar presentes ilimitados. Cada presente pode ter foto, título, descrição, valor e quantidade disponível.',
      },
      {
        q: 'Posso usar templates prontos?',
        a: 'Sim. Você pode começar com templates prontos e depois personalizar cores, tipografia, imagens e blocos para deixar o site com a identidade do seu evento.',
      },
      {
        q: 'Posso personalizar a página da minha lista?',
        a: 'Absolutamente! Nosso editor visual permite que você adicione, remova e reorganize blocos como: capa, galeria de fotos, mensagem personalizada, contagem regressiva, mural de recados e muito mais.',
      },
    ],
  },
  {
    category: 'Pagamentos',
    questions: [
      {
        q: 'Qual é a taxa cobrada?',
        a: 'No plano gratuito, a taxa é de 7,99% no PIX e 13,99% no crédito. No Lumie Exclusive, a taxa é de 3,69% no PIX e 7,99% no crédito. Você pode escolher repassar essa taxa para o convidado ou assumir você mesmo.',
      },
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos PIX e cartão de crédito. O checkout é processado pela Pagar.me, com validações de segurança e estabilidade para garantir boa taxa de aprovação.',
      },
      {
        q: 'Como recebo o dinheiro?',
        a: 'Os valores são guardados na sua conta mesmo, você acompanha em tempo real e saca quando quiser. Ao solicitar o saque, é cobrado um valor de R$ 3,67 por Saque, então indicamos solicitar o saque somente quando o seu evento tiver terminado. Ao solicitar o Saque antes das 15 horas ele cai no mesmo dia, após as 15 horas, ele vai cair no próximo dia útil. O cartão de crédito segue o prazo padrão do mercado (D+30) então você só pode solicitar saques de cartão quando ele passa desse prazo.',
      },
      {
        q: 'Os pagamentos são seguros?',
        a: 'Sim. A plataforma opera com camadas de segurança, antifraude e monitoramento contínuo. Além disso, os dados sensíveis de pagamento são tratados por infraestrutura especializada de mercado.',
      },
    ],
  },
  {
    category: 'Para os Convidados',
    questions: [
      {
        q: 'Como meus convidados acessam a lista?',
        a: 'Você compartilha o link da lista por WhatsApp, redes sociais ou e-mail. O convidado abre no navegador, escolhe o presente, faz o pagamento e finaliza em poucos passos.',
      },
      {
        q: 'Os convidados precisam criar conta?',
        a: 'Não. Os convidados não precisam criar conta para presentear. Isso reduz fricção e facilita a conclusão do pagamento.',
      },
      {
        q: 'Os convidados podem deixar mensagens?',
        a: 'Sim! Ao presentear, os convidados podem deixar um recado especial. Você pode escolher se essas mensagens aparecem publicamente na sua página.',
      },
    ],
  },
  {
    category: 'Privacidade e Configurações',
    questions: [
      {
        q: 'Posso ocultar recados do site público?',
        a: 'Sim. Você pode ocultar recados individualmente ou manter o mural privado, controlando o que aparece na versão pública da sua página.',
      },
      {
        q: 'Posso despublicar minha lista?',
        a: 'Sim. Quando quiser, você pode alterar o status da lista para rascunho e interromper o acesso público imediatamente.',
      },
      {
        q: 'Meus dados estão seguros?',
        a: 'Sim. Seguimos boas práticas de segurança da informação e conformidade com LGPD para proteger dados de titulares e convidados.',
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="bg-[#f7f2ed] text-[#2b2422]">
      <section className="py-20 px-4 border-y border-[#ead6c8] bg-gradient-to-b from-[#f7f2ed] to-[#f2e6dc]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffe7da] text-[#c65a3a] shadow-sm">
            <HelpCircle className="w-9 h-9" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-[#2B2422] mb-5">Perguntas Frequentes</h1>
          <p className="text-lg md:text-xl text-[#5f4b42] max-w-2xl mx-auto">
            Respostas claras sobre criação da lista, pagamentos, segurança e gestão do seu evento.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#f7f2ed]">
        <div className="max-w-4xl mx-auto space-y-10">
          {faqs.map((category, categoryIndex) => (
            <div key={category.category} className="rounded-3xl border border-[#ead6c8] bg-white/80 backdrop-blur-sm p-6 md:p-8 shadow-[0_10px_28px_rgba(88,55,40,0.06)]">
              <h2 className="font-display text-2xl md:text-3xl text-primary mb-5">{category.category}</h2>
              <div className="space-y-3">
                {category.questions.map((item, questionIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${questionIndex}`];
                  return (
                    <div key={item.q} className="border border-[#eddccf] rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-[#fff8f3] transition-colors"
                      >
                        <span className="font-medium text-[#2B2422] pr-4">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#7b6559] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p className="text-[#5e4d44] leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 bg-[#f5ebe2] border-y border-[#ead6c8]">
        <div className="max-w-xl mx-auto text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffe7da] text-[#c65a3a]">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="font-display text-3xl text-[#2B2422] mb-3">Ainda tem dúvidas?</h2>
          <p className="text-[#5f4b42] mb-6">Fale com nosso time e receba suporte especializado.</p>
          <a
            href="mailto:contato@lumie.com.br"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8b8a4] bg-white px-5 py-3 font-medium text-[#b25235] transition hover:bg-[#fff8f3]"
          >
            <Mail className="w-4 h-4" />
            contato@lumie.com.br
          </a>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#c65a3a] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl text-white mb-6">Pronto para criar sua lista?</h2>
          <Link
            href="/auth/cadastro"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#c65a3a] shadow-[0_10px_24px_rgba(74,39,25,0.24)] transition hover:bg-[#fff3ea]"
          >
            Começar Agora
            <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

