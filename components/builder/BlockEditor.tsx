'use client';

import { useState, useEffect } from 'react';
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

export default function BlockEditor({ block, onUpdate, onDelete, list }: BlockEditorProps) {
  const config = block.config || {};
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('BlockEditor - Current config:', config);
  }, [config]);

  const handleChange = (key: string, value: any) => {
    console.log('BlockEditor - Updating:', key, value);
    onUpdate({ [key]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    // Simular upload - em produção, usar API real
    const url = URL.createObjectURL(file);
    handleChange(key, url);
    setUploading(false);
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    const urls = files.map(file => URL.createObjectURL(file));
    const currentImages = config.images || [];
    handleChange('images', [...currentImages, ...urls]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const images = [...(config.images || [])];
    images.splice(index, 1);
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: 15 anos da Maria"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Subtítulo</Label>
            <Input
              value={config.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Ex: 10 de março de 2026"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Texto do Botão</Label>
            <Input
              value={config.buttonText || 'Ver Lista de Presentes'}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="mt-2"
            />
          </div>
          
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
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Enviar logo</span>
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
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Enviar imagem</span>
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Nossa História'}
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
              placeholder="Ex: — Com amor, Maria e João"
              className="mt-2"
            />
          </div>
        </>
      )}

      {/* Countdown Block */}
      {block.type === 'countdown' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
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
            <Label className="text-sm font-medium">Título</Label>
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
                <div key={index} className="relative group">
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
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Adicionar</span>
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
          <div>
            <Label className="text-sm font-medium">Layout</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant={config.layout === 'grid' ? 'default' : 'outline'}
                onClick={() => handleChange('layout', 'grid')}
                className="w-full"
              >
                Grade
              </Button>
              <Button
                variant={config.layout === 'masonry' ? 'default' : 'outline'}
                onClick={() => handleChange('layout', 'masonry')}
                className="w-full"
              >
                Mosaico
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Event Info Block */}
      {block.type === 'event-info' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Informações do Evento'}
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
              placeholder="Ex: Espaço Villa Bella"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Endereço</Label>
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
        </>
      )}

      {/* Messages Feed Block */}
      {block.type === 'messages' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Recados Especiais'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm font-medium">Exibir Publicamente</Label>
              <p className="text-xs text-gray-500">Mostrar recados na página</p>
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Escolha um Presente'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Layout</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant={config.layout === 'grid' ? 'default' : 'outline'}
                onClick={() => handleChange('layout', 'grid')}
                className="w-full"
              >
                Grade
              </Button>
              <Button
                variant={config.layout === 'list' ? 'default' : 'outline'}
                onClick={() => handleChange('layout', 'list')}
                className="w-full"
              >
                Lista
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Button */}
      <div className="pt-4 border-t">
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remover Bloco
        </Button>
      </div>
    </div>
  );
}
