'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, MessageSquare, Calendar, MapPin, Image as ImageIcon, Globe, Clock, Layout } from 'lucide-react';

interface BlockPreviewProps {
  list: any;
  blocks: any[];
  selectedBlock: any;
  onSelectBlock: (block: any) => void;
  gifts: any[];
}

export default function BlockPreview({ list, blocks, selectedBlock, onSelectBlock, gifts }: BlockPreviewProps) {
  const theme = list.theme || {};
  const primaryColor = theme.primary_color || '#C86E52';
  const secondaryColor = theme.secondary_color || '#8E3D2C';
  const backgroundColor = theme.background_color || '#FAF4EF';
  const fontTitle = theme.font_title || 'Cormorant Garamond';
  const fontBody = theme.font_body || 'Inter';

  // Debug
  useEffect(() => {
    console.log('BlockPreview - Theme changed:', theme);
    console.log('BlockPreview - fontTitle:', fontTitle);
    console.log('BlockPreview - fontBody:', fontBody);
  }, [theme, fontTitle, fontBody]);

  // Countdown state
  const [countdown, setCountdown] = useState({ days: 30, hours: 12, minutes: 45, seconds: 20 });

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
          Sua Página Está Vazia
        </h3>
        <p className="text-gray-500 max-w-md mb-6">
          Adicione blocos usando a barra lateral à esquerda para começar a construir sua página de presentes
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
    className="space-y-1 w-full list-font-scope"
    style={
      {
        ["--list-font-title" as any]: `"${fontTitle}"`,
        ["--list-font-body" as any]: `"${fontBody}"`,
      } as React.CSSProperties
    }
  >

      {enabledBlocks.map((block) => {
        const isSelected = selectedBlock?.id === block.id;
        const config = block.config || {};

        return (
          <div
            key={block.id}
            onClick={() => onSelectBlock(block)}
            className={`rounded-xl overflow-hidden cursor-pointer transition-all ${
              isSelected ? 'ring-4 ring-primary ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'
            }`}
          >
            {/* Hero Block */}
            {block.type === 'hero' && (
              <div
                className="relative h-[500px] flex items-center justify-center text-white"
                style={{
                  background: config.backgroundImage
                    ? `url(${config.backgroundImage}) center/cover`
                    : `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`
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
                    <p className="text-sm mb-3 opacity-90 tracking-[0.3em] uppercase">
                      {config.label}
                    </p>
                  )}
                  <h1 
                    className="text-5xl md:text-7xl mb-4 font-bold"
                    style={{ fontFamily: fontTitle }}
                  >
                    {config.title || 'Meu Evento Especial'}
                  </h1>
                  {config.subtitle && (
                    <p className="text-xl md:text-2xl mb-8 opacity-90">
                      {config.subtitle}
                    </p>
                  )}
                  {config.buttonText && (
                    <Button size="lg" className="bg-white hover:bg-gray-100" style={{ color: primaryColor }}>
                      {config.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Message Block */}
            {block.type === 'message' && (
              <div className="p-12 md:p-20 text-center bg-white">
                <h2 
                  className="text-3xl md:text-4xl mb-6" 
                  style={{ color: primaryColor, fontFamily: fontTitle }}
                >
                  {config.title || 'Nossa História'}
                </h2>
                <p className="text-base md:text-lg text-gray-700 mb-4 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                  {config.message || 'Escreva aqui uma mensagem especial para seus convidados. Conte sua história, compartilhe seus sonhos e torne este momento ainda mais especial.'}
                </p>
                {config.signature && (
                  <p className="text-gray-600 italic mt-8 text-lg">{config.signature}</p>
                )}
              </div>
            )}

            {/* Countdown Block */}
            {block.type === 'countdown' && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h3 
                  className="text-2xl md:text-3xl text-center mb-10" 
                  style={{ color: primaryColor, fontFamily: fontTitle }}
                >
                  {config.title || 'Contagem Regressiva'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {[
                    { value: String(countdown.days).padStart(2, '0'), label: 'Dias' },
                    { value: String(countdown.hours).padStart(2, '0'), label: 'Horas' },
                    { value: String(countdown.minutes).padStart(2, '0'), label: 'Minutos' },
                    { value: String(countdown.seconds).padStart(2, '0'), label: 'Segundos' }
                  ].map((item, i) => (
                    <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                      <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: primaryColor }}>
                        {item.value}
                      </div>
                      <div className="text-sm text-gray-600 uppercase tracking-wider">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gifts Block */}
            {block.type === 'gifts' && (
              <div className="p-12 md:p-16 bg-white">
                <div className="text-center mb-12">
                  <h2 
                    className="text-3xl md:text-4xl mb-4" 
                    style={{ color: primaryColor, fontFamily: fontTitle }}
                  >
                    {config.title || 'Escolha um Presente'}
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Selecione um dos presentes abaixo e contribua para realizar nossos sonhos
                  </p>
                </div>
                
                {/* Gifts Grid - Fixed 2 rows x 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
                  {gifts.slice(0, 6).map((gift) => (
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
                        {gift.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{gift.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            R$ {gift.value?.toFixed(2)}
                          </p>
                          <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-white">
                            Presentear
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* See More Button */}
                {gifts.length > 6 && (
                  <div className="text-center">
                    <Button 
                      size="lg"
                      variant="outline"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                      className="hover:bg-gray-50"
                      asChild
                    >
                      <a href="/dashboard/presentes">
                        Ver Todos os {gifts.length} Presentes
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Messages Feed Block */}
            {block.type === 'messages' && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: primaryColor, fontFamily: fontTitle }}>
                  {config.title || 'Recados Especiais'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {[
                    { name: 'Maria Silva', message: 'Parabéns! Que esse dia seja repleto de alegrias e momentos inesquecíveis. 🎉', time: '2 dias atrás' },
                    { name: 'João Santos', message: 'Felicidades! Desejo tudo de melhor nesta nova fase.', time: '3 dias atrás' },
                    { name: 'Ana Costa', message: 'Muitas bênçãos e sucesso! Você merece toda a felicidade do mundo. ❤️', time: '5 dias atrás' },
                    { name: 'Pedro Lima', message: 'Que lindo! Desejo muito amor e prosperidade sempre.', time: '1 semana atrás' }
                  ].map((msg, i) => (
                    <Card key={i} className="p-6 bg-white">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {msg.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{msg.name}</h4>
                          <p className="text-xs text-gray-500">{msg.time}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {msg.message}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Block */}
            {block.type === 'gallery' && (
              <div className="p-12 md:p-16 bg-white">
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: primaryColor, fontFamily: fontTitle }}>
                  {config.title || 'Galeria de Fotos'}
                </h2>
                <div className={`grid ${config.layout === 'masonry' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-4 max-w-6xl mx-auto`}>
                  {(config.images && config.images.length > 0) ? (
                    config.images.map((img: string, i: number) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-xl">
                        <img 
                          src={img} 
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Event Info Block */}
            {block.type === 'event-info' && (
              <div className="p-12 md:p-16" style={{ background: backgroundColor }}>
                <h2 className="text-3xl md:text-4xl text-center mb-12" style={{ color: primaryColor, fontFamily: fontTitle }}>
                  {config.title || 'Informações do Evento'}
                </h2>
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Calendar className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2 text-gray-900">
                        Data e Hora
                      </h3>
                      <p className="text-gray-600 text-lg">
                        {config.datetime 
                          ? new Date(config.datetime).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '10 de março de 2026 às 19:00'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-sm">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                      <MapPin className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2 text-gray-900">
                        {config.location || 'Local do Evento'}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {config.address || 'Endereço será informado em breve'}
                      </p>
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
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
