import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export default function Pricing() {
  const features = [
    'Criar lista de presentes',
    'Até 100 presentes por lista',
    'Editor visual de página',
    'Templates personalizáveis',
    'Recados dos convidados',
    'Pagamento com cartão e PIX',
    'Dashboard de acompanhamento',
    'Exportar relatórios',
    'Suporte por e-mail'
  ];

  const faqs = [
    {
      q: 'O que é a taxa de 7,99%?',
      a: 'É a nossa taxa de serviço que cobre os custos de processamento de pagamentos, manutenção da plataforma e suporte. Você pode escolher repassar essa taxa para o convidado ou assumir você mesmo.'
    },
    {
      q: 'Como recebo o dinheiro?',
      a: 'Os valores são repassados para sua conta bancária através da Pagar.me. O prazo de recebimento depende do método de pagamento: PIX é instantâneo, cartão de crédito segue o prazo padrão de D+30.'
    },
    {
      q: 'Preciso pagar para criar a lista?',
      a: 'Não! Criar a lista é totalmente gratuito. Você só paga a taxa quando receber um pagamento, ou seja, só paga quando começar a receber.'
    },
    {
      q: 'Posso alterar quem paga a taxa depois?',
      a: 'Sim! Você pode alterar a configuração a qualquer momento nas configurações da sua lista. A mudança vale para os próximos pagamentos.'
    }
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#FAF4EF] to-[#F1E3D6]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl text-[#2B2422] mb-6">
            Tarifas simples e transparentes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Criar sua lista é grátis. Você só paga quando receber.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-white text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-2" />
              <h2 className="font-display text-2xl">LUMIÊ</h2>
            </div>
            
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-display font-bold text-primary">7,99%</span>
                </div>
                <p className="text-gray-600 mt-2">
                  por transação
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-[#2B2422]">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white py-6"
                asChild
              >
                <Link href="/cadastro">
                  Criar Minha Lista Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Sem custos para criar. Sem mensalidade.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fee Options */}
      <section className="py-20 px-4 bg-[#FAF4EF]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl text-[#2B2422] text-center mb-12">
            Você escolhe quem paga a taxa
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-[#F1E3D6]">
              <CardHeader>
                <CardTitle className="font-display text-xl text-[#2B2422]">
                  Repassar ao Convidado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  O convidado paga o valor do presente + 7,99% de taxa. 
                  Você recebe o valor integral do presente.
                </p>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-800 font-medium">Exemplo: Presente de R$ 100,00</p>
                  <p className="text-green-700 mt-2">
                    Convidado paga: <strong>R$ 107,99</strong>
                  </p>
                  <p className="text-green-700">
                    Você recebe: <strong>R$ 100,00</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#F1E3D6]">
              <CardHeader>
                <CardTitle className="font-display text-xl text-[#2B2422]">
                  Você Assume a Taxa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  O convidado paga apenas o valor do presente. 
                  A taxa de 7,99% é descontada do seu repasse.
                </p>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-800 font-medium">Exemplo: Presente de R$ 100,00</p>
                  <p className="text-yellow-700 mt-2">
                    Convidado paga: <strong>R$ 100,00</strong>
                  </p>
                  <p className="text-yellow-700">
                    Você recebe: <strong>R$ 92,01</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-[#2B2422] text-center mb-12">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#FAF4EF]"
              >
                <h3 className="font-medium text-[#2B2422] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 mt-3 ml-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            Comece agora mesmo
          </h2>
          <p className="text-white/80 mb-8">
            Crie sua lista em minutos. É grátis!
          </p>
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 text-base px-8 py-6"
            asChild
          >
            <Link href="/cadastro">
              Criar Minha Lista
              <Sparkles className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
