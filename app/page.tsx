import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { CalendarCheck2, ImageIcon, MessageCircleHeart, TimerReset, Sparkles, Gift, CreditCard } from 'lucide-react';

const steps = [
  { n: 1, title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente em menos de 2 minutos.' },
  { n: 2, title: 'Monte sua lista', desc: 'Adicione presentes com fotos e valores.' },
  { n: 3, title: 'Compartilhe', desc: 'Envie seu link para convidados no WhatsApp e redes.' },
  { n: 4, title: 'Receba', desc: 'O valor dos presentes cai direto na sua conta.' },
];

const features = [
  {
    title: 'RSVP Inteligente',
    text: 'Confirmação de presença organizada para acompanhar quem vai ao evento.',
    icon: CalendarCheck2,
  },
  {
    title: 'Galeria de Fotos',
    text: 'Monte uma página linda com fotos do evento e momentos especiais.',
    icon: ImageIcon,
  },
  {
    title: 'Mural de Recados',
    text: 'Receba mensagens carinhosas dos convidados junto com os presentes.',
    icon: MessageCircleHeart,
  },
  {
    title: 'Contagem Regressiva',
    text: 'Destaque o grande dia com contador dinâmico e visual elegante.',
    icon: TimerReset,
  },
  {
    title: 'Muito Mais',
    text: 'Editor por blocos, temas personalizados, checkout PIX e gestão completa.',
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-[#ecdccf]">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">A nova forma de celebrar</span>
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                  Transforme presentes em <span className="text-primary">sonhos realizados</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Crie sua lista de presentes online e receba o valor diretamente na sua conta.
                  Simples, elegante e sem complicações.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 text-base">
                  <Link href="/cadastro">Criar Minha Lista</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl px-8 py-6 text-base border-[#dfc7b7] hover:bg-[#fff7f1]">
                  <Link href="/como-funciona">Como Funciona</Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[#d48662] to-[#c65a3a]" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">+2.000</span> listas criadas
                </p>
              </div>
            </div>

            <div className="relative lg:h-[560px] h-[360px]">
              <div className="absolute top-6 right-6 z-10 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-[#ecdccf]">
                <div className="w-10 h-10 bg-[#e8f9ed] rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#1e8a43]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Lista ativa</p>
                  <p className="text-xs text-muted-foreground">Presentes e recados em tempo real</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-6 z-10 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3 border border-[#ecdccf]">
                <div className="w-10 h-10 bg-[#e8f9ed] rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#1e8a43]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pagamento recebido!</p>
                  <p className="text-xs text-muted-foreground">R$ 350,00 • Jogo de panelas</p>
                </div>
              </div>

              <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-[#e6d3c6]">
                <Image src="/hero-image.jpg" alt="Celebração" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Como funciona?</h2>
            <p className="text-lg text-muted-foreground">Simples em apenas 4 passos</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step) => (
              <div key={step.n} className="bg-[#fcfaf8] border border-[#ead9cd] rounded-2xl p-8">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">
                  {step.n}
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f7f2ed]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">Recursos Exclusivos</h2>
            <p className="text-lg text-muted-foreground">Uma experiência completa para você e seus convidados.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-[#ead9cd] bg-white p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffe5d9] text-[#c65a3a] mb-4">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="font-display text-2xl text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">Preço justo e transparente</h2>
          <div className="max-w-lg mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-12 shadow-lg border border-[#ead9cd]">
            <div className="text-6xl font-display font-bold text-primary mb-4">7,99%</div>
            <p className="text-xl text-foreground mb-8">Taxa única por presente recebido</p>
            <div className="space-y-3 text-left mb-8 text-foreground">
              <p>Sem mensalidade</p>
              <p>Sem taxa de cadastro</p>
              <p>Você escolhe quem paga a taxa</p>
              <p>Até 100 presentes por lista</p>
            </div>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8">
              <Link href="/cadastro">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#2b2422] text-white py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="relative w-24 h-12 mb-3 brightness-0 invert">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" />
            </div>
            <p className="text-sm text-gray-400">Transforme seus presentes em sonhos realizados.</p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            <Link href="/como-funciona" className="hover:text-white">Como Funciona</Link>
            <Link href="/tarifas" className="hover:text-white">Tarifas</Link>
            <Link href="/templates" className="hover:text-white">Templates</Link>
            <Link href="/termos" className="hover:text-white">Termos</Link>
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
