'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { PageBlock } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Sparkles, ChevronRight, Globe, Type, Image as ImageIcon, Layout, Save, Music2, Video } from 'lucide-react';
import { Reorder } from 'framer-motion';
import BlockEditor from '@/components/builder/BlockEditor';
import BlockPreview from '@/components/builder/BlockPreview';

type BlockTypeId = PageBlock['type'];

const BLOCK_TYPES: Array<{ id: BlockTypeId; name: string; icon: any }> = [
  { id: 'hero', name: 'Capa (Hero)', icon: ImageIcon },
  { id: 'message', name: 'Mensagem dos Anfitriões', icon: Type },
  { id: 'countdown', name: 'Contagem Regressiva', icon: Sparkles },
  { id: 'music', name: 'Música', icon: Music2 },
  { id: 'video', name: 'Vídeo', icon: Video },
  { id: 'gifts', name: 'Lista de Presentes', icon: Layout },
  { id: 'messages', name: 'Mural de Recados', icon: Type },
  { id: 'gallery', name: 'Galeria de Fotos', icon: ImageIcon },
  { id: 'event-info', name: 'Informações do Evento', icon: Globe },
];

type Theme = {
  primary_color?: string;
  title_color?: string;
  caption_color?: string;
  divider_color?: string;
  divider_enabled?: boolean;
  divider_style?: 'dot' | 'line' | 'ornament';
  blend_color?: string;
  background_overlay_opacity?: number;
  background_color?: string;
  background_image?: string;
  font_title?: string;
  font_body?: string;
  header?: {
    enabled?: boolean;
    brandText?: string;
    backgroundColor?: string;
    textColor?: string;
    showMeuSite?: boolean;
    showGifts?: boolean;
    showRsvp?: boolean;
    showMap?: boolean;
    menuMeuSite?: string;
    menuGifts?: string;
    menuRsvp?: string;
    menuMap?: string;
    menuMeuSiteUrl?: string;
    menuGiftsUrl?: string;
    menuRsvpUrl?: string;
    menuMapUrl?: string;
  };
};

function sanitizeBlocks(blocks: PageBlock[] = []) {
  const cleaned = blocks
    .filter((block) => block.type !== 'map')
    .map((block, index) => ({ ...block, order: index + 1 }));

  const hasGifts = cleaned.some((block) => block.type === 'gifts');
  if (!hasGifts) {
    cleaned.push({
      id: crypto?.randomUUID?.() ?? `gifts-${Date.now().toString()}`,
      type: 'gifts',
      order: cleaned.length + 1,
      enabled: true,
      config: {},
    } as PageBlock);
  }

  return cleaned.map((block, index) =>
    block.type === 'gifts'
      ? { ...block, order: index + 1, enabled: true }
      : { ...block, order: index + 1 }
  );
}

function mapGift(gift: any) {
  return {
    id: gift.id,
    title: gift.name,
    description: gift.description,
    value: Number(gift.basePrice ?? 0),
    photo: gift.imageUrl,
    quantity: gift.totalQuantity,
    quantityAvailable: gift.availableQty,
    status: gift.isActive ? 'active' : 'inactive',
  };
}

export default function PageBuilder() {
  const [giftList, setGiftList] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [theme, setTheme] = useState<Theme>({
    primary_color: '#C86E52',
    title_color: '#8E3D2C',
    caption_color: '#5F4A41',
    divider_color: '#8E3D2C',
    divider_enabled: true,
    divider_style: 'dot',
    blend_color: '#8E3D2C',
    background_overlay_opacity: 50,
    background_color: '#FAF4EF',
    font_title: 'Cormorant Garamond',
    font_body: 'Inter',
    header: {
      enabled: true,
      brandText: 'LUMIÊ',
      backgroundColor: '#0B0B0B',
      textColor: '#FFFFFF',
      showMeuSite: true,
      showGifts: true,
      showRsvp: true,
      showMap: true,
      menuMeuSite: 'Meu Site',
      menuGifts: 'Lista de Presentes',
      menuRsvp: 'Confirmar Presença',
      menuMap: 'Como Chegar',
      menuMeuSiteUrl: '',
      menuGiftsUrl: '',
      menuRsvpUrl: '',
      menuMapUrl: '',
    },
  });
  const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);
  const [themeVersion, setThemeVersion] = useState<number>(0);
  const [listGifts, setListGifts] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uploadingThemeBg, setUploadingThemeBg] = useState(false);

  const saveTimer = useRef<any>(null);

  const siteHref = useMemo(() => {
    if (!giftList?.slug) return '/site';
    return `/site/${encodeURIComponent(giftList.slug)}`;
  }, [giftList?.slug]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setLoading(true);

        const glRes = await fetch('/api/gift-lists/my-list', { cache: 'no-store' });
        const gl = await glRes.json();
        if (!glRes.ok) throw new Error(gl?.error ?? 'Falha ao carregar lista');
        if (cancelled) return;
        setGiftList(gl);

        const [layoutRes, giftsRes] = await Promise.all([
          fetch(`/api/gift-lists/${gl.id}/layout`, { cache: 'no-store' }),
          fetch(`/api/gifts?giftListId=${encodeURIComponent(gl.id)}`, { cache: 'no-store' }),
        ]);

        const layout = await layoutRes.json();
        const gifts = await giftsRes.json().catch(() => []);
        if (!layoutRes.ok) throw new Error(layout?.error ?? 'Falha ao carregar layout');

        if (cancelled) return;
        const cleanBlocks = sanitizeBlocks(Array.isArray(layout?.blocks) ? layout.blocks : []);
        setPageBlocks(cleanBlocks);
        setTheme((layout?.theme ?? {}) as Theme);
        setListGifts(Array.isArray(gifts) ? gifts.map(mapGift) : []);

        if (Array.isArray(layout?.blocks) && cleanBlocks.length !== layout.blocks.length) {
          try {
            await saveLayout(cleanBlocks, (layout?.theme ?? {}) as Theme);
          } catch (error) {
            console.error('Erro ao limpar bloco "map" legado', error);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setThemeVersion((prev) => prev + 1);
  }, [theme]);

  async function saveLayout(nextBlocks: PageBlock[], nextTheme: Theme) {
    if (!giftList?.id) return;

    const res = await fetch(`/api/gift-lists/${giftList.id}/layout`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: nextBlocks, theme: nextTheme }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? 'Falha ao salvar layout');
  }

  function scheduleSave(nextBlocks: PageBlock[], nextTheme: Theme) {
    if (!giftList?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await saveLayout(nextBlocks, nextTheme);
        setDirty(false);
      } catch (error) {
        console.error(error);
      }
    }, 500);
  }

  const updatePageBlocks = (next: PageBlock[]) => {
    setPageBlocks(next);
    setDirty(true);
    scheduleSave(next, theme);
  };

  const updateTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    setDirty(true);
    scheduleSave(pageBlocks, nextTheme);
  };

  const uploadThemeBackground = async (file?: File | null) => {
    if (!file) return;
    try {
      setUploadingThemeBg(true);
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'theme-background');

      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Falha no upload da imagem de fundo');
      }

      updateTheme({ ...theme, background_image: data.url });
    } catch (error: any) {
      alert(error?.message ?? 'Erro no upload da imagem de fundo');
    } finally {
      setUploadingThemeBg(false);
    }
  };

  const saveNow = async () => {
    try {
      await saveLayout(pageBlocks, theme);
      setDirty(false);
      alert('Alterações salvas.');
    } catch (error: any) {
      alert(error?.message ?? 'Falha ao salvar alterações');
    }
  };

  const handleReorderBlocks = (newBlocks: PageBlock[]) => {
    const updated = newBlocks.map((block, index) => ({ ...block, order: index + 1 }));
    updatePageBlocks(updated);
  };

  const toggleBlockVisibility = (blockId: string) => {
    const updated = pageBlocks.map((block) =>
      block.id === blockId
        ? block.type === 'gifts'
          ? { ...block, enabled: true }
          : { ...block, enabled: !block.enabled }
        : block
    );
    updatePageBlocks(updated);
  };

  const addBlock = (type: BlockTypeId) => {
    const newBlock: PageBlock = {
      id: crypto?.randomUUID?.() ?? Date.now().toString(),
      type,
      order: pageBlocks.length + 1,
      enabled: true,
      config: {},
    };
    updatePageBlocks([...pageBlocks, newBlock]);
  };

  const removeBlock = (blockId: string) => {
    const target = pageBlocks.find((b) => b.id === blockId);
    if (target?.type === 'gifts') return;
    const updated = pageBlocks.filter((b) => b.id !== blockId);
    updatePageBlocks(updated);
    if (selectedBlock?.id === blockId) setSelectedBlock(null);
  };

  const updateBlockSettings = (blockId: string, config: Record<string, any>) => {
    const updated = pageBlocks.map((block) =>
      block.id === blockId ? { ...block, config: { ...block.config, ...config } } : block
    );
    updatePageBlocks(updated);
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(updated.find((b) => b.id === blockId) ?? null);
    }
  };

  const publishList = async () => {
    const res = await fetch('/api/gift-lists/my-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: true }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error ?? 'Falha ao publicar');
    setGiftList(data);
  };

  const unpublishList = async () => {
    const res = await fetch('/api/gift-lists/my-list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: false }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error ?? 'Falha ao despublicar');
    setGiftList(data);
  };

  const copyPublishedLink = async () => {
    const fullUrl = `${window.location.origin}${siteHref}`;
    await navigator.clipboard.writeText(fullUrl);
      alert('Link copiado.');
  };

  if (loading) return <div className="p-6">Carregando editor...</div>;

  const published = Boolean(giftList?.isPublished);

  return (
    <div className="h-full bg-[#fbf8f5]">
      <div className="sticky top-0 z-40 bg-[#fbf8f5] border-b border-[#ead9cd] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9] px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-foreground">Editor de Página</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {published ? 'Publicada' : 'Rascunho'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={siteHref} target="_blank">
                <Globe className="w-4 h-4 mr-2" />
                Ver Site
              </Link>
            </Button>

            {published ? (
              <>
                <Button variant="outline" onClick={saveNow} disabled={!dirty}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar alterações
                </Button>
                <Button variant="outline" onClick={copyPublishedLink}>Copiar link</Button>
              <Button variant="outline" onClick={unpublishList} className="border-yellow-500 text-yellow-700">Despublicar</Button>
              </>
            ) : (
              <Button onClick={publishList} className="bg-gradient-to-r from-terracota-500 to-terracota-700 text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-72 bg-[#fffaf7] border-r border-[#ead9cd] overflow-y-auto">
          <Tabs defaultValue="blocks" className="p-4">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="blocks">Blocos</TabsTrigger>
              <TabsTrigger value="theme">Tema</TabsTrigger>
              <TabsTrigger value="header">Cabeçalho</TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Blocos da Página</h3>
                <Reorder.Group axis="y" values={pageBlocks} onReorder={handleReorderBlocks} className="space-y-2">
                  {pageBlocks.map((block) => {
                    const blockType = BLOCK_TYPES.find((t) => t.id === block.type);
                    const Icon = blockType?.icon || Layout;

                    return (
                      <Reorder.Item key={block.id} value={block}>
                        <div
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-move transition-all ${
                            selectedBlock?.id === block.id ? 'border-primary bg-primary/5' : 'border-[#ead9cd] bg-white hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedBlock(block)}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="flex-1 text-sm text-foreground truncate">{blockType?.name || block.type}</span>
                          <Switch
                            checked={block.enabled}
                            disabled={block.type === 'gifts'}
                            onCheckedChange={() => toggleBlockVisibility(block.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar bloco</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES.filter((type) => !pageBlocks.some((b) => b.type === type.id)).map((type) => {
                    const Icon = type.icon;
                    return (
                      <button key={type.id} onClick={() => addBlock(type.id)} className="p-3 rounded-lg border border-[#ead9cd] bg-white hover:border-primary hover:bg-primary/5 transition-all text-center">
                        <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <span className="text-xs text-foreground">{type.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">Cor dos ícones</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.primary_color || '#C86E52'} onChange={(e) => updateTheme({ ...theme, primary_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                  <Input value={theme.primary_color || '#C86E52'} onChange={(e) => updateTheme({ ...theme, primary_color: e.target.value })} className="flex-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor dos títulos</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, title_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                  <Input value={theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, title_color: e.target.value })} className="flex-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor das legendas</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.caption_color || '#5F4A41'} onChange={(e) => updateTheme({ ...theme, caption_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                  <Input value={theme.caption_color || '#5F4A41'} onChange={(e) => updateTheme({ ...theme, caption_color: e.target.value })} className="flex-1" />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-[#ead9cd] bg-white p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Exibir divisores entre blocos</Label>
                  <Switch
                    checked={theme.divider_enabled !== false}
                    onCheckedChange={(checked) => updateTheme({ ...theme, divider_enabled: checked })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cor do divisor</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.divider_color || theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, divider_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                    <Input value={theme.divider_color || theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, divider_color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Estilo do divisor</Label>
                  <Select value={theme.divider_style || 'dot'} onValueChange={(value: 'dot' | 'line' | 'ornament') => updateTheme({ ...theme, divider_style: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dot">Linha com ponto</SelectItem>
                      <SelectItem value="line">Linha simples</SelectItem>
                      <SelectItem value="ornament">Ornamental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor do esfumado (Hero para blocos)</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.blend_color || theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, blend_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                  <Input value={theme.blend_color || theme.title_color || '#8E3D2C'} onChange={(e) => updateTheme({ ...theme, blend_color: e.target.value })} className="flex-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor de fundo</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.background_color || '#FAF4EF'} onChange={(e) => updateTheme({ ...theme, background_color: e.target.value })} className="w-12 h-12 rounded-lg cursor-pointer border-2" />
                  <Input value={theme.background_color || '#FAF4EF'} onChange={(e) => updateTheme({ ...theme, background_color: e.target.value })} className="flex-1" />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Imagem de fundo (blocos, exceto hero)</Label>
                {theme.background_image ? (
                  <div className="space-y-3">
                    <img
                      src={theme.background_image}
                      alt="Fundo do tema"
                      className="w-full h-28 rounded-lg object-cover border border-[#ead9cd]"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateTheme({ ...theme, background_image: '' })}
                        disabled={uploadingThemeBg}
                      >
                        Remover imagem
                      </Button>
                      <label className="inline-flex">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadThemeBackground(e.target.files?.[0] || null)}
                          disabled={uploadingThemeBg}
                        />
                        <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium cursor-pointer">
                          {uploadingThemeBg ? 'Enviando...' : 'Trocar imagem'}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadThemeBackground(e.target.files?.[0] || null)}
                      disabled={uploadingThemeBg}
                    />
                    <span className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium cursor-pointer">
                      {uploadingThemeBg ? 'Enviando...' : 'Enviar imagem de fundo'}
                    </span>
                  </label>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  A imagem do tema vale para todos os blocos, exceto o Hero. Se remover, fica a cor de fundo.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Transparência da imagem de fundo ({Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)))}%)
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)))}
                  onChange={(e) => updateTheme({ ...theme, background_overlay_opacity: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="mt-2 text-xs text-gray-500">
                  0% mostra mais a imagem. 100% mostra mais a cor de fundo.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do Título</Label>
                <Select value={theme.font_title || 'Cormorant Garamond'} onValueChange={(value) => updateTheme({ ...theme, font_title: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</SelectItem>
                    <SelectItem value="Cormorant Garamond" style={{ fontFamily: 'Cormorant Garamond' }}>Cormorant Garamond</SelectItem>
                    <SelectItem value="Great Vibes" style={{ fontFamily: 'Great Vibes' }}>Great Vibes</SelectItem>
                    <SelectItem value="Dancing Script" style={{ fontFamily: 'Dancing Script' }}>Dancing Script</SelectItem>
                    <SelectItem value="Allura" style={{ fontFamily: 'Allura' }}>Allura</SelectItem>
                    <SelectItem value="Poppins" style={{ fontFamily: 'Poppins' }}>Poppins</SelectItem>
                    <SelectItem value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do corpo</Label>
                <Select value={theme.font_body || 'Inter'} onValueChange={(value) => updateTheme({ ...theme, font_body: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="Inter" style={{ fontFamily: 'Inter' }}>Inter</SelectItem>
                    <SelectItem value="Lato" style={{ fontFamily: 'Lato' }}>Lato</SelectItem>
                    <SelectItem value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</SelectItem>
                    <SelectItem value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</SelectItem>
                    <SelectItem value="Nunito" style={{ fontFamily: 'Nunito' }}>Nunito</SelectItem>
                    <SelectItem value="Work Sans" style={{ fontFamily: 'Work Sans' }}>Work Sans</SelectItem>
                    <SelectItem value="Raleway" style={{ fontFamily: 'Raleway' }}>Raleway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-6">
              <div className="flex items-center justify-between py-2">
                <div>
                <Label className="text-sm font-medium">Exibir cabeçalho no site</Label>
                </div>
                <Switch
                  checked={theme.header?.enabled !== false}
                  onCheckedChange={(checked) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), enabled: checked },
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Marca no cabeçalho</Label>
                <Input
                  value={theme.header?.brandText || 'LUMIÊ'}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), brandText: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor de fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.header?.backgroundColor || '#0B0B0B'}
                    onChange={(e) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), backgroundColor: e.target.value },
                      })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={theme.header?.backgroundColor || '#0B0B0B'}
                    onChange={(e) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), backgroundColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor do texto</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.header?.textColor || '#FFFFFF'}
                    onChange={(e) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), textColor: e.target.value },
                      })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={theme.header?.textColor || '#FFFFFF'}
                    onChange={(e) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), textColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium mb-1 block">Labels do menu</Label>
                <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white px-3 py-2">
                  <span className="text-sm text-gray-700">Exibir "Meu Site"</span>
                  <Switch
                    checked={theme.header?.showMeuSite !== false}
                    onCheckedChange={(checked) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), showMeuSite: checked },
                      })
                    }
                  />
                </div>
                <Input
                  value={theme.header?.menuMeuSite || 'Meu Site'}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), menuMeuSite: e.target.value },
                    })
                  }
                  placeholder="Meu Site"
                />
                <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white px-3 py-2">
                  <span className="text-sm text-gray-700">Exibir "Lista de Presentes"</span>
                  <Switch
                    checked={theme.header?.showGifts !== false}
                    onCheckedChange={(checked) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), showGifts: checked },
                      })
                    }
                  />
                </div>
                <Input
                  value={theme.header?.menuGifts || 'Lista de Presentes'}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), menuGifts: e.target.value },
                    })
                  }
                  placeholder="Lista de Presentes"
                />
                <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white px-3 py-2">
                  <span className="text-sm text-gray-700">Exibir "Confirmar Presença"</span>
                  <Switch
                    checked={theme.header?.showRsvp !== false}
                    onCheckedChange={(checked) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), showRsvp: checked },
                      })
                    }
                  />
                </div>
                <Input
                  value={theme.header?.menuRsvp || 'Confirmar Presença'}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), menuRsvp: e.target.value },
                    })
                  }
                  placeholder="Confirmar Presença"
                />
                <div className="flex items-center justify-between rounded-lg border border-[#ead9cd] bg-white px-3 py-2">
                  <span className="text-sm text-gray-700">Exibir "Como Chegar"</span>
                  <Switch
                    checked={theme.header?.showMap !== false}
                    onCheckedChange={(checked) =>
                      updateTheme({
                        ...theme,
                        header: { ...(theme.header || {}), showMap: checked },
                      })
                    }
                  />
                </div>
                <Input
                  value={theme.header?.menuMap || 'Como Chegar'}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), menuMap: e.target.value },
                    })
                  }
                  placeholder="Como Chegar"
                />
                <Label className="text-xs text-gray-500 mt-2 block">Link de Como Chegar</Label>
                <Input
                  value={theme.header?.menuMapUrl || ''}
                  onChange={(e) =>
                    updateTheme({
                      ...theme,
                      header: { ...(theme.header || {}), menuMapUrl: e.target.value },
                    })
                  }
                  placeholder="Cole link Google Maps/Waze ou endereço"
                />
                <p className="text-xs text-gray-500">
                  Exemplo: https://maps.app.goo.gl/... ou "Rua X, 123 - Cidade"
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f7efe8]">
          <div className="max-w-5xl mx-auto px-6 pb-6">
            <BlockPreview key={themeVersion} list={{ theme, slug: giftList?.slug }} blocks={pageBlocks} selectedBlock={selectedBlock} onSelectBlock={setSelectedBlock} gifts={listGifts} />
          </div>
        </div>

        {selectedBlock && (
          <div className="w-80 bg-white border-l border-[#ead9cd] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Configurações</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBlock(null)} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <BlockEditor block={selectedBlock} onUpdate={(config) => updateBlockSettings(selectedBlock.id, config)} onDelete={() => removeBlock(selectedBlock.id)} list={{ theme }} />
          </div>
        )}
      </div>
    </div>
  );
}


