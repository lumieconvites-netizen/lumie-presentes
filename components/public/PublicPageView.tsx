'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, MapPin, Globe, Heart } from 'lucide-react';
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

export default function PublicPageView({ blocks, gifts, messages, settings, theme = {} }: PublicPageViewProps) {
  const primaryColor = theme.primary_color || '#C86E52';
  const secondaryColor = theme.secondary_color || '#8E3D2C';
  const backgroundColor = theme.background_color || '#FAF4EF';
  const fontTitle = theme.font_title || 'Cormorant Garamond';
  const fontBody = theme.font_body || 'Inter';

  const enabledBlocks = blocks
    .filter((block) => block.enabled)
    .sort((a, b) => a.order - b.order);

  // Countdown timer
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

  return (
    <div
      className="list-font-scope"
      style={
        {
          ['--list-font-title' as any]: `"${fontTitle}"`,
          ['--list-font-body' as any]: `"${fontBody}"`,
        } as React.CSSProperties
      }
    >
      {enabledBlocks.map((block) => {
        const config = block.config || {};

        return (
          <div key={block.id}>
            {/* Hero Block */}
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

                <div className="relative text-center z-10 px-6 max-w-4xl">
                  {config.label && (
                    <p className="text-sm mb-3 opacity-90 tracking-[0.3em] uppercase">{config.label}</p>
                  )}
                  <h1 className="text-5xl md:text-7xl mb-4 font-bold" style={{ fontFamily: fontTitle }}>
                    {config.title || 'Meu Evento Especial'}
                  </h1>
                  {config.subtitle && <p className="text-xl md:text-2xl mb-8 opacity-90">{config.subtitle}</p>}
                  {config.buttonText && (
                    <Button
                      size="lg"
                      className="bg-white hover:bg-gray-100"
                      style={{ color: primaryColor }}
                      onClick={() => {
                        const giftsSection = document.getElementById('gifts-section');
                        giftsSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {config.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Message Block */}
            {block.type === 'message' && (
              <div className="p-12 md:p-20 text-center bg-white">
                <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Nossa História'}
                </h2>
                <p className="text-base md:text-lg text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                  {config.message || 'Escreva aqui uma mensagem especial para seus convidados.'}
                </p>
                {config.signature && <p className="text-gray-600 italic mt-8 text-lg">{config.signature}</p>}
              </div>
            )}

            {/* Countdown Block */}
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

            {/* Gifts Block */}
            {block.type === 'gifts' && (
              <div id="gifts-section" className="p-12 md:p-16 bg-white">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: fontTitle, color: primaryColor }}>
                    {config.title || 'Escolha um Presente'}
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Selecione um dos presentes abaixo e contribua para realizar nossos sonhos
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                  {gifts.slice(0, 6).map((gift) => {
                    const isSoldOut = (gift.quantityAvailable ?? 0) <= 0;
                    const isInactive = gift.status === 'inactive';

                    return (
                      <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {gift.photo ? (
                          <img src={gift.photo} alt={gift.title} className="w-full h-48 object-cover" />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Gift className="w-16 h-16 text-gray-300" />
                          </div>
                        )}

                        <div className="p-5">
                          <h4 className="font-semibold text-lg mb-2 truncate">{gift.title}</h4>

                          {gift.description ? (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{gift.description}</p>
                          ) : (
                            <p className="text-sm text-gray-400 mb-3">Sem descrição</p>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-2xl font-bold whitespace-nowrap" style={{ color: primaryColor }}>
                              {formatBRL(Number(gift.value || 0))}
                            </p>

                            {isSoldOut || isInactive ? (
                              <Button
                                size="sm"
                                className="text-white opacity-70 cursor-not-allowed"
                                style={{ backgroundColor: primaryColor }}
                                disabled
                              >
                                {isSoldOut ? 'Esgotado' : 'Indisponível'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                style={{ backgroundColor: primaryColor }}
                                className="text-white"
                                asChild
                              >
                                <Link href={`/checkout/${gift.id}`}>Presentear</Link>
                              </Button>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            Disponível: <b>{gift.quantityAvailable ?? 0}</b> de {gift.quantity ?? 0}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {gifts.length > 6 && (
                  <div className="text-center">
                    <Button
                      size="lg"
                      variant="outline"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                      className="hover:bg-gray-50"
                      asChild
                    >
                      <Link href="/site/presentes">Ver todos os {gifts.length} presentes</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Messages Feed Block */}
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
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
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

            {/* Gallery Block */}
            {block.type === 'gallery' && config.images && config.images.length > 0 && (
              <div className="p-12 md:p-16 bg-white">
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Galeria de Fotos'}
                </h2>
                <div
                  className={`grid ${
                    config.layout === 'masonry' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'
                  } gap-4 max-w-6xl mx-auto`}
                >
                  {config.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl">
                      <img
                        src={img}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Info Block */}
            {block.type === 'event-info' && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ fontFamily: fontTitle, color: primaryColor }}>
                  {config.title || 'Informações do Evento'}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                  {config.datetime && (
                    <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
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
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <MapPin className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2 text-gray-900">{config.location || 'Local do Evento'}</h3>
                        <p className="text-gray-600 mb-3">{config.address}</p>
                        {config.mapLink && (
                          <a
                            href={config.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            <Globe className="w-4 h-4" />
                            Ver no mapa
                          </a>
                        )}
                      </div>
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
