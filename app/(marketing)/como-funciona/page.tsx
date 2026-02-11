'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import {
  Gift,
  CreditCard,
  Sparkles,
  Heart,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Crie sua conta',
      description: 'Cadastre-se gratuitamente e crie sua lista de presentes em minutos. Escolha um template ou comece do zero.',
      icon: Sparkles
    },
    {
      number: '02',
      title: 'Adicione seus presentes',
      description: 'Cadastre os presentes que deseja com fotos, descrições e valores. Você pode adicionar até 100 itens.',
      icon: Gift
    },
    {
      number: '03',
      title: 'Personalize sua página',
      description: 'Use nosso editor visual para criar uma página única com sua identidade. Cores, fontes, blocos - tudo personalizado.',
      icon: Heart
    },
    {
      number: '04',
      title: 'Compartilhe o link',
      description: 'Envie o link da sua lista para seus convidados por WhatsApp, e-mail ou redes sociais.',
      icon: Users
    },
    {
      number: '05',
      title: 'Receba os presentes',
      description: 'Seus convidados escolhem os presentes e pagam com cartão ou PIX. Você recebe os valores diretamente.',
      icon: CreditCard
    },
    {
      number: '06',
      title: 'Acompanhe tudo',
      description: 'Veja quem presenteou, leia os recados carinhosos e acompanhe seus recebimentos em tempo real.',
      icon: Zap
    }
  ];

  const benefits = [
    'Receba o valor em dinheiro, não o presente físico',
    'Evite presentes repetidos ou indesejados',
    'Seus convidados pagam com segurança',
    'Mensagens carinhosas de quem presenteou',
    'Dashboard completo para acompanhar',
    'Suporte a cartão de crédito e PIX'
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#FAF4EF] to-[#F1E3D6]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-[#2B2422] mb-6">
              Como a LUMIÊ funciona
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma forma simples e elegante de transformar presentes em créditos. 
              Veja como é fácil criar sua lista e começar a receber.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-display text-primary/20">
                      {step.number}
                    </span>
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl text-[#2B2422] mb-4">
                    {step.title}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {step.description}
                  </p>
                </div>
                
                <div className="flex-1">
                  <div 
                    className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#F1E3D6] to-[#FAF4EF] flex items-center justify-center shadow-inner"
                  >
                    <step.icon className="w-24 h-24 text-[#D4A574]" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-[#FAF4EF]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-[#2B2422] text-center mb-12">
            Por que usar a LUMIÊ?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-[#2B2422]">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-display text-3xl text-[#2B2422] mb-4">
            100% Seguro
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Utilizamos a Pagar.me, uma das plataformas de pagamento mais seguras do Brasil. 
            Seus dados e transações estão protegidos com criptografia de ponta.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <span>🔒 Criptografia SSL</span>
            <span>✅ PCI Compliant</span>
            <span>🛡️ Antifraude</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Crie sua lista em poucos minutos e comece a receber. 
            É grátis para criar!
          </p>
          <Button 
            size="lg"
            className="bg-white text-primary hover:bg-gray-100 text-base px-8 py-6"
            asChild
          >
            <Link href="/cadastro">
              Criar Minha Lista
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
