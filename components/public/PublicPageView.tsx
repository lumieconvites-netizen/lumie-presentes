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

function toRgba(color: string, alpha: number) {
  const value = (color || '').trim();
  if (!value.startsWith('#')) return `rgba(250,244,239,${alpha})`;
  const hex = value.slice(1);
  const normalized =
    hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex.length === 6
      ? hex
      : 'FAF4EF';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLegacyBasePoint(position: string) {
  const map: Record<string, { x: number; y: number }> = {
    center: { x: 50, y: 50 },
    'top-left': { x: 18, y: 24 },
    'top-center': { x: 50, y: 24 },
    'top-right': { x: 82, y: 24 },
    'middle-left': { x: 18, y: 50 },
    'middle-right': { x: 82, y: 50 },
    'bottom-left': { x: 18, y: 76 },
    'bottom-center': { x: 50, y: 76 },
    'bottom-right': { x: 82, y: 76 },
  };
  return map[position] || map.center;
}

function getHeroPoint(config: any, key: 'label' | 'title' | 'subtitle') {
  const legacy = getLegacyBasePoint(config.contentPosition || 'center');
  const defaults: Record<'label' | 'title' | 'subtitle', { x: number; y: number }> = {
    label: { x: legacy.x, y: clamp(legacy.y - 14, 6, 94) },
    title: { x: legacy.x, y: clamp(legacy.y - 2, 8, 92) },
    subtitle: { x: legacy.x, y: clamp(legacy.y + 10, 10, 94) },
  };
  const xKey = `${key}X`;
  const yKey = `${key}Y`;
  return {
    x: clamp(Number(config?.[xKey] ?? defaults[key].x), 0, 100),
    y: clamp(Number(config?.[yKey] ?? defaults[key].y), 0, 100),
  };
}

function getHeroOverlayStyle(config: any): React.CSSProperties | null {
  if (config?.overlayEnabled === false) return null;
  const color = config?.overlayColor || '#000000';
  const alpha = clamp(Number(config?.overlayOpacity ?? 20), 0, 100) / 100;
  const rgba = toRgba(color, alpha);
  const mode = config?.overlayMode || 'full';
  if (mode !== 'gradient') {
    return { backgroundColor: rgba };
  }

  const coverage = clamp(Number(config?.overlayCoverage ?? 55), 10, 100);
  const direction = config?.overlayDirection || 'bottom';
  if (direction === 'top') {
    return { background: `linear-gradient(to bottom, ${rgba} 0%, ${rgba} ${coverage}%, transparent 100%)` };
  }
  if (direction === 'left') {
    return { background: `linear-gradient(to right, ${rgba} 0%, ${rgba} ${coverage}%, transparent 100%)` };
  }
  if (direction === 'right') {
    return { background: `linear-gradient(to left, ${rgba} 0%, ${rgba} ${coverage}%, transparent 100%)` };
  }
  return { background: `linear-gradient(to top, ${rgba} 0%, ${rgba} ${coverage}%, transparent 100%)` };
}

function heroElementStyle(point: { x: number; y: number }): React.CSSProperties {
  return {
    position: 'absolute',
    left: `${point.x}%`,
    top: `${point.y}%`,
    transform: 'translate(-50%, -50%)',
  };
}

export default function PublicPageView({ blocks, gifts, messages, settings, theme = {} }: PublicPageViewProps) {
  const primaryColor = theme.primary_color || '#C86E52'; // icones
  const titleColor = theme.title_color || theme.secondary_color || '#8E3D2C';
  const captionColor = theme.caption_color || '#5F4A41';
  const dividerColor = theme.divider_color || titleColor;
  const dividerEnabled = theme.divider_enabled !== false;
  const dividerStyle = theme.divider_style || 'dot';
  const backgroundColor = theme.background_color || '#FAF4EF';
  const backgroundImage = theme.background_image || '';
  const overlayPercent = Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)));
  const themeOverlay = toRgba(backgroundColor, overlayPercent / 100);
  const fontTitle = theme.font_title || 'Cormorant Garamond';
  const fontBody = theme.font_body || 'Inter';
  const header = theme.header || {};
  const pageBackgroundStyle: React.CSSProperties = backgroundImage
    ? {
        backgroundColor,
        backgroundImage: `linear-gradient(${themeOverlay}, ${themeOverlay}), url(${backgroundImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }
    : { backgroundColor };

  const listSlug = settings?.slug ? String(settings.slug) : '';
  const isTemplatePreview = Boolean(settings?.isTemplatePreview);
  const templatePreviewSlug = settings?.templatePreviewSlug ? String(settings.templatePreviewSlug) : '';
  const presentsHref = listSlug ? `/site/${encodeURIComponent(listSlug)}/presentes` : '/site/presentes';
  const templatePresentsPreviewHref = templatePreviewSlug
    ? `/templates/${encodeURIComponent(templatePreviewSlug)}/presentes`
    : '/templates';
  const rsvpHref = listSlug ? `/site/${encodeURIComponent(listSlug)}/confirmar-presenca` : '#';
  const meuSiteHref = header.menuMeuSiteUrl || '';
  const giftsMenuHref = header.menuGiftsUrl || '';
  const rsvpMenuHref = header.menuRsvpUrl || '';
  const mapMenuHref = toExternalMapUrl(header.menuMapUrl || '');

  const enabledBlocks = blocks.filter((block) => block.enabled).sort((a, b) => a.order - b.order);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);

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
  const menuRsvp = String(header.menuRsvp || 'Confirmar Presença').toUpperCase();
  const menuMap = String(header.menuMap || 'Como Chegar').toUpperCase();

  return (
    <div
      id="meu-site"
      className="list-font-scope"
      style={
        {
          ['--list-font-title' as any]: `"${fontTitle}"`,
          ['--list-font-body' as any]: `"${fontBody}"`,
          ['--lp-divider-color' as any]: toRgba(dividerColor, 0.42),
          ...pageBackgroundStyle,
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

            {!isTemplatePreview ? (
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
            ) : <div />}

            {!isTemplatePreview ? (
              <button className="md:hidden" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Abrir menu">
                {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            ) : <div />}
          </div>

          {!isTemplatePreview && mobileMenuOpen && (
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

      {enabledBlocks.map((block, index) => {
        const config = block.config || {};
        const sectionClass = 'lp-section';
        const showDivider = dividerEnabled && index > 0 && enabledBlocks[index - 1]?.type !== 'hero';

        return (
          <div key={block.id}>
            {showDivider && <div className={`lp-divider lp-divider-${dividerStyle}`} aria-hidden="true" />}
            {block.type === 'hero' && (
              <div className="relative text-white">
                {config.backgroundImage ? (
                  <div className="relative w-full bg-black/20">
                    <img
                      src={config.backgroundImage}
                      alt={config.title || 'Capa do evento'}
                      className="w-full aspect-[16/9] object-cover md:aspect-auto md:h-[78vh]"
                    />
                    {getHeroOverlayStyle(config) && <div className="absolute inset-0" style={getHeroOverlayStyle(config) as React.CSSProperties} />}
                    {config.logo && (
                      <div className="absolute top-8 left-8 z-10">
                        <img src={config.logo} alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute inset-0 z-10 p-6 md:p-10">
                      {config.label && (
                        <p
                          className="text-xs md:text-sm opacity-90 tracking-[0.3em] uppercase text-center whitespace-pre-wrap"
                          style={heroElementStyle(getHeroPoint(config, 'label'))}
                        >
                          {config.label}
                        </p>
                      )}
                      <h1
                        className="text-4xl md:text-7xl font-bold text-center whitespace-pre leading-[1.05] max-w-none"
                        style={{ ...heroElementStyle(getHeroPoint(config, 'title')), fontFamily: fontTitle }}
                      >
                        {config.title || 'Meu Evento Especial'}
                      </h1>
                      {config.subtitle && (
                        <p
                          className="text-lg md:text-2xl opacity-90 text-center whitespace-pre-wrap max-w-[90%] md:max-w-[75%]"
                          style={heroElementStyle(getHeroPoint(config, 'subtitle'))}
                        >
                          {config.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative min-h-[420px] md:min-h-[600px]"
                    style={{ background: `linear-gradient(135deg, ${titleColor} 0%, ${primaryColor} 100%)` }}
                  >
                    {getHeroOverlayStyle(config) && <div className="absolute inset-0" style={getHeroOverlayStyle(config) as React.CSSProperties} />}
                    {config.logo && (
                      <div className="absolute top-8 left-8 z-10">
                        <img src={config.logo} alt="Logo" className="h-16 w-auto object-contain drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute inset-0 z-10 p-6 md:p-10">
                      {config.label && (
                        <p
                          className="text-xs md:text-sm opacity-90 tracking-[0.3em] uppercase text-center whitespace-pre-wrap"
                          style={heroElementStyle(getHeroPoint(config, 'label'))}
                        >
                          {config.label}
                        </p>
                      )}
                      <h1
                        className="text-4xl md:text-7xl font-bold text-center whitespace-pre leading-[1.05] max-w-none"
                        style={{ ...heroElementStyle(getHeroPoint(config, 'title')), fontFamily: fontTitle }}
                      >
                        {config.title || 'Meu Evento Especial'}
                      </h1>
                      {config.subtitle && (
                        <p
                          className="text-lg md:text-2xl opacity-90 text-center whitespace-pre-wrap max-w-[90%] md:max-w-[75%]"
                          style={heroElementStyle(getHeroPoint(config, 'subtitle'))}
                        >
                          {config.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {block.type === 'message' && (
              <div className={`${sectionClass} p-12 md:p-20 text-center`}>
                {(() => {
                  const signatureAlign = config.signatureAlign || 'center';
                  const signatureClass =
                    signatureAlign === 'left'
                      ? 'text-left'
                      : signatureAlign === 'right'
                      ? 'text-right'
                      : 'text-center';
                  return (
                    <>
                  <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: fontTitle, color: titleColor }}>
                    {config.title || 'Nossa Historia'}
                  </h2>
                  <p className="text-base md:text-lg mb-4 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap" style={{ color: captionColor }}>
                    {config.message || 'Escreva aqui uma mensagem especial para seus convidados.'}
                  </p>
                  {config.signature && (
                    <div className="max-w-3xl mx-auto">
                      <p className={`italic mt-8 text-lg ${signatureClass}`} style={{ color: captionColor }}>
                        {config.signature}
                      </p>
                    </div>
                  )}
                    </>
                  );
                })()}
              </div>
            )}

            {block.type === 'countdown' && config.eventDate && (
              <div className={`${sectionClass} p-6 md:p-16`}>
                <h3 className="text-2xl md:text-3xl text-center mb-6 md:mb-10" style={{ fontFamily: fontTitle, color: titleColor }}>
                  {config.title || 'Contagem Regressiva'}
                </h3>
                <div className="flex flex-nowrap gap-2 md:gap-4 max-w-3xl mx-auto">
                  {[
                    { value: countdown.days, label: 'Dias' },
                    { value: countdown.hours, label: 'Horas' },
                    { value: countdown.minutes, label: 'Minutos' },
                    { value: countdown.seconds, label: 'Segundos' },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 min-w-0 text-center p-2 md:p-6 bg-white rounded-xl md:rounded-2xl shadow-sm">
                      <div className="text-2xl md:text-5xl font-bold mb-1 md:mb-2" style={{ color: primaryColor }}>
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs md:text-sm uppercase tracking-wider" style={{ color: captionColor }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {block.type === 'gifts' && (
              <div id="lista-presentes-section" className={`${sectionClass} p-3 md:p-16`}>
                <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-gray-200">
                  <div className="relative h-[360px] md:h-[420px]">
                    {config.coverImage ? (
                      <img src={config.coverImage} alt="Lista de presentes" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-700" />
                    )}
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute left-5 right-5 bottom-5 md:left-8 md:right-8 md:bottom-8">
                      <h2 className="text-2xl md:text-4xl mb-2 md:mb-3" style={{ fontFamily: fontTitle, color: config.titleColor || '#FFFFFF' }}>
                        {config.title || 'Lista de Presentes'}
                      </h2>
                      <p className="max-w-2xl mb-4 md:mb-5 text-sm md:text-base" style={{ color: config.descriptionColor || 'rgba(255,255,255,0.9)' }}>
                        {config.description || 'Esta é nossa lista de presentes. Ficamos felizes em compartilhar esse momento com você.'}
                      </p>
                      {isTemplatePreview ? (
                        <Link
                          href={templatePresentsPreviewHref}
                          className="inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-110 hover:saturate-125"
                          style={{
                            backgroundColor: config.buttonBgColor || primaryColor,
                            color: config.buttonTextColor || '#FFFFFF',
                          }}
                        >
                          {config.buttonText || 'Presentear'}
                        </Link>
                      ) : (
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
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'messages' && config.showPublicly !== false && (
              <div className={`${sectionClass} p-6 md:p-16`}>
                <h2 className="text-2xl md:text-4xl text-center mb-6 md:mb-12" style={{ fontFamily: fontTitle, color: titleColor }}>
                  {config.title || 'Recados Especiais'}
                </h2>
                <div className="grid grid-cols-1 gap-3 md:gap-6 max-w-5xl mx-auto">
                  {messages
                    .filter((m) => m.isPublic)
                    .slice(0, showAllMessages ? undefined : 4)
                    .map((msg, i) => (
                      <Card key={i} className="p-4 md:p-6 bg-white">
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                            {msg.guestName?.charAt(0) || '•'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base text-gray-900">{msg.guestName}</h4>
                            <p className="text-xs" style={{ color: captionColor }}>{new Date(msg.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {msg.isFavorite && <Heart className="w-5 h-5 text-red-500 fill-red-500" />}
                        </div>
                        <p className="leading-relaxed text-sm md:text-base" style={{ color: captionColor }}>{msg.message}</p>
                      </Card>
                    ))}
                </div>
                {messages.filter((m) => m.isPublic).length > 4 && (
                  <div className="mt-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-4 text-sm"
                      onClick={() => setShowAllMessages((v) => !v)}
                    >
                      {showAllMessages ? 'Ver menos' : 'Ver mais'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {block.type === 'gallery' && config.images && config.images.length > 0 && (
              <div className={`${sectionClass} p-12 md:p-16`}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: titleColor }}>
                  {config.title || 'Galeria de Fotos'}
                </h2>
                <div className="gallery-slider-mask max-w-6xl mx-auto">
                  <div className="gallery-slider-track" style={{ animationDuration: '90s' }}>
                    {[...config.images, ...config.images].map((img: string, i: number) => (
                      <div key={i} className="gallery-slide-item">
                        <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {block.type === 'event-info' && (
              <div id="como-chegar-section" className={`${sectionClass} p-12 md:p-16`}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: titleColor }}>
                  {config.title || 'Informações do Evento'}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                  {config.datetime && (
                    <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                        <Calendar className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-base mb-2" style={{ color: captionColor }}>Data e Hora</p>
                        <p className="text-lg" style={{ color: captionColor }}>
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
                        <p className="font-medium text-base mb-2" style={{ color: captionColor }}>{config.location || 'Local do Evento'}</p>
                        <p className="mb-3" style={{ color: captionColor }}>{config.address}</p>
                        {config.mapLink && (
                          <a href={config.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: captionColor }}>
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
              <div id="como-chegar-section" className={`${sectionClass} p-12 md:p-16`}>
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: titleColor }}>
                    {config.title || 'Como chegar'}
                  </h2>
                  {config.subtitle && <p className="mb-6" style={{ color: captionColor }}>{config.subtitle}</p>}
                  {config.address && (
                    <p className="mb-4 flex items-center gap-2" style={{ color: captionColor }}>
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
                      <a href={config.externalMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: captionColor }}>
                        <Globe className="w-4 h-4" />
                        Abrir rota no mapa
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'music' && (
              <div className={`${sectionClass} p-12 md:p-16`}>
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: titleColor }}>
                    {config.title || 'Nossa trilha sonora'}
                  </h2>
                  {config.description && <p className="mb-6" style={{ color: captionColor }}>{config.description}</p>}
                  {config.spotifyUrl ? (
                    <iframe src={toSpotifyEmbedUrl(config.spotifyUrl)} width="100%" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="rounded-2xl" />
                  ) : config.youtubeUrl ? (
                    <iframe src={toYoutubeEmbedUrl(config.youtubeUrl)} width="100%" height="360" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-2xl border border-gray-200" />
                  ) : (
                    <div className="h-36 rounded-2xl bg-white border border-gray-200 flex items-center justify-center gap-2" style={{ color: captionColor }}>
                      <Music2 className="w-4 h-4" /> Configure Spotify ou YouTube no editor
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'video' && (
              <div className={`${sectionClass} p-12 md:p-16`}>
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: fontTitle, color: titleColor }}>
                    {config.title || 'Nosso video'}
                  </h2>
                  {config.description && <p className="mb-6" style={{ color: captionColor }}>{config.description}</p>}
                  {config.videoUrl ? (
                    <iframe src={toYoutubeEmbedUrl(config.videoUrl)} width="100%" height="460" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-2xl border border-gray-200" />
                  ) : (
                    <div className="h-[280px] rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center gap-2" style={{ color: captionColor }}>
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



