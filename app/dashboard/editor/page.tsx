'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { PageBlock } from '@/contexts/user-context';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Eye, GripVertical, Sparkles, ChevronRight, Globe, Type, Image as ImageIcon, Layout } from 'lucide-react';
import { Reorder } from 'framer-motion';

import BlockEditor from '@/components/builder/BlockEditor';
import BlockPreview from '@/components/builder/BlockPreview';

type BlockTypeId = PageBlock['type'];

const BLOCK_TYPES: Array<{ id: BlockTypeId; name: string; icon: any }> = [
  { id: 'hero', name: 'Capa (Hero)', icon: ImageIcon },
  { id: 'message', name: 'Mensagem dos Anfitriões', icon: Type },
  { id: 'countdown', name: 'Contagem Regressiva', icon: Sparkles },
  { id: 'gifts', name: 'Lista de Presentes', icon: Layout },
  { id: 'messages', name: 'Mural de Recados', icon: Type },
  { id: 'gallery', name: 'Galeria de Fotos', icon: ImageIcon },
  { id: 'event-info', name: 'Informações do Evento', icon: Globe },
];

type Theme = {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  font_title?: string;
  font_body?: string;
};

export default function PageBuilder() {
  // ✅ dados reais do usuário (giftList + layout vindo do banco)
  const [giftList, setGiftList] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [theme, setTheme] = useState<Theme>({
    primary_color: '#C86E52',
    secondary_color: '#8E3D2C',
    background_color: '#FAF4EF',
    font_title: 'Cormorant Garamond',
    font_body: 'Inter',
  });

  const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);
  const [themeVersion, setThemeVersion] = useState<number>(0);

  // debounce p/ não salvar no banco a cada tecla (fica lisinho)
  const saveTimer = useRef<any>(null);

  const siteHref = useMemo(() => {
    if (!giftList?.slug) return "/site";
    return `/site/${encodeURIComponent(giftList.slug)}`;
  }, [giftList?.slug]);

  // 1) Carrega giftList do user + layout do banco
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setLoading(true);

        const glRes = await fetch('/api/gift-lists/my-list', { cache: 'no-store' });
        const gl = await glRes.json();
        if (!glRes.ok) throw new Error(gl?.error ?? 'Falha ao carregar giftList');

        if (cancelled) return;
        setGiftList(gl);

        const layoutRes = await fetch(`/api/gift-lists/${gl.id}/layout`, { cache: 'no-store' });
        const layout = await layoutRes.json();
        if (!layoutRes.ok) throw new Error(layout?.error ?? 'Falha ao carregar layout');

        if (cancelled) return;

        setPageBlocks(Array.isArray(layout?.blocks) ? layout.blocks : []);
        setTheme((layout?.theme ?? {}) as Theme);

        // status publish vem de giftList.isPublished
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => { cancelled = true; };
  }, []);

  // força preview re-render quando tema muda
  useEffect(() => {
    setThemeVersion((prev) => prev + 1);
  }, [theme]);

  // 2) Salva layout no banco (debounced)
  function scheduleSave(nextBlocks: PageBlock[], nextTheme: Theme) {
    if (!giftList?.id) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/gift-lists/${giftList.id}/layout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: nextBlocks, theme: nextTheme }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error('Falha ao salvar layout:', data);
        }
      } catch (err) {
        console.error('Erro salvando layout:', err);
      }
    }, 500);
  }

  // wrappers “tipo updatePageBlocks/updateSettings”, só que no banco
  const updatePageBlocks = (next: PageBlock[]) => {
    setPageBlocks(next);
    scheduleSave(next, theme);
  };

  const updateTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    scheduleSave(pageBlocks, nextTheme);
  };

  const handleReorderBlocks = (newBlocks: PageBlock[]) => {
    const updated: PageBlock[] = newBlocks.map((block, index) => ({
      ...block,
      order: index + 1,
    }));
    updatePageBlocks(updated);
  };

  const toggleBlockVisibility = (blockId: string) => {
    const updated: PageBlock[] = pageBlocks.map((block) =>
      block.id === blockId ? { ...block, enabled: !block.enabled } : block
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
    const updated = pageBlocks.filter((b) => b.id !== blockId);
    updatePageBlocks(updated);

    if (selectedBlock?.id === blockId) setSelectedBlock(null);
  };

  const updateBlockSettings = (blockId: string, config: Record<string, any>) => {
    const updated: PageBlock[] = pageBlocks.map((block) =>
      block.id === blockId ? { ...block, config: { ...block.config, ...config } } : block
    );

    updatePageBlocks(updated);

    if (selectedBlock?.id === blockId) {
      const updatedBlock = updated.find((b) => b.id === blockId) ?? null;
      setSelectedBlock(updatedBlock);
    }
  };

  const publishList = async () => {
    try {
      const res = await fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao publicar');
      setGiftList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const unpublishList = async () => {
    try {
      const res = await fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao despublicar');
      setGiftList(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando editor...</div>;
  }

  const published = Boolean(giftList?.isPublished);

  return (
    <div className="h-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-foreground">Editor de Página</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {published ? 'Publicada' : 'Rascunho'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={siteHref} target="_blank">
                <Globe className="w-4 h-4 mr-2" />
                Ver Site
              </Link>
            </Button>

            {published ? (
              <Button variant="outline" onClick={unpublishList} className="border-yellow-500 text-yellow-700">
                Despublicar
              </Button>
            ) : (
              <Button onClick={publishList} className="bg-primary hover:bg-primary/90 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Sidebar - Blocks List */}
        <div className="w-72 bg-white border-r border-border overflow-y-auto">
          <Tabs defaultValue="blocks" className="p-4">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="blocks">Blocos</TabsTrigger>
              <TabsTrigger value="theme">Tema</TabsTrigger>
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
                            selectedBlock?.id === block.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedBlock(block)}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="flex-1 text-sm text-foreground truncate">
                            {blockType?.name || block.type}
                          </span>
                          <Switch
                            checked={block.enabled}
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
                <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar Bloco</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES
                    .filter((type) => !pageBlocks.some((b) => b.type === type.id))
                    .map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => addBlock(type.id)}
                          className="p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-center"
                        >
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
                <Label className="text-sm font-medium mb-2 block">Cor Principal</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primary_color || '#C86E52'}
                    onChange={(e) => updateTheme({ ...theme, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={theme.primary_color || '#C86E52'}
                    onChange={(e) => updateTheme({ ...theme, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondary_color || '#8E3D2C'}
                    onChange={(e) => updateTheme({ ...theme, secondary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={theme.secondary_color || '#8E3D2C'}
                    onChange={(e) => updateTheme({ ...theme, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.background_color || '#FAF4EF'}
                    onChange={(e) => updateTheme({ ...theme, background_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={theme.background_color || '#FAF4EF'}
                    onChange={(e) => updateTheme({ ...theme, background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do Título</Label>
                <Select
                  value={theme.font_title || 'Cormorant Garamond'}
                  onValueChange={(value) => updateTheme({ ...theme, font_title: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</SelectItem>
                    <SelectItem value="Cormorant Garamond" style={{ fontFamily: 'Cormorant Garamond' }}>Cormorant Garamond</SelectItem>
                    <SelectItem value="Libre Baskerville" style={{ fontFamily: 'Libre Baskerville' }}>Libre Baskerville</SelectItem>
                    <SelectItem value="Merriweather" style={{ fontFamily: 'Merriweather' }}>Merriweather</SelectItem>
                    <SelectItem value="Lora" style={{ fontFamily: 'Lora' }}>Lora</SelectItem>
                    <SelectItem value="EB Garamond" style={{ fontFamily: 'EB Garamond' }}>EB Garamond</SelectItem>
                    <SelectItem value="Crimson Text" style={{ fontFamily: 'Crimson Text' }}>Crimson Text</SelectItem>
                    <SelectItem value="Dancing Script" style={{ fontFamily: 'Dancing Script' }}>Dancing Script</SelectItem>
                    <SelectItem value="Great Vibes" style={{ fontFamily: 'Great Vibes' }}>Great Vibes</SelectItem>
                    <SelectItem value="Pacifico" style={{ fontFamily: 'Pacifico' }}>Pacifico</SelectItem>
                    <SelectItem value="Satisfy" style={{ fontFamily: 'Satisfy' }}>Satisfy</SelectItem>
                    <SelectItem value="Allura" style={{ fontFamily: 'Allura' }}>Allura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do Corpo</Label>
                <Select
                  value={theme.font_body || 'Inter'}
                  onValueChange={(value) => updateTheme({ ...theme, font_body: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="Inter" style={{ fontFamily: 'Inter' }}>Inter</SelectItem>
                    <SelectItem value="Lato" style={{ fontFamily: 'Lato' }}>Lato</SelectItem>
                    <SelectItem value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</SelectItem>
                    <SelectItem value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</SelectItem>
                    <SelectItem value="Poppins" style={{ fontFamily: 'Poppins' }}>Poppins</SelectItem>
                    <SelectItem value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</SelectItem>
                    <SelectItem value="Nunito" style={{ fontFamily: 'Nunito' }}>Nunito</SelectItem>
                    <SelectItem value="Work Sans" style={{ fontFamily: 'Work Sans' }}>Work Sans</SelectItem>
                    <SelectItem value="Raleway" style={{ fontFamily: 'Raleway' }}>Raleway</SelectItem>
                    <SelectItem value="Source Sans Pro" style={{ fontFamily: 'Source Sans Pro' }}>Source Sans Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="max-w-5xl mx-auto">
            <BlockPreview
              key={themeVersion}
              list={{ theme }}
              blocks={pageBlocks}
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              gifts={[]} // depois a gente liga isso no banco também
            />
          </div>
        </div>

        {/* Block Settings Sidebar */}
        {selectedBlock && (
          <div className="w-80 bg-white border-l border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Configurações</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBlock(null)} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <BlockEditor
              block={selectedBlock}
              onUpdate={(config) => updateBlockSettings(selectedBlock.id, config)}
              onDelete={() => removeBlock(selectedBlock.id)}
              list={{ theme }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
