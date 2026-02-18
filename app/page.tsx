import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { CalendarCheck2, ImageIcon, MessageCircleHeart, TimerReset, Sparkles, CreditCard, CheckCircle2, Gift } from 'lucide-react';

const heroSlides = [
  { src: '/hero-slides/15-anos-01.jpg', alt: 'Festa de 15 anos 1' },
  { src: '/hero-slides/15-anos-02.jpg', alt: 'Festa de 15 anos 2' },
  { src: '/hero-slides/casamento-01.jpg', alt: 'Casamento 1' },
  { src: '/hero-slides/aniversario-menina-01.jpg', alt: 'Aniversario de menina' },
  { src: '/hero-slides/15-anos-03.jpg', alt: 'Festa de 15 anos 3' },
  { src: '/hero-slides/casamento-02.jpg', alt: 'Casamento 2' },
  { src: '/hero-slides/aniversario-menino-01.jpg', alt: 'Aniversario de menino' },
];

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

const showcaseGiftItems = [
  { emoji: '💄', title: 'Maquiagem', value: 'R$ 450,00' },
  { emoji: '🛍️', title: 'Lojas', value: 'R$ 500,00' },
  { emoji: '✈️', title: 'Viagens', value: 'R$ 300,00' },
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
                <Button asChild size="lg" className="bg-gradient-to-r from-terracota-500 to-terracota-700 text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm rounded-xl px-8 py-6 text-base">
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
              <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(198,90,58,0.22),rgba(142,61,44,0.08)_45%,transparent_70%)] blur-2xl" />
              <div className="floating-balloon balloon-a" />
              <div className="floating-balloon balloon-b" />
              <div className="floating-balloon balloon-c" />
              <div className="floating-balloon balloon-d" />

              <div className="hero-chip hero-chip-top absolute top-6 right-6 z-20 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-[#ecdccf]">
                <div className="w-9 h-9 bg-[#fff1eb] rounded-full flex items-center justify-center">
                  <MessageCircleHeart className="w-4 h-4 text-[#c65a3a]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">127 recados</p>
                </div>
              </div>

              <div className="hero-chip hero-chip-bottom absolute bottom-8 left-6 z-20 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3 border border-[#ecdccf]">
                <div className="w-10 h-10 bg-[#e8f9ed] rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#1e8a43]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Pagamento recebido!</p>
                  <p className="text-xs text-muted-foreground">R$ 350,00 • Jogo de panelas</p>
                </div>
              </div>

              <div className="relative z-10 h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-[#e6d3c6]">
                {heroSlides.map((slide, index) => (
                  <Image
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={index === 0}
                    className="hero-slide object-cover"
                    style={{
                      animationDelay: `${index * 3}s`,
                      animationDuration: `${heroSlides.length * 3}s`,
                    }}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-28 bg-[#f5ebe2] overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c65a3a]/10 blur-3xl" />

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] text-foreground">
              O site do seu evento
              <span className="block text-primary">elegante, moderno e premium.</span>
            </h2>

            <p className="mt-8 text-lg md:text-2xl text-[#5b473e] leading-relaxed">
              Uma experiência única, sofisticada e memorável para você e seus convidados.
              A presença digital do seu evento no nível que ele merece.
            </p>

            <p className="mt-10 text-xs md:text-sm tracking-[0.24em] uppercase text-[#9f6a53]">
              recursos exclusivos • elegância • praticidade
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#fbf8f5]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="font-display text-4xl md:text-6xl text-foreground leading-tight">
              A solução completa para o seu evento
            </h2>
            <p className="mt-5 text-lg md:text-2xl text-muted-foreground">
              Site personalizado, lista em dinheiro e confirmação de presença:
              tudo o que você precisa para o grande dia, em um só lugar.
            </p>
          </div>

          <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-terracota-500 to-terracota-700 text-white shadow-lg">
                <Gift className="w-9 h-9" />
              </div>

              <h3 className="mt-8 font-display text-4xl text-foreground">A melhor Lista de Presentes</h3>
              <p className="mt-5 text-xl text-muted-foreground leading-relaxed max-w-xl">
                Crie listas personalizadas e receba contribuições de forma rápida, elegante e segura.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Categorias personalizadas para o estilo do seu evento.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Tudo convertido em dinheiro, com praticidade para você.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Experiência premium para encantar cada convidado.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#ead9cd] bg-white shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-terracota-600 to-terracota-700 text-white px-7 py-7">
                <h4 className="font-display text-4xl">Lista de Presentes</h4>
                <p className="text-sm text-white/90 mt-1">Receba em dinheiro na hora</p>
              </div>

              <div className="p-6 space-y-4">
                {showcaseGiftItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#ead9cd] bg-[#fcfaf8] px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="font-semibold text-[#3d2f29]">{item.title}</p>
                        <p className="text-[#b05134] font-semibold">{item.value}</p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-terracota-600" />
                  </div>
                ))}

                <div className="rounded-2xl bg-gradient-to-r from-[#20b77c] to-[#30d88f] p-5 text-white">
                  <p className="text-sm opacity-95">Convertido em dinheiro</p>
                  <p className="text-4xl font-bold mt-1">R$ 1.250,00</p>
                </div>
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
            <Button asChild size="lg" className="bg-gradient-to-r from-terracota-500 to-terracota-700 text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm rounded-xl px-8">
              <Link href="/cadastro">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

