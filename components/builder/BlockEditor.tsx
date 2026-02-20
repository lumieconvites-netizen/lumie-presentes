'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Trash2, Upload, X, Plus } from 'lucide-react';

interface BlockEditorProps {
  block: any;
  onUpdate: (config: any) => void;
  onDelete: () => void;
  list: any;
}

export default function BlockEditor({ block, onUpdate, onDelete }: BlockEditorProps) {
  const config = block.config || {};
  const [uploading, setUploading] = useState(false);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);

  const handleChange = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  // ===============================
  // Upload real (Supabase via /api/upload)
  // ===============================
  const uploadToServer = async (file: File, folder: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);

    const res = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: form,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) throw new Error(data?.error ?? 'Falha no upload');

    return data.url as string;
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // pastas organizadas no bucket
      const folder =
        key === 'logo' ? 'logo' : key === 'backgroundImage' ? 'background' : 'uploads';

      const url = await uploadToServer(file, folder);
      handleChange(key, url);
    } catch (err: any) {
      // fallback local sem storage externo
      const dataUrl = await fileToDataUrl(file);
      handleChange(key, dataUrl);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];

      // faz upload 1 a 1 (mais seguro e simples)
      for (const file of files) {
        try {
          const url = await uploadToServer(file, 'gallery');
          uploaded.push(url);
        } catch {
          const dataUrl = await fileToDataUrl(file);
          uploaded.push(dataUrl);
        }
      }

      const currentImages = config.images || [];
      handleChange('images', [...currentImages, ...uploaded]);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? 'Erro ao enviar imagens');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const images = [...(config.images || [])];
    images.splice(index, 1);
    handleChange('images', images);
  };

  const reorderGalleryImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const images = [...(config.images || [])];
    if (!images[fromIndex] || !images[toIndex]) return;
    const [moved] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, moved);
    handleChange('images', images);
  };

  return (
    <div className="space-y-6">
      {/* Hero Block */}
      {block.type === 'hero' && (
        <>
          <div>
            <Label className="text-sm font-medium">Label (texto pequeno acima)</Label>
            <Input
              value={config.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Ex: Convite Especial"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: 15 anos da Maria"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">SubtÃ­tulo</Label>
            <Input
              value={config.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Ex: 10 de marÃ§o de 2026"
              className="mt-2"
            />
          </div>

          <div className="space-y-4 rounded-lg border border-[#ead9cd] bg-white p-3">
            <p className="text-sm font-medium">Posicao individual dos textos</p>

            <div>
              <Label className="text-xs text-gray-600">Label horizontal ({Math.min(100, Math.max(0, Number(config.labelX ?? 50)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.labelX ?? 50)))}
                onChange={(e) => handleChange('labelX', Number(e.target.value))}
                className="mt-1 w-full"
              />
              <Label className="text-xs text-gray-600">Label vertical ({Math.min(100, Math.max(0, Number(config.labelY ?? 34)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.labelY ?? 34)))}
                onChange={(e) => handleChange('labelY', Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600">Titulo horizontal ({Math.min(100, Math.max(0, Number(config.titleX ?? 50)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.titleX ?? 50)))}
                onChange={(e) => handleChange('titleX', Number(e.target.value))}
                className="mt-1 w-full"
              />
              <Label className="text-xs text-gray-600">Titulo vertical ({Math.min(100, Math.max(0, Number(config.titleY ?? 44)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.titleY ?? 44)))}
                onChange={(e) => handleChange('titleY', Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600">Subtitulo horizontal ({Math.min(100, Math.max(0, Number(config.subtitleX ?? 50)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.subtitleX ?? 50)))}
                onChange={(e) => handleChange('subtitleX', Number(e.target.value))}
                className="mt-1 w-full"
              />
              <Label className="text-xs text-gray-600">Subtitulo vertical ({Math.min(100, Math.max(0, Number(config.subtitleY ?? 56)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.subtitleY ?? 56)))}
                onChange={(e) => handleChange('subtitleY', Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>

          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white px-3 py-2">
            <span className="text-sm text-gray-700">Overlay sobre a imagem</span>
            <Switch
              checked={config.overlayEnabled !== false}
              onCheckedChange={(checked) => handleChange('overlayEnabled', checked)}
            />
          </div>

          {config.overlayEnabled !== false && (
            <>
              <div>
                <Label className="text-sm font-medium">Modo do overlay</Label>
                <select
                  value={config.overlayMode || 'full'}
                  onChange={(e) => handleChange('overlayMode', e.target.value)}
                  className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="full">Cobrir imagem toda</option>
                  <option value="gradient">Degrade parcial</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium">Cor do overlay</Label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={config.overlayColor || '#000000'}
                    onChange={(e) => handleChange('overlayColor', e.target.value)}
                    className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
                  />
                  <Input
                    value={config.overlayColor || '#000000'}
                    onChange={(e) => handleChange('overlayColor', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Transparência do overlay ({Math.min(100, Math.max(0, Number(config.overlayOpacity ?? 20)))}%)
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(0, Number(config.overlayOpacity ?? 20)))}
                  onChange={(e) => handleChange('overlayOpacity', Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>

              {config.overlayMode === 'gradient' && (
                <>
                  <div>
                    <Label className="text-sm font-medium">Direcao do degrade</Label>
                    <select
                      value={config.overlayDirection || 'bottom'}
                      onChange={(e) => handleChange('overlayDirection', e.target.value)}
                      className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="bottom">De baixo para cima</option>
                      <option value="top">De cima para baixo</option>
                      <option value="left">Da esquerda para direita</option>
                      <option value="right">Da direita para esquerda</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Cobertura do degrade ({Math.min(100, Math.max(10, Number(config.overlayCoverage ?? 55)))}%)
                    </Label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={1}
                      value={Math.min(100, Math.max(10, Number(config.overlayCoverage ?? 55)))}
                      onChange={(e) => handleChange('overlayCoverage', Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Logo Upload */}
          <div>
            <Label className="text-sm font-medium">Logo (opcional)</Label>

            {config.logo ? (
              <div className="mt-2 relative">
                <img
                  src={config.logo}
                  alt="Logo"
                  className="w-full h-24 object-contain bg-gray-100 rounded-lg p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleChange('logo', '')}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">
                  {uploading ? 'Enviando...' : 'Enviar logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Background Image */}
          <div>
            <Label className="text-sm font-medium">Imagem de Fundo</Label>

            {config.backgroundImage ? (
              <div className="mt-2 relative">
                <img
                  src={config.backgroundImage}
                  alt="Background"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleChange('backgroundImage', '')}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {uploading ? 'Enviando...' : 'Enviar imagem'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'backgroundImage')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </>
      )}

      {/* Message Block */}
      {block.type === 'message' && (
        <>
          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || 'Nossa HistÃ³ria'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Mensagem</Label>
            <Textarea
              value={config.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Escreva sua mensagem para os convidados..."
              rows={6}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Assinatura</Label>
            <Input
              value={config.signature || ''}
              onChange={(e) => handleChange('signature', e.target.value)}
              placeholder="Ex: â€” Com amor, Maria e JoÃ£o"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Alinhamento da assinatura</Label>
            <select
              value={config.signatureAlign || 'center'}
              onChange={(e) => handleChange('signatureAlign', e.target.value)}
              className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </div>
        </>
      )}

      {/* Countdown Block */}
      {block.type === 'countdown' && (
        <>
          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || 'Falta Pouco!'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <DateTimePicker
            label="Data do Evento"
            value={config.eventDate || ''}
            onChange={(value) => handleChange('eventDate', value)}
          />
        </>
      )}

      {/* Gallery Block */}
      {block.type === 'gallery' && (
        <>
          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || 'Galeria de Fotos'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Fotos</Label>

            <div className="mt-2 grid grid-cols-3 gap-2">
              {(config.images || []).map((img: string, index: number) => (
                <div
                  key={index}
                  className={`relative group ${dragImageIndex === index ? 'opacity-60' : ''}`}
                  draggable
                  onDragStart={() => setDragImageIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragImageIndex === null) return;
                    reorderGalleryImages(dragImageIndex, index);
                    setDragImageIndex(null);
                  }}
                  onDragEnd={() => setDragImageIndex(null)}
                >
                  <img
                    src={img}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">
                  {uploading ? 'Enviando...' : 'Adicionar'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

        </>
      )}

      {/* Event Info Block */}
      {block.type === 'event-info' && (
        <>
          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || 'InformaÃ§Ãµes do Evento'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <DateTimePicker
            label="Data e Hora"
            value={config.datetime || ''}
            onChange={(value) => handleChange('datetime', value)}
          />

          <div>
            <Label className="text-sm font-medium">Local</Label>
            <Input
              value={config.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Ex: EspaÃ§o Villa Bella"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">EndereÃ§o</Label>
            <Input
              value={config.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ex: Rua das Flores, 123"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Link do Mapa</Label>
            <Input
              value={config.mapLink || ''}
              onChange={(e) => handleChange('mapLink', e.target.value)}
              placeholder="Cole o link do Google Maps"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Texto do Botao de mapa</Label>
            <Input
              value={config.mapButtonText || 'Abrir no mapa'}
              onChange={(e) => handleChange('mapButtonText', e.target.value)}
              className="mt-2"
            />
          </div>
        </>
      )}

      {/* Map Block */}
      {block.type === 'map' && (
        <>
          <div>
            <Label className="text-sm font-medium">Titulo</Label>
            <Input
              value={config.title || 'Como chegar'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Subtitulo</Label>
            <Input
              value={config.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Ex: Estacionamento no local"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Endereco</Label>
            <Input
              value={config.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, numero, bairro, cidade"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">URL embed do mapa</Label>
            <Input
              value={config.embedUrl || ''}
              onChange={(e) => handleChange('embedUrl', e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Link externo (Maps/Waze)</Label>
            <Input
              value={config.externalMapUrl || ''}
              onChange={(e) => handleChange('externalMapUrl', e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="mt-2"
            />
          </div>
        </>
      )}

      {/* Music Block */}
      {block.type === 'music' && (
        <>
          <div>
            <Label className="text-sm font-medium">Titulo</Label>
            <Input
              value={config.title || 'Nossa trilha sonora'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Descricao</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-2"
              placeholder="Uma musica especial para esse momento"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Link Spotify (playlist/faixa)</Label>
            <Input
              value={config.spotifyUrl || ''}
              onChange={(e) => handleChange('spotifyUrl', e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Link YouTube (opcional)</Label>
            <Input
              value={config.youtubeUrl || ''}
              onChange={(e) => handleChange('youtubeUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-2"
            />
          </div>
        </>
      )}

      {/* Video Block */}
      {block.type === 'video' && (
        <>
          <div>
            <Label className="text-sm font-medium">Titulo</Label>
            <Input
              value={config.title || 'Nosso video'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Descricao</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">URL do video</Label>
            <Input
              value={config.videoUrl || ''}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              placeholder="YouTube, Vimeo ou embed"
              className="mt-2"
            />
          </div>
        </>
      )}

      {/* Messages Feed Block */}
      {block.type === 'messages' && (
        <>
          <div>
            <Label className="text-sm font-medium">TÃ­tulo</Label>
            <Input
              value={config.title || 'Recados Especiais'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Exibir Publicamente</Label>
              <p className="text-xs text-gray-500">Mostrar recados na pÃ¡gina</p>
            </div>
            <Switch
              checked={config.showPublicly !== false}
              onCheckedChange={(checked) => handleChange('showPublicly', checked)}
            />
          </div>
        </>
      )}

            {/* Gifts Block */}
      {block.type === 'gifts' && (
        <>
          <div>
            <Label className="text-sm font-medium">Titulo</Label>
            <Input
              value={config.title || 'Lista de Presentes'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Texto da secao</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="mt-2"
              placeholder="Escreva um convite para os convidados acessarem a lista"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Imagem da lista (capa)</Label>
            {config.coverImage ? (
              <div className="mt-2 relative">
                <img src={config.coverImage} alt="Capa da lista" className="w-full h-40 object-cover rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleChange('coverImage', '')}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{uploading ? 'Enviando...' : 'Enviar imagem'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'coverImage')}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Texto do botao</Label>
            <Input
              value={config.buttonText || 'Presentear'}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do titulo</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.titleColor || '#FFFFFF'}
                onChange={(e) => handleChange('titleColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.titleColor || '#FFFFFF'} onChange={(e) => handleChange('titleColor', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do texto</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.descriptionColor || '#F5F5F5'}
                onChange={(e) => handleChange('descriptionColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.descriptionColor || '#F5F5F5'} onChange={(e) => handleChange('descriptionColor', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do botao</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.buttonBgColor || '#C86E52'}
                onChange={(e) => handleChange('buttonBgColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.buttonBgColor || '#C86E52'} onChange={(e) => handleChange('buttonBgColor', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do texto do botao</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.buttonTextColor || '#FFFFFF'}
                onChange={(e) => handleChange('buttonTextColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.buttonTextColor || '#FFFFFF'} onChange={(e) => handleChange('buttonTextColor', e.target.value)} />
            </div>
          </div>

        </>
      )}

      {/* Delete Button */}
      {block.type !== 'gifts' && (
        <div className="pt-4 border-t">
          <Button variant="destructive" className="w-full" onClick={onDelete} disabled={uploading}>
            <Trash2 className="w-4 h-4 mr-2" />
            Remover Bloco
          </Button>
        </div>
      )}
    </div>
  );
}



