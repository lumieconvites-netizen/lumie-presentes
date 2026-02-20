'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Image as ImageIcon, Globe, Layout, Music2, Video } from 'lucide-react';

interface BlockPreviewProps {
  list: any;
  blocks: any[];
  selectedBlock: any;
  onSelectBlock: (block: any) => void;
  gifts: any[];
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

export default function BlockPreview({ list, blocks, selectedBlock, onSelectBlock, gifts }: BlockPreviewProps) {
  const theme = list.theme || {};
  const primaryColor = theme.primary_color || '#C86E52'; // icones
  const titleColor = theme.title_color || theme.secondary_color || '#8E3D2C';
  const captionColor = theme.caption_color || '#5F4A41';
  const dividerColor = theme.divider_color || titleColor;
  const dividerEnabled = theme.divider_enabled !== false;
  const dividerStyle = theme.divider_style || 'dot';
  const backgroundColor = theme.background_color || '#FAF4EF';
  const backgroundImage = theme.background_image || '';
  const fontTitle = theme.font_title || 'Cormorant Garamond';
  const fontBody = theme.font_body || 'Inter';
  const overlayPercent = Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)));
  const themeOverlay = toRgba(backgroundColor, overlayPercent / 100);
  const pageBackgroundStyle: React.CSSProperties = backgroundImage
    ? {
        backgroundColor,
        backgroundImage: `linear-gradient(${themeOverlay}, ${themeOverlay}), url(${backgroundImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }
    : { backgroundColor };


  const toYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
    const long = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (long?.[1]) return `https://www.youtube.com/embed/${long[1]}`;
    return url;
  };

  const toSpotifyEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('open.spotify.com/embed/')) return url;
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  };

  const toGoogleMapsEmbed = (url: string) => {
    if (!url) return '';
    if (url.includes('/maps/embed')) return url;
    const place = encodeURIComponent(url);
    return `https://www.google.com/maps?q=${place}&output=embed`;
  };

  const getHeroPosition = (position: string) => {
    const map: Record<string, { justify: React.CSSProperties['justifyContent']; align: React.CSSProperties['alignItems']; text: React.CSSProperties['textAlign'] }> = {
      center: { justify: 'center', align: 'center', text: 'center' },
      'top-left': { justify: 'flex-start', align: 'flex-start', text: 'left' },
      'top-center': { justify: 'flex-start', align: 'center', text: 'center' },
      'top-right': { justify: 'flex-start', align: 'flex-end', text: 'right' },
      'middle-left': { justify: 'center', align: 'flex-start', text: 'left' },
      'middle-right': { justify: 'center', align: 'flex-end', text: 'right' },
      'bottom-left': { justify: 'flex-end', align: 'flex-start', text: 'left' },
      'bottom-center': { justify: 'flex-end', align: 'center', text: 'center' },
      'bottom-right': { justify: 'flex-end', align: 'flex-end', text: 'right' },
    };
    return map[position] || map.center;
  };

  // Countdown state
  const [countdown, setCountdown] = useState({ days: 30, hours: 12, minutes: 45, seconds: 20 });
  const [showAllMessages, setShowAllMessages] = useState(false);

  const enabledBlocks = useMemo(() => 
    blocks
      .filter(block => block.enabled)
      .sort((a, b) => a.order - b.order),
    [blocks]
  );

  // Get countdown event date
  const eventDate = useMemo(() => {
    const countdownBlock = enabledBlocks.find(b => b.type === 'countdown');
    return countdownBlock?.config?.eventDate;
  }, [enabledBlocks]);

  // Real-time countdown
  useEffect(() => {
    if (!eventDate) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(eventDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  if (enabledBlocks.length === 0) {
    return (
      <div className="w-full h-[600px] rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300">
        <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
          <Layout className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-3">
          Sua PÃ¡gina EstÃ¡ Vazia
        </h3>
        <p className="text-gray-500 max-w-md mb-6">
          Adicione blocos usando a barra lateral Ã  esquerda para comeÃ§ar a construir sua pÃ¡gina de presentes
        </p>
        <div className="flex gap-2 text-sm text-gray-400">
          <span className="px-3 py-1 bg-white rounded-full">Capa</span>
          <span className="px-3 py-1 bg-white rounded-full">Lista de Presentes</span>
          <span className="px-3 py-1 bg-white rounded-full">Galeria</span>
        </div>
      </div>
    );
  }

  return (
  <div
    className="space-y-1 w-full list-font-scope pb-10"
    style={
      {
        ["--list-font-title" as any]: `"${fontTitle}"`,
        ["--list-font-body" as any]: `"${fontBody}"`,
        ["--lp-divider-color" as any]: toRgba(dividerColor, 0.42),
        ...pageBackgroundStyle,
      } as React.CSSProperties
    }
  >
      {enabledBlocks.map((block, index) => {
        const isSelected = selectedBlock?.id === block.id;
        const config = block.config || {};
        const sectionClass = 'lp-section';
        const showDivider = dividerEnabled && index > 0 && enabledBlocks[index - 1]?.type !== 'hero';

        return (
          <div key={block.id}>
            {showDivider && <div className={`lp-divider lp-divider-${dividerStyle}`} aria-hidden="true" />}
            <div
              onClick={() => onSelectBlock(block)}
              className={`rounded-xl overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'ring-4 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
            {/* Hero Block */}
            {block.type === 'hero' && (
              <div
                className="relative h-[500px] text-white"
                style={{
                  background: config.backgroundImage
                    ? `url(${config.backgroundImage}) center/cover`
                    : `linear-gradient(135deg, ${titleColor} 0%, ${primaryColor} 100%)`
                }}
              >
                {config.overlayEnabled !== false && (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: toRgba(config.overlayColor || '#000000', Math.min(100, Math.max(0, Number(config.overlayOpacity ?? 20))) / 100) }}
                  />
                )}
                
                {/* Logo */}
                {config.logo && (
                  <div className="absolute top-8 left-8 z-10">
                    <img 
                      src={config.logo} 
                      alt="Logo" 
                      className="h-16 w-auto object-contain drop-shadow-lg"
                    />
                  </div>
                )}
                
                <div
                  className="absolute inset-0 z-10 flex p-6 md:p-10"
                  style={{
                    justifyContent: getHeroPosition(config.contentPosition || 'center').justify,
                    alignItems: getHeroPosition(config.contentPosition || 'center').align,
                    textAlign: getHeroPosition(config.contentPosition || 'center').text,
                  }}
                >
                <div className="w-full max-w-4xl">
                  {config.label && (
                    <p className="text-sm mb-3 opacity-90 tracking-[0.3em] uppercase">
                      {config.label}
                    </p>
                  )}
                  {config.inlineTitleSubtitle && config.subtitle ? (
                    <div className="md:flex md:items-end md:gap-4 md:justify-start">
                      <h1 className="text-4xl md:text-7xl mb-2 md:mb-4 font-bold" style={{ fontFamily: fontTitle }}>
                        {config.title || 'Meu Evento Especial'}
                      </h1>
                      <p className="text-lg md:text-2xl mb-6 md:mb-4 opacity-90">{config.subtitle}</p>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-5xl md:text-7xl mb-4 font-bold" style={{ fontFamily: fontTitle }}>
                        {config.title || 'Meu Evento Especial'}
                      </h1>
                      {config.subtitle && <p className="text-xl md:text-2xl mb-8 opacity-90">{config.subtitle}</p>}
                    </>
                  )}
                  {config.buttonText && (
                    <Button size="lg" className="bg-white hover:bg-gray-100" style={{ color: primaryColor }}>
                      {config.buttonText}
                    </Button>
                  )}
                </div>
                </div>
              </div>
            )}

            {/* Message Block */}
            {block.type === 'message' && (
              <div className={`${sectionClass} p-12 md:p-20 text-center`}>
                <h2 
                  className="text-3xl md:text-4xl mb-6" 
                  style={{ color: titleColor, fontFamily: fontTitle }}
                >
                  {config.title || 'Nossa HistÃ³ria'}
                </h2>
                <p className="text-base md:text-lg mb-4 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap" style={{ color: captionColor }}>
                  {config.message || 'Escreva aqui uma mensagem especial para seus convidados. Conte sua histÃ³ria, compartilhe seus sonhos e torne este momento ainda mais especial.'}
                </p>
                {config.signature && (
                  <p className="italic mt-8 text-lg" style={{ color: captionColor }}>{config.signature}</p>
                )}
              </div>
            )}

            {/* Countdown Block */}
            {block.type === 'countdown' && (
              <div className={`${sectionClass} p-6 md:p-16`}>
                <h3 
                  className="text-2xl md:text-3xl text-center mb-6 md:mb-10" 
                  style={{ color: titleColor, fontFamily: fontTitle }}
                >
                  {config.title || 'Contagem Regressiva'}
                </h3>
                <div className="flex flex-nowrap gap-2 md:gap-4 max-w-3xl mx-auto">
                  {[
                    { value: String(countdown.days).padStart(2, '0'), label: 'Dias' },
                    { value: String(countdown.hours).padStart(2, '0'), label: 'Horas' },
                    { value: String(countdown.minutes).padStart(2, '0'), label: 'Minutos' },
                    { value: String(countdown.seconds).padStart(2, '0'), label: 'Segundos' }
                  ].map((item, i) => (
                    <div key={i} className="flex-1 min-w-0 text-center p-2 md:p-6 bg-white rounded-xl md:rounded-2xl shadow-sm">
                      <div className="text-2xl md:text-5xl font-bold mb-1 md:mb-2" style={{ color: primaryColor }}>
                        {item.value}
                      </div>
                      <div className="text-xs md:text-sm uppercase tracking-wider" style={{ color: captionColor }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gifts Block */}
            {block.type === 'gifts' && (
              <div className={`${sectionClass} p-3 md:p-16`} id="lista-presentes-section">
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
                        {config.description || 'Criamos esta lista com carinho para quem desejar nos presentear.'}
                      </p>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-110 hover:saturate-125"
                        style={{
                          backgroundColor: config.buttonBgColor || primaryColor,
                          color: config.buttonTextColor || '#FFFFFF',
                        }}
                      >
                        {config.buttonText || 'Presentear'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Feed Block */}
            {block.type === 'messages' && (
              <div className={`${sectionClass} p-6 md:p-16`}>
                <h2 className="text-2xl md:text-4xl text-center mb-6 md:mb-12" style={{ color: titleColor, fontFamily: fontTitle }}>
                  {config.title || 'Recados Especiais'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 max-w-5xl mx-auto">
                  {(showAllMessages
                    ? [
                        { name: 'Maria Silva', message: 'ParabÃ©ns! Que esse dia seja repleto de alegrias e momentos inesquecÃ­veis. ðŸŽ‰', time: '2 dias atrÃ¡s' },
                        { name: 'JoÃ£o Santos', message: 'Felicidades! Desejo tudo de melhor nesta nova fase.', time: '3 dias atrÃ¡s' },
                        { name: 'Ana Costa', message: 'Muitas bÃªnÃ§Ã£os e sucesso! VocÃª merece toda a felicidade do mundo. â¤ï¸', time: '5 dias atrÃ¡s' },
                        { name: 'Pedro Lima', message: 'Que lindo! Desejo muito amor e prosperidade sempre.', time: '1 semana atrÃ¡s' }
                      ]
                    : [
                        { name: 'Maria Silva', message: 'ParabÃ©ns! Que esse dia seja repleto de alegrias e momentos inesquecÃ­veis. ðŸŽ‰', time: '2 dias atrÃ¡s' },
                        { name: 'JoÃ£o Santos', message: 'Felicidades! Desejo tudo de melhor nesta nova fase.', time: '3 dias atrÃ¡s' },
                        { name: 'Ana Costa', message: 'Muitas bÃªnÃ§Ã£os e sucesso! VocÃª merece toda a felicidade do mundo. â¤ï¸', time: '5 dias atrÃ¡s' }
                      ]).map((msg, i) => (
                    <Card key={i} className="p-4 md:p-6 bg-white">
                      <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                        <div
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-sm md:text-base font-semibold flex-shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {msg.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm md:text-base text-gray-900">{msg.name}</h4>
                          <p className="text-xs" style={{ color: captionColor }}>{msg.time}</p>
                        </div>
                      </div>
                      <p className="leading-relaxed text-sm md:text-base" style={{ color: captionColor }}>
                        {msg.message}
                      </p>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 text-center md:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-4 text-sm"
                    onClick={() => setShowAllMessages((v) => !v)}
                  >
                    {showAllMessages ? 'Ver menos' : 'Ver mais'}
                  </Button>
                </div>
              </div>
            )}

            {/* Gallery Block */}
            {block.type === 'gallery' && (
              <div className={`${sectionClass} p-12 md:p-16`}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: titleColor, fontFamily: fontTitle }}>
                  {config.title || 'Galeria de Fotos'}
                </h2>
                {(config.images && config.images.length > 0) ? (
                  <div className="gallery-slider-mask max-w-6xl mx-auto">
                    <div className="gallery-slider-track" style={{ animationDuration: '90s' }}>
                      {[...config.images, ...config.images].map((img: string, i: number) => (
                        <div key={i} className="gallery-slide-item">
                          <img
                            src={img}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Event Info Block */}
            {block.type === 'event-info' && (
              <div className={`${sectionClass} p-12 md:p-16`}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: titleColor, fontFamily: fontTitle }}>
                  {config.title || 'InformaÃ§Ãµes do Evento'}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Calendar className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-base mb-2" style={{ color: captionColor }}>
                        Data e Hora
                      </p>
                      <p className="text-lg" style={{ color: captionColor }}>
                        {config.datetime 
                          ? new Date(config.datetime).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '10 de marÃ§o de 2026 Ã s 19:00'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                      <MapPin className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-base mb-2" style={{ color: captionColor }}>
                        {config.location || 'Local do Evento'}
                      </p>
                      <p className="mb-3" style={{ color: captionColor }}>
                        {config.address || 'EndereÃ§o serÃ¡ informado em breve'}
                      </p>
                      {config.mapLink && (
                        <a 
                          href={config.mapLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                          style={{ color: captionColor }}
                        >
                          <Globe className="w-4 h-4" />
                          Ver no mapa
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'map' && (
              <div className={`${sectionClass} p-10 md:p-14`}>
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ color: titleColor, fontFamily: fontTitle }}>
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
                      <iframe
                        src={toGoogleMapsEmbed(config.embedUrl || config.externalMapUrl)}
                        width="100%"
                        height="380"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="h-[280px] bg-gray-100 flex items-center justify-center text-gray-500">
                        Adicione a URL do mapa para exibir aqui
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {block.type === 'music' && (
              <div className={`${sectionClass} p-10 md:p-14`}>
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ color: titleColor, fontFamily: fontTitle }}>
                    {config.title || 'Nossa trilha sonora'}
                  </h2>
                  {config.description && <p className="mb-6" style={{ color: captionColor }}>{config.description}</p>}
                  {config.spotifyUrl ? (
                    <iframe
                      src={toSpotifyEmbedUrl(config.spotifyUrl)}
                      width="100%"
                      height="152"
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      className="rounded-2xl"
                    />
                  ) : config.youtubeUrl ? (
                    <iframe
                      src={toYoutubeEmbedUrl(config.youtubeUrl)}
                      width="100%"
                      height="360"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-2xl"
                    />
                  ) : (
                    <div className="h-36 rounded-2xl bg-white border border-gray-200 flex items-center justify-center gap-2" style={{ color: captionColor }}>
                      <Music2 className="w-4 h-4" /> Adicione Spotify ou YouTube
                    </div>
                  )}
                </div>
              </div>
            )}

            {block.type === 'video' && (
              <div className={`${sectionClass} p-10 md:p-14`}>
                <div className="max-w-5xl mx-auto">
                  <h2 className="text-3xl md:text-4xl mb-2" style={{ color: titleColor, fontFamily: fontTitle }}>
                    {config.title || 'Nosso video'}
                  </h2>
                  {config.description && <p className="mb-6" style={{ color: captionColor }}>{config.description}</p>}
                  {config.videoUrl ? (
                    <iframe
                      src={toYoutubeEmbedUrl(config.videoUrl)}
                      width="100%"
                      height="460"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-2xl border border-gray-200"
                    />
                  ) : (
                    <div className="h-[280px] rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center gap-2" style={{ color: captionColor }}>
                      <Video className="w-4 h-4" /> Adicione URL do video
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

