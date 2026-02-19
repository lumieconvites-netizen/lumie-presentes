import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { ImageIcon, MessageCircleHeart, TimerReset, Sparkles, CreditCard, CheckCircle2, Gift, Brush, ShoppingBag, Plane, Users, BellRing, FileSpreadsheet, UserPlus, MapPin, Navigation2, CalendarDays, Smartphone, ListMusic, LayoutTemplate, PlayCircle } from 'lucide-react';

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
    id: 'gallery',
    title: 'Galeria de Fotos',
    text: 'Álbum dinâmico com transições suaves e visual sofisticado.',
    icon: ImageIcon,
  },
  {
    id: 'messages',
    title: 'Mural de Recados',
    text: 'Mensagens dos convidados em um mural elegante e vivo.',
    icon: MessageCircleHeart,
  },
  {
    id: 'countdown',
    title: 'Contagem Regressiva',
    text: 'Contador para destacar a emoção do grande dia.',
    icon: TimerReset,
  },
  {
    id: 'playlist',
    title: 'Playlist Integrada',
    text: 'Spotify e YouTube Music com trilha do evento no seu site.',
    icon: ListMusic,
  },
  {
    id: 'templates',
    title: 'Templates Elegantes',
    text: 'Modelos premium e personalizáveis para seu evento.',
    icon: LayoutTemplate,
  },
];

const showcaseGiftItems = [
  { id: 1, title: 'Maquiagem', value: 'R$ 450,00', icon: 'makeup' },
  { id: 2, title: 'Lojas', value: 'R$ 500,00', icon: 'store' },
  { id: 3, title: 'Viagens', value: 'R$ 300,00', icon: 'travel' },
];

const showcaseReceived = { name: 'Isabella', value: 'R$ 350,00' };
const showcaseRsvpGroups = [
  { id: 1, title: 'Deivid Wallace', qty: '+1 acompanhante' },
  { id: 2, title: 'William', qty: '+1 Acompanhante +1 Criança' },
];
const showcaseArrivalFeatures = [
  {
    id: 1,
    title: 'Google Maps e Waze',
    text: 'Seus convidados abrem a localização com um clique e chegam sem estresse.',
    icon: Navigation2,
  },
  {
    id: 2,
    title: 'Agenda sincronizada',
    text: 'Data e horário do evento já ficam prontos para salvar no calendário.',
    icon: CalendarDays,
  },
  {
    id: 3,
    title: 'Rota inteligente',
    text: 'Trajeto sugerido no seu site com visual elegante e atualização em tempo real.',
    icon: MapPin,
  },
  {
    id: 4,
    title: '100% Mobile',
    text: 'Tudo funciona perfeitamente no celular para facilitar o acesso dos convidados.',
    icon: Smartphone,
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
              Lumiê, a solução completa para você e seus convidados.
            </h2>
          </div>

          <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-terracota-500 to-terracota-700 text-white shadow-lg">
                <Gift className="w-9 h-9" />
              </div>

              <h3 className="mt-8 font-display text-4xl text-foreground">A melhor Lista de Presentes</h3>
              <p className="mt-5 text-xl text-muted-foreground leading-relaxed max-w-xl">
                Crie listas personalizadas e receba contribuições de forma rápida, elegante e segura.
                Nada de presentes físicos com risco de itens repetidos: cada contribuição chega com
                organização, praticidade e total liberdade para você usar como preferir.
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

            <div className="relative mock-tilt rounded-[2rem] border border-[#e5d1c3] bg-gradient-to-b from-white to-[#f8f1ea] shadow-xl overflow-visible">
              <div className="absolute -top-10 right-6 z-40 rounded-xl bg-white/95 backdrop-blur px-3 py-2 border border-[#ecdccf] shadow-md text-xs note-chip-float">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#3d2f29]">{showcaseReceived.name} presenteou você!</p>
                  <span className="text-[#c65a3a]">❤</span>
                </div>
                <p className="text-[#9a6a55]">{showcaseReceived.value}</p>
              </div>
              <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#c65a3a]/10 blur-3xl" />
              <div className="rounded-[2rem] overflow-hidden">
              <div className="bg-gradient-to-r from-[#8e3d2c] to-[#c65a3a] text-white px-7 py-7">
                <h4 className="font-display text-4xl">Lista de Presentes</h4>
                <p className="text-sm text-white/90 mt-1">Mock de visual elegante da sua página</p>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-[#ead9cd] bg-white p-4 space-y-3 shadow-sm">
                  {showcaseGiftItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="gift-check-row flex items-center justify-between rounded-xl border border-[#f0e1d7] bg-[#fdfaf7] px-3 py-3"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#f8e7dd] text-[#b05134] inline-flex items-center justify-center">
                          {item.icon === 'makeup' && <Brush className="w-5 h-5" />}
                          {item.icon === 'store' && <ShoppingBag className="w-5 h-5" />}
                          {item.icon === 'travel' && <Plane className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-[#3d2f29] leading-tight">{item.title}</p>
                          <p className="text-[#b05134] text-sm font-semibold">{item.value}</p>
                        </div>
                    </div>
                      <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white inline-flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                  </div>
                ))}
                </div>

                <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#1fbf83] to-[#37d998] p-5 text-white shadow-sm">
                  <p className="text-sm opacity-95">Total convertido em dinheiro</p>
                  <p className="text-4xl font-bold mt-1">R$ 1.250,00</p>
                </div>

                <div className="mt-5 flex gap-3">
                  <Link href="/cadastro" className="flex-1 rounded-xl bg-gradient-to-r from-[#a5482d] to-[#c65a3a] text-white text-center py-3 font-semibold hover:brightness-105 transition">
                    Criar lista
                  </Link>
                  <Link href="/templates" className="flex-1 rounded-xl border border-[#d7b7a3] bg-white text-[#8e3d2c] text-center py-3 font-semibold hover:bg-[#fff8f3] transition">
                    Ver modelos
                  </Link>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative rounded-[2rem] border border-[#d9ece1] bg-gradient-to-b from-white to-[#f3faf6] shadow-xl overflow-visible">
              <div className="absolute -top-6 right-6 z-40 rounded-xl bg-white/95 backdrop-blur px-3 py-2 border border-[#d9ece1] shadow-md text-xs note-chip-float">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#3d2f29]">Davi Lucas confirmou a presença</p>
                  <span className="text-[#17a26c]">✓</span>
                </div>
              </div>
              <div className="absolute -bottom-6 left-6 z-40 rounded-xl bg-white/95 backdrop-blur px-4 py-2 border border-[#d9ece1] shadow-md text-sm font-semibold text-[#198f61]">
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Importe via Excel
                </span>
              </div>
              <div className="rounded-[2rem] overflow-hidden">
                <div className="bg-gradient-to-r from-[#17a26c] to-[#37d998] text-white px-7 py-6">
                  <h4 className="font-display text-4xl">Gerenciamento de Convidados</h4>
                  <p className="text-sm text-white/90 mt-1">RSVP inteligente para seu evento</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#e2efe8] bg-[#fbfffd] p-4 text-center">
                      <p className="text-3xl font-bold text-[#179f6a]">220</p>
                      <p className="text-sm text-[#5d6b63]">Confirmados</p>
                    </div>
                    <div className="rounded-xl border border-[#e2efe8] bg-[#fbfffd] p-4 text-center">
                      <p className="text-3xl font-bold text-[#3d2f29]">330</p>
                      <p className="text-sm text-[#5d6b63]">Convidados</p>
                    </div>
                    <div className="rounded-xl border border-[#e2efe8] bg-[#fbfffd] p-4 text-center">
                      <p className="text-3xl font-bold text-[#d4a017]">110</p>
                      <p className="text-sm text-[#5d6b63]">Pendentes</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a5482d] to-[#c65a3a] text-white px-4 py-2 text-sm font-semibold">
                      <UserPlus className="w-4 h-4" />
                      Adicionar convidado
                    </span>
                    <span className="rounded-xl border border-[#d6e6dd] bg-white text-[#5c4a42] px-4 py-2 text-sm">
                      Check-in
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-[#d6e6dd] bg-white text-[#5c4a42] px-4 py-2 text-sm">
                      <BellRing className="w-4 h-4" />
                      Configurações
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {showcaseRsvpGroups.map((group) => (
                      <div key={group.id} className="rounded-xl border border-[#e2efe8] bg-[#fbfffd] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#ffe5d9] text-[#a5482d] inline-flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#3d2f29]">{group.title}</p>
                            <p className="text-sm text-[#6e5b52]">{group.qty}</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-[#1fa05a]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4">
                <h3 className="font-display text-4xl text-foreground">Confirmação de Presença (RSVP)</h3>
                <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#17a26c] to-[#37d998] text-white shadow-lg">
                  <MessageCircleHeart className="w-9 h-9" />
                </div>
              </div>
              <p className="mt-5 text-xl text-muted-foreground leading-relaxed max-w-xl">
                Automatize as confirmações dos seus convidados em poucos cliques.
                Tudo integrado à sua lista para acompanhar presença em tempo real.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Confirmação com um clique, sem complicação.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Notificações por email em tempo real.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Controle ao vivo de confirmados e pendentes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#1fa05a] mt-0.5" />
                  <p className="text-lg text-[#4f3f37]">Integração direta com sua lista de convidados.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24">
            <div className="text-center max-w-4xl mx-auto">
              <h3 className="font-display text-5xl text-foreground leading-tight">Ajudando seus convidados a chegar</h3>
              <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
                Local do evento no Google Maps ou Waze, agenda e rota no seu site.
                Tudo para ninguem perder o grande dia.
              </p>
            </div>

            <div className="mt-14 grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div className="relative rounded-[2rem] border border-[#e5d1c3] bg-white p-5 shadow-xl">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-[#d9e6d9] bg-[#edf5ea] h-[420px] sm:h-[500px] lg:h-[620px]">
                  <div className="absolute inset-0 map-grid" />

                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                      d="M12 80 C 24 68, 34 58, 44 48 S 67 28, 83 20"
                      className="map-route-line"
                    />
                  </svg>

                  <div className="absolute map-chip-waze rounded-2xl bg-white/95 px-3 py-2 sm:px-4 sm:py-3 shadow-md border border-[#dce7db]">
                    <div className="flex items-center gap-2">
                      <span className="waze-logo">
                        <span className="waze-face" />
                        <span className="waze-wheel waze-wheel-left" />
                        <span className="waze-wheel waze-wheel-right" />
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#3d2f29]">Waze</p>
                    </div>
                  </div>
                  <div className="absolute map-chip-gmaps rounded-2xl bg-white/95 px-3 py-2 sm:px-4 sm:py-3 shadow-md border border-[#dce7db]">
                    <div className="flex items-center gap-2">
                      <span className="google-maps-logo">
                        <span className="gm-dot gm-blue" />
                        <span className="gm-dot gm-red" />
                        <span className="gm-dot gm-yellow" />
                        <span className="gm-dot gm-green" />
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#3d2f29]">Google Maps</p>
                    </div>
                  </div>

                  <div className="absolute map-pin-wrap">
                    <div className="mb-2 rounded-xl bg-white/95 border border-[#ecdccf] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#5a473f] shadow-sm">
                      Local do evento
                    </div>
                    <div className="map-pin-pulse relative h-16 w-16 rounded-full bg-[#c65a3a]/20 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#a5482d] to-[#c65a3a] text-white flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute map-route-note rounded-xl bg-white/95 border border-[#ecdccf] px-3 py-2 text-xs text-[#6a564d] shadow-md note-chip-float">
                    Rota atualizada agora
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {showcaseArrivalFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-[#ead9cd] bg-white/80 p-5 shadow-sm">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e7dd] text-[#b05134] shrink-0">
                        <Icon className="w-6 h-6" />
                      </span>
                      <div>
                        <p className="font-display text-3xl text-[#3d2f29] leading-tight">{item.title}</p>
                        <p className="mt-2 text-lg text-[#6e5b52] leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f7f2ed]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">Recursos Exclusivos</h2>
            <p className="text-lg text-muted-foreground">Uma experiência única para você e seus convidados:</p>
          </div>

          <div className="relative overflow-hidden resource-carousel-wrap max-w-7xl mx-auto">
            <div className="resource-carousel-track">
              {[...features, ...features].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={`${feature.id}-${index}`} className="resource-card rounded-2xl border border-[#ead9cd] bg-white p-4 shadow-sm">
                  <div className={`resource-card-mock resource-mock-${feature.id} rounded-xl border border-[#f0e1d7] p-3`}>
                    {feature.id === 'gallery' && (
                      <div className="relative w-full h-full rounded-lg overflow-hidden resource-float-a">
                        <Image
                          src="/hero-slides/casamento-01.jpg"
                          alt="Galeria do evento"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </div>
                    )}
                    {feature.id === 'messages' && (
                      <div className="space-y-2">
                        <div className="h-8 rounded-lg bg-white border border-[#ecd9cc] px-2.5 flex items-center text-[11px] leading-tight text-[#6a4e42] resource-slide-in">Isabella: lindo site!</div>
                        <div className="h-8 rounded-lg bg-white border border-[#ecd9cc] px-2.5 flex items-center text-[11px] leading-tight text-[#6a4e42] resource-slide-in-delayed">Rayan: parabéns ao casal!</div>
                      </div>
                    )}
                    {feature.id === 'countdown' && (
                      <div className="grid grid-cols-3 gap-2.5 w-full">
                        {['12', '08', '24'].map((n) => (
                          <div key={n} className="h-9 rounded-lg bg-[#fff3ec] border border-[#efcfbd] px-2.5 flex items-center justify-center">
                            <p className="font-display text-lg leading-none text-[#b25134]">{n}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {feature.id === 'playlist' && (
                      <div className="space-y-2">
                        <div className="rounded-lg bg-white border border-[#ecd9cc] px-2.5 py-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#3d2f29]">Spotify</span>
                          <PlayCircle className="w-4 h-4 shrink-0 text-[#1DB954]" />
                        </div>
                        <div className="rounded-lg bg-white border border-[#ecd9cc] px-2.5 py-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-[#3d2f29]">YouTube Music</span>
                          <PlayCircle className="w-4 h-4 shrink-0 text-[#FF0000]" />
                        </div>
                      </div>
                    )}
                    {feature.id === 'templates' && (
                      <div className="w-full h-full rounded-lg border border-[#ead7cb] bg-gradient-to-b from-[#fffaf5] to-[#f4e9e1] p-2.5 space-y-2">
                        <div className="h-5 rounded-md bg-white/90 border border-[#eddccf] px-2 flex items-center justify-between">
                          <span className="text-[10px] text-[#8b5f4c]">Templates</span>
                          <span className="text-[10px] text-[#c65a3a]">01</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="h-11 rounded-md border border-[#ebd7ca] bg-gradient-to-b from-[#fff] to-[#f6e9e0] resource-float-a" />
                          <div className="h-11 rounded-md border border-[#ebd7ca] bg-gradient-to-b from-[#fff] to-[#eddcd2] resource-float-b" />
                          <div className="h-11 rounded-md border border-[#ebd7ca] bg-gradient-to-b from-[#fff] to-[#f8eee6] resource-float-a" />
                        </div>
                        <div className="h-6 rounded-md bg-white/85 border border-[#eddccf] px-2 flex items-center">
                          <span className="text-[10px] text-[#7b5a4d]">15 anos - casamento</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="resource-card-copy">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe5d9] text-[#c65a3a] mb-2">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-display text-[1.6rem] text-foreground mb-1.5 leading-tight">{feature.title}</h3>
                    <p className={`text-sm text-muted-foreground leading-relaxed ${feature.id === 'templates' ? 'max-w-[24ch]' : ''}`}>{feature.text}</p>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-[#f5ebe2] overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c65a3a]/12 blur-3xl" />
        <div className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14 max-w-4xl mx-auto">
              <h2 className="font-display text-5xl md:text-7xl leading-[1.02] text-primary">Como funciona</h2>
              <p className="mt-6 text-lg md:text-2xl text-[#5b473e] leading-relaxed">Em 4 passos:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
              {steps.map((step) => (
                <div key={step.n} className="text-center rounded-3xl border border-[#ead3c3] bg-white/70 px-4 py-7 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="font-display text-5xl text-[#c65a3a] leading-none">{String(step.n).padStart(2, '0')}</span>
                    <span className="h-px w-8 bg-[#d88a6f]" />
                  </div>
                  <h3 className="font-display text-3xl text-[#3d2f29]">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#6f5a50] max-w-[220px] mx-auto leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-xs md:text-sm tracking-[0.22em] uppercase text-[#9f6a53]">simples • rapido • seguro</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#2e2424] via-[#1f1a1c] to-[#2d2422] py-14">
          <div className="container mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
              <div>
                <p className="font-display text-5xl text-[#d76d4a]">R$ 2M+</p>
                <p className="mt-2 text-[#e3d9d3]">em presentes convertidos</p>
              </div>
              <div>
                <p className="font-display text-5xl text-[#f0b477]">2.500+</p>
                <p className="mt-2 text-[#e3d9d3]">listas criadas</p>
              </div>
              <div>
                <p className="font-display text-5xl text-[#f0b477]">98%</p>
                <p className="mt-2 text-[#e3d9d3]">clientes satisfeitos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#a5482d] to-[#c65a3a] py-16">
          <div className="container mx-auto px-6 text-center">
            <h3 className="font-display text-4xl md:text-5xl text-white">Pronto para criar sua lista?</h3>
            <p className="mt-4 text-white/90 max-w-2xl mx-auto text-lg">
              Comece agora e transforme seus presentes em creditos.
              Rapido para criar, elegante para compartilhar.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-8 bg-white text-[#a5482d] border-white/70 hover:bg-[#fff3ec] hover:text-[#8f3c24] rounded-xl px-8 font-semibold shadow-lg">
              <Link href="/cadastro" className="text-[#a5482d]">Criar Minha Lista Gratis</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

