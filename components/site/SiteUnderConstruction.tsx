import Image from 'next/image';

type SiteUnderConstructionProps = {
  domain?: string | null;
  title?: string | null;
  hostName?: string | null;
};

export default function SiteUnderConstruction({ domain, title, hostName }: SiteUnderConstructionProps) {
  const eventTitle = title?.trim() || 'Este evento';
  const ownerName = hostName?.trim();

  return (
    <main className="min-h-screen bg-[#fbf7f3] text-[#2f2622]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-10">
          <Image src="/logo.png" alt="LUMIÊ" width={76} height={38} className="h-auto w-[76px] object-contain" priority />
        </div>

        <section className="grid w-full items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6 text-center lg:text-left">
            <p className="mx-auto inline-flex rounded-full border border-[#ead9cd] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a5a42] lg:mx-0">
              Site em construção
            </p>
            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-[#2b2422] md:text-6xl">
                {eventTitle} está quase pronto.
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-[#6a5950] md:text-lg lg:mx-0">
                {ownerName ? `${ownerName} ainda está preparando os detalhes deste site.` : 'Os anfitriões ainda estão preparando os detalhes deste site.'}
                {' '}Volte em breve para acessar as informações do evento.
              </p>
            </div>
            {domain ? <p className="text-sm text-[#8a7469]">{domain}</p> : null}
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] border border-[#ead9cd] bg-white shadow-[0_24px_70px_rgba(84,56,42,0.14)]">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#fffaf6,#f1e3d9)]" />
            <div className="absolute left-0 top-0 h-28 w-full bg-[#d97451]/20" />
            <div className="absolute right-0 top-0 h-full w-28 bg-[#f1c1ab]/45" />
            <div className="absolute left-10 top-12 h-24 w-48 rotate-[-8deg] rounded-2xl border border-white/70 bg-white/45" />
            <div className="absolute bottom-10 left-10 right-10 rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-[#8e3d2c]">Preparando a experiência</p>
              <div className="mt-4 space-y-3">
                <div className="h-3 w-3/4 rounded-full bg-[#e8cfc2]" />
                <div className="h-3 w-full rounded-full bg-[#f0ded5]" />
                <div className="h-3 w-2/3 rounded-full bg-[#ead6cc]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
