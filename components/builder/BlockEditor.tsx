'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Trash2,
  Upload,
  X,
  Plus,
  UserCheck,
  ClipboardCheck,
  Shirt,
  Clock3,
  Users,
  Camera,
  Gift,
  Music2,
  MapPin,
} from 'lucide-react';

interface BlockEditorProps {
  block: any;
  onUpdate: (config: any) => void;
  onDelete: () => void;
  list: any;
}

type GuestGuideIconId =
  | 'none'
  | 'check-user'
  | 'clipboard'
  | 'dress'
  | 'clock'
  | 'couple'
  | 'camera'
  | 'gift'
  | 'music'
  | 'location';

type GuestGuideMediaType = 'none' | 'icon' | 'image';
type GuestGuideItem = {
  title: string;
  description: string;
  icon: GuestGuideIconId;
  image: string;
  mediaType: GuestGuideMediaType;
};
type EventInfoItem = {
  label: string;
  datetime: string;
  location: string;
  address: string;
  mapLink: string;
  mapButtonText: string;
};

const GUEST_GUIDE_ICON_OPTIONS: Array<{ id: GuestGuideIconId; label: string }> = [
  { id: 'none', label: 'Sem ícone' },
  { id: 'check-user', label: 'Confirmação' },
  { id: 'clipboard', label: 'Regras' },
  { id: 'dress', label: 'Traje' },
  { id: 'clock', label: 'Horário' },
  { id: 'couple', label: 'Convidados' },
  { id: 'camera', label: 'Fotos' },
  { id: 'gift', label: 'Presentes' },
  { id: 'music', label: 'Música' },
  { id: 'location', label: 'Local' },
];

function GuestGuideIconPreview({ icon }: { icon: GuestGuideIconId }) {
  const className = 'w-4 h-4';
  if (icon === 'check-user') return <UserCheck className={className} />;
  if (icon === 'clipboard') return <ClipboardCheck className={className} />;
  if (icon === 'dress') return <Shirt className={className} />;
  if (icon === 'clock') return <Clock3 className={className} />;
  if (icon === 'couple') return <Users className={className} />;
  if (icon === 'camera') return <Camera className={className} />;
  if (icon === 'gift') return <Gift className={className} />;
  if (icon === 'music') return <Music2 className={className} />;
  if (icon === 'location') return <MapPin className={className} />;
  return null;
}

export default function BlockEditor({ block, onUpdate, onDelete }: BlockEditorProps) {
  const config = block.config || {};
  const [uploading, setUploading] = useState(false);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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

  const loadImageFromFile = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Não foi possível processar a imagem.'));
      };
      image.src = objectUrl;
    });

  const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha ao processar imagem.'));
          return;
        }
        resolve(blob);
      }, type, quality);
    });

  const normalizeGalleryImageFile = async (file: File) => {
    const image = await loadImageFromFile(file);
    const sourceWidth = Math.max(1, image.naturalWidth || image.width);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height);
    const cropSide = Math.min(sourceWidth, sourceHeight);
    const offsetX = Math.max(0, Math.floor((sourceWidth - cropSide) / 2));
    const offsetY = Math.max(0, Math.floor((sourceHeight - cropSide) / 2));

    const targetSize = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao preparar imagem.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      cropSide,
      cropSide,
      0,
      0,
      targetSize,
      targetSize
    );

    const qualities = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56];
    let bestBlob: Blob | null = null;

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      bestBlob = blob;
      if (blob.size <= MAX_UPLOAD_BYTES) break;
    }

    if (!bestBlob || bestBlob.size > MAX_UPLOAD_BYTES) {
      throw new Error('Não foi possível ajustar a foto para até 5MB. Tente outra imagem.');
    }

    const originalName = file.name.replace(/\.[^/.]+$/, '') || 'foto-galeria';
    return new File([bestBlob], `${originalName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  };

  const readImageDimensions = (file: File) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new window.Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Não foi possível ler as dimensões da imagem.'));
      };
      image.src = objectUrl;
    });

  const validateImageFile = async (
    file: File,
    options?: { label?: string; maxWidth?: number; maxHeight?: number }
  ) => {
    const label = options?.label ?? 'Imagem';
    if (file.size > MAX_UPLOAD_BYTES) {
      alert(`${label} maior que 5MB. Escolha um arquivo de até 5MB.`);
      return false;
    }

    if (options?.maxWidth || options?.maxHeight) {
      try {
        const { width, height } = await readImageDimensions(file);
        const maxWidth = options.maxWidth ?? width;
        const maxHeight = options.maxHeight ?? height;
        if (width > maxWidth || height > maxHeight) {
          alert(`${label} acima do tamanho recomendado (${maxWidth}x${maxHeight}px). Limite do arquivo: 5MB.`);
          return false;
        }
      } catch (error: any) {
        alert(error?.message ?? 'Falha ao validar dimensões da imagem.');
        return false;
      }
    }

    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const valid =
      key === 'logo'
        ? await validateImageFile(file, { label: 'Logo', maxWidth: 500, maxHeight: 500 })
        : await validateImageFile(file, { label: 'Imagem' });
    if (!valid) {
      e.target.value = '';
      return;
    }

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
          const normalizedFile = await normalizeGalleryImageFile(file);
          const url = await uploadToServer(normalizedFile, 'gallery');
          uploaded.push(url);
        } catch {
          try {
            const normalizedFile = await normalizeGalleryImageFile(file);
            const dataUrl = await fileToDataUrl(normalizedFile);
            uploaded.push(dataUrl);
          } catch (error: any) {
            alert(error?.message ?? 'Erro ao ajustar foto da galeria.');
          }
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

  const getGuestGuideItems = (): GuestGuideItem[] => {
    const raw = Array.isArray(config.items) ? config.items : [];
    return raw.map((item: any): GuestGuideItem => {
      const icon = (item?.icon as GuestGuideIconId) || 'none';
      const image = item?.image || '';
      const mediaType: GuestGuideMediaType =
        item?.mediaType === 'icon' || item?.mediaType === 'image' || item?.mediaType === 'none'
          ? item.mediaType
          : image
          ? 'image'
          : icon !== 'none'
          ? 'icon'
          : 'none';

      return {
        title: item?.title || '',
        description: item?.description || '',
        icon,
        image,
        mediaType,
      };
    });
  };

  const updateGuestGuideItems = (items: GuestGuideItem[]) => {
    handleChange('items', items);
  };

  const addGuestGuideItem = () => {
    const items = getGuestGuideItems();
    updateGuestGuideItems([
      ...items,
      { title: `Orientação ${items.length + 1}`, description: '', icon: 'none', image: '', mediaType: 'none' },
    ]);
  };

  const updateGuestGuideItem = (
    index: number,
    key: 'title' | 'description' | 'icon' | 'image' | 'mediaType',
    value: string
  ) => {
    const items = getGuestGuideItems();
    if (!items[index]) return;
    items[index] = { ...items[index], [key]: value as any };
    updateGuestGuideItems(items);
  };

  const removeGuestGuideItem = (index: number) => {
    const items = getGuestGuideItems();
    items.splice(index, 1);
    updateGuestGuideItems(items);
  };

  const getEventInfoItems = (): EventInfoItem[] => {
    const fromEvents = Array.isArray(config.events)
      ? config.events.map((item: any) => ({
          label: item?.label || '',
          datetime: item?.datetime || '',
          location: item?.location || '',
          address: item?.address || '',
          mapLink: item?.mapLink || '',
          mapButtonText: item?.mapButtonText || '',
        }))
      : [];

    if (fromEvents.length > 0) return fromEvents;

    return [
      {
        label: '',
        datetime: config.datetime || '',
        location: config.location || '',
        address: config.address || '',
        mapLink: config.mapLink || '',
        mapButtonText: config.mapButtonText || '',
      },
    ];
  };

  const updateEventInfoItems = (items: EventInfoItem[]) => {
    const normalized = items.length > 0
      ? items
      : [
          {
            label: '',
            datetime: '',
            location: '',
            address: '',
            mapLink: '',
            mapButtonText: '',
          },
        ];
    const primary = normalized[0];
    onUpdate({
      events: normalized,
      datetime: primary.datetime,
      location: primary.location,
      address: primary.address,
      mapLink: primary.mapLink,
      mapButtonText: primary.mapButtonText,
    });
  };

  const addEventInfoItem = () => {
    const items = getEventInfoItems();
    updateEventInfoItems([
      ...items,
      {
        label: '',
        datetime: '',
        location: '',
        address: '',
        mapLink: '',
        mapButtonText: '',
      },
    ]);
  };

  const updateEventInfoItem = (index: number, key: keyof EventInfoItem, value: string) => {
    const items = getEventInfoItems();
    if (!items[index]) return;
    items[index] = { ...items[index], [key]: value };
    updateEventInfoItems(items);
  };

  const removeEventInfoItem = (index: number) => {
    const items = getEventInfoItems();
    if (items.length <= 1) {
      updateEventInfoItems([
        {
          label: '',
          datetime: '',
          location: '',
          address: '',
          mapLink: '',
          mapButtonText: '',
        },
      ]);
      return;
    }
    items.splice(index, 1);
    updateEventInfoItems(items);
  };

  const handleGuestGuideImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const valid = await validateImageFile(file, {
      label: 'Imagem do manual',
      maxWidth: 1200,
      maxHeight: 1200,
    });
    if (!valid) {
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToServer(file, 'guest-guide');
      const items = getGuestGuideItems();
      if (!items[index]) return;
      items[index] = { ...items[index], image: url, mediaType: 'image' };
      updateGuestGuideItems(items);
    } catch {
      const dataUrl = await fileToDataUrl(file);
      const items = getGuestGuideItems();
      if (!items[index]) return;
      items[index] = { ...items[index], image: dataUrl, mediaType: 'image' };
      updateGuestGuideItems(items);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
            <Label className="text-sm font-medium">Cor do label</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.labelColor || '#FFFFFF'}
                onChange={(e) => handleChange('labelColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.labelColor || '#FFFFFF'} onChange={(e) => handleChange('labelColor', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do título</Label>
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
            <Label className="text-sm font-medium">Cor do subtítulo</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={config.subtitleColor || '#FFFFFF'}
                onChange={(e) => handleChange('subtitleColor', e.target.value)}
                className="h-10 w-12 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
              />
              <Input value={config.subtitleColor || '#FFFFFF'} onChange={(e) => handleChange('subtitleColor', e.target.value)} />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-[#ead9cd] bg-white p-3">
            <p className="text-sm font-medium">Posição individual dos textos</p>

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
              <Label className="text-xs text-gray-600">Título horizontal ({Math.min(100, Math.max(0, Number(config.titleX ?? 50)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.titleX ?? 50)))}
                onChange={(e) => handleChange('titleX', Number(e.target.value))}
                className="mt-1 w-full"
              />
              <Label className="text-xs text-gray-600">Título vertical ({Math.min(100, Math.max(0, Number(config.titleY ?? 44)))}%)</Label>
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
              <Label className="text-xs text-gray-600">Subtítulo horizontal ({Math.min(100, Math.max(0, Number(config.subtitleX ?? 50)))}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.min(100, Math.max(0, Number(config.subtitleX ?? 50)))}
                onChange={(e) => handleChange('subtitleX', Number(e.target.value))}
                className="mt-1 w-full"
              />
              <Label className="text-xs text-gray-600">Subtítulo vertical ({Math.min(100, Math.max(0, Number(config.subtitleY ?? 56)))}%)</Label>
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
                    <Label className="text-sm font-medium">Direção do degradê</Label>
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
                      Cobertura do degradê ({Math.min(100, Math.max(10, Number(config.overlayCoverage ?? 55)))}%)
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
            <p className="mt-1 text-xs text-gray-500">Recomendado: 500x500px. Limite de 5MB.</p>

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
            <p className="mt-1 text-xs text-gray-500">Recomendado: formato horizontal 16:9. Limite de 5MB.</p>

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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Nossa História"
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
              placeholder="Ex: Com amor, Maria e João"
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Falta Pouco!"
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
            <p className="mt-1 text-xs text-gray-500">As fotos são ajustadas automaticamente para quadrado (1000x1000), com corte central e limite de 5MB.</p>

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

      {/* Guest Guide Block */}
      {block.type === 'guest-guide' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Manual do Convidado'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-2"
              placeholder="Explique brevemente como os convidados devem se preparar."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Itens do manual</Label>
              <Button type="button" variant="outline" size="sm" onClick={addGuestGuideItem}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar item
              </Button>
            </div>

            {getGuestGuideItems().length === 0 ? (
              <p className="text-xs text-gray-500">Adicione ao menos um item para aparecer na página.</p>
            ) : (
              <div className="space-y-4">
                {getGuestGuideItems().map((item, index) => (
                  <div key={index} className="rounded-lg border border-[#ead9cd] bg-white p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Item {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeGuestGuideItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <div>
                        <Label className="text-xs text-gray-600">Visual</Label>
                        <select
                          value={item.mediaType}
                          onChange={(e) => updateGuestGuideItem(index, 'mediaType', e.target.value as GuestGuideMediaType)}
                          className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="none">Sem destaque</option>
                          <option value="icon">Ícone</option>
                          <option value="image">Foto</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="h-10 px-3 rounded-md border border-[#ead9cd] bg-[#fcf7f3] flex items-center gap-2 text-gray-700">
                          {item.mediaType === 'icon' ? <GuestGuideIconPreview icon={item.icon} /> : null}
                          {item.mediaType === 'image' && item.image ? (
                            <img src={item.image} alt="Prévia" className="w-6 h-6 rounded-full object-cover" />
                          ) : null}
                          <span className="text-xs">Prévia</span>
                        </div>
                      </div>
                    </div>

                    {item.mediaType === 'icon' ? (
                      <div>
                        <Label className="text-xs text-gray-600">Ícone</Label>
                        <select
                          value={item.icon}
                          onChange={(e) => updateGuestGuideItem(index, 'icon', e.target.value as GuestGuideIconId)}
                          className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {GUEST_GUIDE_ICON_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {item.mediaType === 'image' ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Foto</Label>
                        <p className="text-xs text-gray-500">Recomendado: até 1200x1200px. Limite: 5MB.</p>
                        {item.image ? (
                          <div className="relative">
                            <img
                              src={item.image}
                              alt={`Imagem do item ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => updateGuestGuideItem(index, 'image', '')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">{uploading ? 'Enviando...' : 'Upload da foto'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleGuestGuideImageUpload(e, index)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                    ) : null}

                    <div>
                      <Label className="text-xs text-gray-600">Título do item</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateGuestGuideItem(index, 'title', e.target.value)}
                        className="mt-1"
                        placeholder="Ex: Traje sugerido"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">Descrição</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateGuestGuideItem(index, 'description', e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Ex: Esporte fino em tons claros."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Info Block */}
      {block.type === 'event-info' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Informações do Evento"
              className="mt-2"
            />
          </div>

          <div className="space-y-4">
            {getEventInfoItems().map((item, index) => (
              <div key={index} className="rounded-lg border border-[#ead9cd] bg-white p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#8E3D2C]">Momento {index + 1}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEventInfoItem(index)}>
                    Remover
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium">Nome deste momento</Label>
                  <Input
                    value={item.label}
                    onChange={(e) => updateEventInfoItem(index, 'label', e.target.value)}
                    placeholder="Ex: Cerimônia ou Festa"
                    className="mt-2"
                  />
                </div>

                <DateTimePicker
                  label="Data e Hora"
                  value={item.datetime}
                  onChange={(value) => updateEventInfoItem(index, 'datetime', value)}
                />

                <div>
                  <Label className="text-sm font-medium">Local</Label>
                  <Input
                    value={item.location}
                    onChange={(e) => updateEventInfoItem(index, 'location', e.target.value)}
                    placeholder="Ex: Espaço Villa Bella"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input
                    value={item.address}
                    onChange={(e) => updateEventInfoItem(index, 'address', e.target.value)}
                    placeholder="Ex: Rua das Flores, 123"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Link do Mapa</Label>
                  <Input
                    value={item.mapLink}
                    onChange={(e) => updateEventInfoItem(index, 'mapLink', e.target.value)}
                    placeholder="Cole o link do Google Maps"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Texto do botão do mapa</Label>
                  <Input
                    value={item.mapButtonText}
                    onChange={(e) => updateEventInfoItem(index, 'mapButtonText', e.target.value)}
                    placeholder="Ex: Abrir no mapa"
                    className="mt-2"
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addEventInfoItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar outro local, data e hora
            </Button>
          </div>
        </>
      )}

      {/* Map Block */}
      {block.type === 'map' && (
        <>
          <div>
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Como chegar'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Subtítulo</Label>
            <Input
              value={config.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Ex: Estacionamento no local"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Endereço</Label>
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Nossa trilha sonora'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-2"
              placeholder="Uma música especial para esse momento"
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
            <Label className="text-sm font-medium">Título</Label>
            <Input
              value={config.title || 'Nosso vídeo'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Descrição</Label>
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
              value={config.title || 'Lista de Presentes'}
              onChange={(e) => handleChange('title', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Texto da seção</Label>
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
            <p className="mt-1 text-xs text-gray-500">Recomendado: formato horizontal 16:9. Limite de 5MB.</p>
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
            <Label className="text-sm font-medium">Texto do botão</Label>
            <Input
              value={config.buttonText || 'Presentear'}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Cor do título</Label>
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
            <Label className="text-sm font-medium">Cor do botão</Label>
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
            <Label className="text-sm font-medium">Cor do texto do botão</Label>
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

