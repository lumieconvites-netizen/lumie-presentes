'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/user-context';
import type { PageBlock } from '@/contexts/user-context';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Plus,
  GripVertical,
  Sparkles,
  ChevronRight,
  Globe,
  Type,
  Image as ImageIcon,
  Layout,
} from 'lucide-react';
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

export default function PageBuilder() {
  const { pageBlocks, updatePageBlocks, settings, updateSettings, gifts } = useUser();

  const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);
  const [themeVersion, setThemeVersion] = useState<number>(0);

  // Force re-render when theme changes
  useEffect(() => {
    console.log('Editor - Theme changed, forcing re-render', settings.theme);
    setThemeVersion((prev) => prev + 1);
  }, [settings.theme]);

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
      id: Date.now().toString(),
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

    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null);
    }
  };

  const updateBlockSettings = (blockId: string, config: Record<string, any>) => {
    console.log('Editor - updateBlockSettings called:', blockId, config);

    const updated: PageBlock[] = pageBlocks.map((block) =>
      block.id === blockId
        ? { ...block, config: { ...block.config, ...config } }
        : block
    );

    console.log('Editor - Updated blocks:', updated);
    updatePageBlocks(updated);

    // Update selected block to reflect changes
    if (selectedBlock?.id === blockId) {
      const updatedBlock = updated.find((b) => b.id === blockId) ?? null;
      if (updatedBlock) {
        console.log('Editor - Updating selected block:', updatedBlock);
        setSelectedBlock(updatedBlock);
      }
    }
  };

  const publishList = () => {
    updateSettings({ published: true });
  };

  const unpublishList = () => {
    updateSettings({ published: false });
  };

  return (
    <div className="h-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-foreground">
              Editor de Página
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                settings.published
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {settings.published ? 'Publicada' : 'Rascunho'}
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
              <Link href="/site" target="_blank">
                <Globe className="w-4 h-4 mr-2" />
                Ver Site
              </Link>
            </Button>

            {settings.published ? (
              <Button
                variant="outline"
                onClick={unpublishList}
                className="border-yellow-500 text-yellow-700"
              >
                Despublicar
              </Button>
            ) : (
              <Button
                onClick={publishList}
                className="bg-primary hover:bg-primary/90 text-white"
              >
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
              {/* Existing Blocks */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Blocos da Página
                </h3>

                <Reorder.Group
                  axis="y"
                  values={pageBlocks}
                  onReorder={handleReorderBlocks}
                  className="space-y-2"
                >
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

              {/* Add Block */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Adicionar Bloco
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_TYPES.filter((type) => !pageBlocks.some((b) => b.type === type.id)).map((type) => {
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
                    value={settings.theme?.primary_color || '#C86E52'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), primary_color: e.target.value },
                      })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={settings.theme?.primary_color || '#C86E52'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), primary_color: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme?.secondary_color || '#8E3D2C'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), secondary_color: e.target.value },
                      })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={settings.theme?.secondary_color || '#8E3D2C'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), secondary_color: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme?.background_color || '#FAF4EF'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), background_color: e.target.value },
                      })
                    }
                    className="w-12 h-12 rounded-lg cursor-pointer border-2"
                  />
                  <Input
                    value={settings.theme?.background_color || '#FAF4EF'}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...(settings.theme || {}), background_color: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do Título</Label>
                <Select
                  value={settings.theme?.font_title || 'Cormorant Garamond'}
                  onValueChange={(value) =>
                    updateSettings({ theme: { ...(settings.theme || {}), font_title: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</SelectItem>
                    <SelectItem value="Cormorant Garamond" style={{ fontFamily: 'Cormorant Garamond' }}>Cormorant Garamond</SelectItem>
                    <SelectItem value="Libre Baskerville" style={{ fontFamily: 'Libre Baskerville' }}>Libre Baskerville</SelectItem>
                    <SelectItem value="Merriweather" style={{ fontFamily: 'Merriweather' }}>Merriweather</SelectItem>
                    <SelectItem value="Lora" style={{ fontFamily: 'Lora' }}>Lora</SelectItem>
                    <SelectItem value="EB Garamond" style={{ fontFamily: 'EB Garamond' }}>EB Garamond</SelectItem>
                    <SelectItem value="Crimson Text" style={{ fontFamily: 'Crimson Text' }}>Crimson Text</SelectItem>
                    <SelectItem value="Dancing Script" style={{ fontFamily: 'Dancing Script' }}>Dancing Script (Cursiva)</SelectItem>
                    <SelectItem value="Great Vibes" style={{ fontFamily: 'Great Vibes' }}>Great Vibes (Cursiva)</SelectItem>
                    <SelectItem value="Pacifico" style={{ fontFamily: 'Pacifico' }}>Pacifico (Cursiva)</SelectItem>
                    <SelectItem value="Satisfy" style={{ fontFamily: 'Satisfy' }}>Satisfy (Cursiva)</SelectItem>
                    <SelectItem value="Allura" style={{ fontFamily: 'Allura' }}>Allura (Cursiva)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Fonte do Corpo</Label>
                <Select
                  value={settings.theme?.font_body || 'Inter'}
                  onValueChange={(value) =>
                    updateSettings({ theme: { ...(settings.theme || {}), font_body: value } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              list={{ theme: settings.theme || {} }}
              blocks={pageBlocks}
              selectedBlock={selectedBlock}
              onSelectBlock={setSelectedBlock}
              gifts={gifts}
            />
          </div>
        </div>

        {/* Block Settings Sidebar */}
        {selectedBlock && (
          <div className="w-80 bg-white border-l border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Configurações</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedBlock(null)}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <BlockEditor
              block={selectedBlock}
              onUpdate={(config) => updateBlockSettings(selectedBlock.id, config)}
              onDelete={() => removeBlock(selectedBlock.id)}
              list={{ theme: {} }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
