'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Globe, Heart, Music2, Video, Menu, X } from 'lucide-react';
import Link from 'next/link';

interface PublicPageViewProps {
  blocks: any[];
  gifts: any[];
  messages: any[];
  settings: any;
  theme?: any;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toYoutubeEmbedUrl(url: string) {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
  const long = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (long?.[1]) return `https://www.youtube.com/embed/${long[1]}`;
  return url;
}

function toSpotifyEmbedUrl(url: string) {
  if (!url) return '';
  if (url.includes('open.spotify.com/embed/')) return url;
  return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
}

function toGoogleMapsEmbed(url: string) {
  if (!url) return '';
  if (url.includes('/maps/embed')) return url;
  return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}

function toExternalMapUrl(value: string) {
  const url = (value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(url)}`;
}

export default function PublicPageView({ blocks, gifts, messages, settings, theme = {} }: PublicPageViewProps) {
  const primaryColor = theme.primary_color || '#C86E52';
  const secondaryColor = theme.secondary_color || '#8E3D2C';
  const backgroundColor = theme.background_color || '#FAF4EF';
  const fontTitle = theme.font_title || 'Cormorant Garamond';
  const fontBody = theme.font_body || 'Inter';
  const header = theme.header || {};

  const listSlug = settings?.slug ? String(settings.slug) : '';
  const presentsHref = listSlug ? `/site/${encodeURIComponent(listSlug)}/presentes` : '/site/presentes';
  const rsvpHref = listSlug ? `/site/${encodeURIComponent(listSlug)}/confirmar-presenca` : '#';
  const meuSiteHref = header.menuMeuSiteUrl || '';
  const giftsMenuHref = header.menuGiftsUrl || '';
  const rsvpMenuHref = header.menuRsvpUrl || '';
  const mapMenuHref = toExternalMapUrl(header.menuMapUrl || '');

  const enabledBlocks = blocks.filter((block) => block.enabled).sort((a, b) => a.order - b.order);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const countdownBlock = enabledBlocks.find((b) => b.type === 'countdown');
    if (!countdownBlock?.config?.eventDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(countdownBlock.config.eventDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabledBlocks]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const resolvedMeuSiteHref = meuSiteHref || '#meu-site';
  const resolvedGiftsHref = giftsMenuHref || presentsHref;
  const resolvedRsvpHref = rsvpMenuHref || rsvpHref;
  const showMeuSite = header.showMeuSite !== false;
  const showGifts = header.showGifts !== false;
  const showRsvp = header.showRsvp !== false;
  const showMap = header.showMap !== false;
  const menuMeuSite = String(header.menuMeuSite || 'Meu Site').toUpperCase();
  const menuGifts = String(header.menuGifts || 'Lista de Presentes').toUpperCase();
  const menuRsvp = String(header.menuRsvp || 'Confirmar Presenca').toUpperCase();
  const menuMap = String(header.menuMap || 'Como Chegar').toUpperCase();

  return (
    <div
      id="meu-site"
      className="list-font-scope"
      style={
        {
          ['--list-font-title' as any]: `"${fontTitle}"`,
          ['--list-font-body' as any]: `"${fontBody}"`,
        } as React.CSSProperties
      }
    >
      {header.enabled !== false && (
        <header
          className="sticky top-0 z-50 border-b"
          style={{ backgroundColor: header.backgroundColor || '#0B0B0B', color: header.textColor || '#FFFFFF' }}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="font-semibold text-2xl" style={{ fontFamily: fontTitle }}>
              {header.brandText || 'LUMIÊ'}
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-wide">
              {showMeuSite && (
                resolvedMeuSiteHref.startsWith('#') ? (
                  <button onClick={() => scrollTo('meu-site')} className="hover:opacity-80">{menuMeuSite}</button>
                ) : (
                  <Link href={resolvedMeuSiteHref} className="hover:opacity-80">{menuMeuSite}</Link>
                )
              )}
              {showGifts && <Link href={resolvedGiftsHref} className="hover:opacity-80">{menuGifts}</Link>}
              {showRsvp && <Link href={resolvedRsvpHref} className="hover:opacity-80">{menuRsvp}</Link>}
              {showMap && (
                mapMenuHref ? (
                  <a href={mapMenuHref} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">{menuMap}</a>
                ) : (
                  <button onClick={() => scrollTo('como-chegar-section')} className="hover:opacity-80">{menuMap}</button>
                )
              )}
            </nav>

            <button className="md:hidden" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Abrir menu">
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div className="px-4 py-3 flex flex-col gap-3 text-sm uppercase tracking-wide">
                {showMeuSite && (
                  resolvedMeuSiteHref.startsWith('#') ? (
                    <button onClick={() => scrollTo('meu-site')} className="text-left">{menuMeuSite}</button>
                  ) : (
                    <Link href={resolvedMeuSiteHref} onClick={() => setMobileMenuOpen(false)}>{menuMeuSite}</Link>
                  )
                )}
                {showGifts && <Link href={resolvedGiftsHref} onClick={() => setMobileMenuOpen(false)}>{menuGifts}</Link>}
                {showRsvp && <Link href={resolvedRsvpHref} onClick={() => setMobileMenuOpen(false)}>{menuRsvp}</Link>}
                {showMap && (
                  mapMenuHref ? (
                    <a href={mapMenuHref} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>{menuMap}</a>
                  ) : (
                    <button onClick={() => scrollTo('como-chegar-section')} className="text-left">{menuMap}</button>
                  )
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {enabledBlocks.map((block) => {
        const config = block.config || {};

        return (
          <div key={block.id}>
            {block.type === 'hero' && (
              <div
                className="relative min-h-[600px] flex items-center justify-center text-white"
                style={{
                  background: config.backgroundImage
                    ? `url(${config.backgroundImage}) center/cover`
                    : `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                {config.logo && (
                  <div className="absolute top-8 left-8 z-10">
                    <img src={config.logo} alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
                  </div>
                )}
                <div className="relative text-center z-10 px-6 max-w-4xl">
                  {config.label && <p className="text-sm mb-3 opacity-90 tracking-[0.3em] uppercase">{config.label}</p>}
                  <h1 className="text-5xl md:text-7xl mb-4 font-bold" style={{ fontFamily: fontTitle }}>
                    {config.title || 'Meu Evento Especial'}
                  </h1>
                  {config.subtitle && <p className="text-xl md:text-2xl mb-8 opacity-90">{config.subtitle}</p>}
                  {config.buttonText && (
                    <Button size="lg" className="bg-white hover:bg-gray-100" style={{ color: primaryColor }} onClick={() => scrollTo('lista-presentes-section')}>
                      {config.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {block.type === 'message' && (
              <div className="p-12 md:p-20 text-center bg-white">
                <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Nossa Historia'}
                </h2>
                <p className="text-base md:text-lg text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                  {config.message || 'Escreva aqui uma mensagem especial para seus convidados.'}
                </p>
                {config.signature && <p className="text-gray-600 italic mt-8 text-lg">{config.signature}</p>}
              </div>
            )}

            {block.type === 'countdown' && config.eventDate && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h3 className="text-2xl md:text-3xl text-center mb-10" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Contagem Regressiva'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {[
                    { value: countdown.days, label: 'Dias' },
                    { value: countdown.hours, label: 'Horas' },
                    { value: countdown.minutes, label: 'Minutos' },
                    { value: countdown.seconds, label: 'Segundos' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                      <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: primaryColor }}>
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-sm text-gray-600 uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {block.type === 'gifts' && (
              <div id="lista-presentes-section" className="p-12 md:p-16 bg-white">
                <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-gray-200">
                  <div className="relative h-[320px] md:h-[420px]">
                    {config.coverImage ? (
                      <img src={config.coverImage} alt="Lista de presentes" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-700" />
                    )}
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute left-8 right-8 bottom-8">
                      <h2 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: fontTitle, color: config.titleColor || '#FFFFFF' }}>
                        {config.title || 'Lista de Presentes'}
                      </h2>
                      <p className="max-w-2xl mb-5" style={{ color: config.descriptionColor || 'rgba(255,255,255,0.9)' }}>
                        {config.description || 'Esta e nossa lista de presentes. Ficamos felizes em compartilhar esse momento com voce.'}
                      </p>
                      <Link
                        href={presentsHref}
                        className="inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-110 hover:saturate-125"
                        style={{
                          backgroundColor: config.buttonBgColor || primaryColor,
                          color: config.buttonTextColor || '#FFFFFF',
                        }}
                      >
                        {config.buttonText || 'Presentear'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'messages' && config.showPublicly !== false && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Recados Especiais'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {messages
                    .filter((m) => m.isPublic)
                    .slice(0, 4)
                    .map((msg, i) => (
                      <Card key={i} className="p-6 bg-white">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                            {msg.guestName?.charAt(0) || '•'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{msg.guestName}</h4>
                            <p className="text-xs text-gray-500">{new Date(msg.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {msg.isFavorite && <Heart className="w-5 h-5 text-red-500 fill-red-500" />}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{msg.message}</p>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {block.type === 'gallery' && config.images && config.images.length > 0 && (
              <div className="p-12 md:p-16 bg-white">
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Galeria de Fotos'}
                </h2>
                <div className={`grid ${config.layout === 'masonry' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-4 max-w-6xl mx-auto`}>
                  {config.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl">
                      <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {block.type === 'event-info' && (
              <div id="como-chegar-section" className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Informacoes do Evento'}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                  {config.datetime && (
                    <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Calendar className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2 text-gray-900">Data e Hora</h3>
                        <p className="text-gray-600 text-lg">
                          {new Date(config.datetime).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {(config.location || config.address) && (
                    <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <MapPin className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2 text-gray-900">{config.location || 'Local do Evento'}</h3>
                        <p className="text-gray-600 mb-3">{config.address}</p>
                        {config.mapLink && (
                          <a href={config.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                            <Globe className="w-4 h-4" />
                            {config.mapButtonText || 'Ver no mapa'}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'map' && (
              <div id="como-chegar-section" className="p-12 md:p-16 bg-white">
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: primaryColor }}>
                    {config.title || 'Como chegar'}
                  </h2>
                  {config.subtitle && <p className="text-gray-600 mb-6">{config.subtitle}</p>}
                  {config.address && (
                    <p className="text-gray-700 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {config.address}
                    </p>
                  )}
                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    {config.embedUrl || config.externalMapUrl ? (
                      <iframe src={toGoogleMapsEmbed(config.embedUrl || config.externalMapUrl)} width="100%" height="380" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    ) : (
                      <div className="h-[280px] bg-gray-100 flex items-center justify-center text-gray-500">Adicione URL embed do mapa no editor</div>
                    )}
                  </div>
                  {config.externalMapUrl && (
                    <div className="mt-4">
                      <a href={config.externalMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: primaryColor }}>
                        <Globe className="w-4 h-4" />
                        Abrir rota no mapa
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'music' && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: primaryColor }}>
                    {config.title || 'Nossa trilha sonora'}
                  </h2>
                  {config.description && <p className="text-gray-600 mb-6">{config.description}</p>}
                  {config.spotifyUrl ? (
                    <iframe src={toSpotifyEmbedUrl(config.spotifyUrl)} width="100%" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="rounded-2xl" />
                  ) : config.youtubeUrl ? (
                    <iframe src={toYoutubeEmbedUrl(config.youtubeUrl)} width="100%" height="360" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-2xl border border-gray-200" />
                  ) : (
                    <div className="h-36 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 gap-2">
                      <Music2 className="w-4 h-4" /> Configure Spotify ou YouTube no editor
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'video' && (
              <div className="p-12 md:p-16 bg-white">
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: primaryColor }}>
                    {config.title || 'Nosso video'}
                  </h2>
                  {config.description && <p className="text-gray-600 mb-6">{config.description}</p>}
                  {config.videoUrl ? (
                    <iframe src={toYoutubeEmbedUrl(config.videoUrl)} width="100%" height="460" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-2xl border border-gray-200" />
                  ) : (
                    <div className="h-[280px] rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 gap-2">
                      <Video className="w-4 h-4" /> Configure o link do video no editor
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}



