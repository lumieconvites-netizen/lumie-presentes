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
    'AtÃ© 100 presentes por lista',
    'Editor visual de pÃ¡gina',
    'Templates personalizÃ¡veis',
    'Recados dos convidados',
    'Pagamento com cartÃ£o e PIX',
    'Dashboard de acompanhamento',
    'Exportar relatÃ³rios',
    'Suporte por e-mail'
  ];

  const faqs = [
    {
      q: 'O que Ã© a taxa de 11,99%?',
      a: 'Ã‰ a nossa taxa de serviÃ§o que cobre os custos de processamento de pagamentos, manutenÃ§Ã£o da plataforma e suporte. VocÃª pode escolher repassar essa taxa para o convidado ou assumir vocÃª mesmo.'
    },
    {
      q: 'Como recebo o dinheiro?',
      a: 'Os valores sÃ£o repassados para sua conta bancÃ¡ria atravÃ©s da Pagar.me. O prazo de recebimento depende do mÃ©todo de pagamento: PIX Ã© instantÃ¢neo, cartÃ£o de crÃ©dito segue o prazo padrÃ£o de D+30.'
    },
    {
      q: 'Preciso pagar para criar a lista?',
      a: 'NÃ£o! Criar a lista Ã© totalmente gratuito. VocÃª sÃ³ paga a taxa quando receber um pagamento, ou seja, sÃ³ paga quando comeÃ§ar a receber.'
    },
    {
      q: 'Posso alterar quem paga a taxa depois?',
      a: 'Sim! VocÃª pode alterar a configuraÃ§Ã£o a qualquer momento nas configuraÃ§Ãµes da sua lista. A mudanÃ§a vale para os prÃ³ximos pagamentos.'
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
            Criar sua lista Ã© grÃ¡tis. VocÃª sÃ³ paga quando receber.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-white text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-2" />
              <h2 className="font-display text-2xl">LUMIÃŠ</h2>
            </div>
            
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-display font-bold text-primary">11,99%</span>
                </div>
                <p className="text-gray-600 mt-2">
                  por transaÃ§Ã£o
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
                className="w-full bg-gradient-to-r from-terracota-500 to-terracota-700 text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm py-6"
                asChild
              >
                <Link href="/cadastro">
                  Criar Minha Lista GrÃ¡tis
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
            VocÃª escolhe quem paga a taxa
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
                  O convidado paga o valor do presente + 11,99% de taxa. 
                  VocÃª recebe o valor integral do presente.
                </p>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-800 font-medium">Exemplo: Presente de R$ 100,00</p>
                  <p className="text-green-700 mt-2">
                    Convidado paga: <strong>R$ 111,99</strong>
                  </p>
                  <p className="text-green-700">
                    VocÃª recebe: <strong>R$ 100,00</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#F1E3D6]">
              <CardHeader>
                <CardTitle className="font-display text-xl text-[#2B2422]">
                  VocÃª Assume a Taxa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  O convidado paga apenas o valor do presente. 
                  A taxa de 11,99% Ã© descontada do seu repasse.
                </p>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-800 font-medium">Exemplo: Presente de R$ 100,00</p>
                  <p className="text-yellow-700 mt-2">
                    Convidado paga: <strong>R$ 100,00</strong>
                  </p>
                  <p className="text-yellow-700">
                    VocÃª recebe: <strong>R$ 88,01</strong>
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
            Crie sua lista em minutos. Ã‰ grÃ¡tis!
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

