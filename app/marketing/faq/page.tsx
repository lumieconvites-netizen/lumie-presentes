'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Sparkles,
  HelpCircle,
  Mail
} from 'lucide-react';

const faqs = [
  {
    category: 'Sobre a LUMIÊ',
    questions: [
      {
        q: 'O que é a LUMIÊ?',
        a: 'A LUMIÊ é uma plataforma de lista de presentes online onde você cadastra os presentes que deseja e seus convidados podem "comprar" esses itens. Na prática, o valor pago se transforma em crédito que vai diretamente para sua conta bancária.'
      },
      {
        q: 'O convidado compra o presente físico?',
        a: 'Não. O convidado escolhe um presente da sua lista e paga o valor correspondente. Você recebe esse valor em dinheiro na sua conta. Dessa forma, você tem liberdade para usar o dinheiro como preferir.'
      },
      {
        q: 'Quais tipos de eventos posso criar listas?',
        a: 'Você pode criar listas para qualquer ocasião: casamentos, chás de casa nova, aniversários, batizados, formaturas, ou qualquer outro evento especial.'
      }
    ]
  },
  {
    category: 'Criando sua Lista',
    questions: [
      {
        q: 'Quanto custa criar uma lista?',
        a: 'Criar sua lista é totalmente gratuito! Você só paga uma taxa de 7,99% por transação quando um convidado presentear você. Não há mensalidades ou custos fixos.'
      },
      {
        q: 'Quantos presentes posso cadastrar?',
        a: 'Você pode cadastrar até 100 presentes por lista. Cada presente pode ter foto, título, descrição, valor e quantidade disponível.'
      },
      {
        q: 'Posso usar templates prontos?',
        a: 'Sim! Oferecemos diversos templates temáticos que você pode usar como ponto de partida. Todos são totalmente personalizáveis - você pode mudar cores, fontes, imagens e blocos.'
      },
      {
        q: 'Posso personalizar a página da minha lista?',
        a: 'Absolutamente! Nosso editor visual permite que você adicione, remova e reorganize blocos como: capa, galeria de fotos, mensagem personalizada, contagem regressiva, lista de presentes, mural de recados e muito mais.'
      }
    ]
  },
  {
    category: 'Pagamentos',
    questions: [
      {
        q: 'Qual é a taxa cobrada?',
        a: 'A taxa é de 7,99% por transação. Você pode escolher repassar essa taxa para o convidado (que pagará o valor do presente + taxa) ou assumir você mesmo (a taxa será descontada do seu repasse).'
      },
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos cartão de crédito (todas as bandeiras principais) e PIX. A integração é feita através da Pagar.me, uma das plataformas de pagamento mais seguras do Brasil.'
      },
      {
        q: 'Como recebo o dinheiro?',
        a: 'Os valores são repassados para sua conta bancária. O prazo depende do método: PIX geralmente é instantâneo, cartão de crédito segue o prazo padrão do mercado (D+30).'
      },
      {
        q: 'Os pagamentos são seguros?',
        a: 'Sim! Utilizamos a Pagar.me, que é certificada PCI-DSS, possui criptografia SSL e sistema antifraude. Não armazenamos dados sensíveis de cartão.'
      }
    ]
  },
  {
    category: 'Para os Convidados',
    questions: [
      {
        q: 'Como meus convidados acessam a lista?',
        a: 'Você compartilha o link da sua lista (por WhatsApp, e-mail, redes sociais, etc). Os convidados acessam, escolhem um presente, pagam e podem deixar uma mensagem carinhosa.'
      },
      {
        q: 'Os convidados precisam criar conta?',
        a: 'Não! Os convidados não precisam se cadastrar. Eles apenas informam nome, e-mail e dados de pagamento no momento da compra.'
      },
      {
        q: 'Os convidados podem deixar mensagens?',
        a: 'Sim! Ao presentear, os convidados podem deixar um recado especial e até uma assinatura personalizada. Você pode escolher se essas mensagens aparecem publicamente na sua página.'
      }
    ]
  },
  {
    category: 'Privacidade e Configurações',
    questions: [
      {
        q: 'Posso ocultar recados do site público?',
        a: 'Sim! Você pode configurar se os recados aparecem publicamente ou não. Também pode ocultar recados específicos individualmente.'
      },
      {
        q: 'Posso despublicar minha lista?',
        a: 'Sim, a qualquer momento você pode alterar o status da sua lista entre "publicada" e "rascunho". Enquanto em rascunho, os convidados não conseguem acessar.'
      },
      {
        q: 'Meus dados estão seguros?',
        a: 'Sim! Seguimos as melhores práticas de segurança e estamos em conformidade com a LGPD. Seus dados são criptografados e nunca compartilhados com terceiros.'
      }
    ]
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#FAF4EF] to-[#F1E3D6]">
        <div className="max-w-4xl mx-auto text-center">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="font-display text-4xl md:text-5xl text-[#2B2422] mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a LUMIÊ
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="font-display text-2xl text-primary mb-6">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${questionIndex}`];
                  
                  return (
                    <div
                      key={questionIndex}
                      className="border border-[#F1E3D6] rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-[#FAF4EF] transition-colors"
                      >
                        <span className="font-medium text-[#2B2422] pr-4">
                          {item.q}
                        </span>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p className="text-gray-600 leading-relaxed">
                            {item.a}
                          </p>
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

      {/* Contact */}
      <section className="py-20 px-4 bg-[#FAF4EF]">
        <div className="max-w-xl mx-auto text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl text-[#2B2422] mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-gray-600 mb-6">
            Entre em contato conosco e teremos prazer em ajudar
          </p>
          <Button
            variant="outline"
            className="border-primary text-primary"
            asChild
          >
            <a href="mailto:contato@lumie.com.br">
              <Mail className="w-4 h-4 mr-2" />
              contato@lumie.com.br
            </a>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            Pronto para criar sua lista?
          </h2>
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 text-base px-8 py-6"
            asChild
          >
            <Link href="/cadastro">
              Começar Agora
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
