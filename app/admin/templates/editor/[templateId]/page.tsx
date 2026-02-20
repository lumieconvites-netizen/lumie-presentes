'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BlockEditor from '@/components/builder/BlockEditor';
import BlockPreview from '@/components/builder/BlockPreview';
import { GripVertical, ChevronRight, Image as ImageIcon, Layout, Music2, Sparkles, Type, Video, Globe, Plus, Upload, X } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { normalizeTemplateGiftItems } from '@/lib/template-gifts';

type CategoryItem = { slug: string; name: string; templatesCount: number; activeTemplatesCount: number };
type TemplateGiftFormItem = { name: string; description: string; imageUrl: string; basePrice: number; totalQuantity: number };

const BLOCK_TYPES = [
  { id: 'hero', name: 'Capa (Hero)', icon: ImageIcon },
  { id: 'message', name: 'Mensagem', icon: Type },
  { id: 'countdown', name: 'Contagem Regressiva', icon: Sparkles },
  { id: 'music', name: 'Musica', icon: Music2 },
  { id: 'video', name: 'Video', icon: Video },
  { id: 'gifts', name: 'Lista de Presentes', icon: Layout },
  { id: 'messages', name: 'Mural de Recados', icon: Type },
  { id: 'gallery', name: 'Galeria de Fotos', icon: ImageIcon },
  { id: 'event-info', name: 'Informacoes do Evento', icon: Globe },
] as const;

const defaultTheme = {
  primary_color: '#C65A3A',
  secondary_color: '#8E3D2C',
  background_color: '#FAF4EF',
  title_color: '#8E3D2C',
  caption_color: '#5F4A41',
  divider_color: '#8E3D2C',
  divider_enabled: true,
  divider_style: 'dot',
  background_overlay_opacity: 50,
  background_image: '',
  font_title: 'Playfair Display',
  font_body: 'Inter',
};

const defaultBlocks = [
  {
    id: 'hero-1',
    type: 'hero',
    order: 1,
    enabled: true,
    config: {
      label: 'Convite Especial',
      title: 'Titulo do Evento',
      subtitle: 'Subtitulo do evento',
      buttonText: 'Ver lista',
      backgroundColor: '#8E3D2C',
    },
  },
  {
    id: 'gifts-1',
    type: 'gifts',
    order: 2,
    enabled: true,
    config: { title: 'Lista de Presentes', layout: 'grid' },
  },
];

function slugify(v: string) {
  return v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sanitizeTemplateBlocks(input: any[]) {
  const seen = new Set<string>();
  const known = new Set(BLOCK_TYPES.map((item) => item.id));
  const cleaned: any[] = [];

  for (const block of Array.isArray(input) ? input : []) {
    if (!block || !known.has(block.type)) continue;
    if (seen.has(block.type)) continue;
    seen.add(block.type);
    cleaned.push({
      ...block,
      enabled: block.type === 'gifts' ? true : block.enabled !== false,
      order: cleaned.length + 1,
    });
  }

  if (!cleaned.some((block) => block.type === 'hero')) {
    cleaned.unshift({
      id: `hero-${Date.now()}`,
      type: 'hero',
      order: 1,
      enabled: true,
      config: {},
    });
  }

  if (!cleaned.some((block) => block.type === 'gifts')) {
    cleaned.push({
      id: `gifts-${Date.now()}`,
      type: 'gifts',
      order: cleaned.length + 1,
      enabled: true,
      config: {},
    });
  }

  return cleaned.map((block, index) => ({ ...block, order: index + 1 }));
}

function readTemplateGiftsFromBlocks(blocks: any[]): TemplateGiftFormItem[] {
  const giftsBlock = blocks.find((block) => block.type === 'gifts');
  const normalized = normalizeTemplateGiftItems(giftsBlock?.config?.templateGiftItems);
  return normalized.map((gift) => ({
    name: gift.name,
    description: gift.description || '',
    imageUrl: gift.imageUrl || '',
    basePrice: Number(gift.basePrice || 0),
    totalQuantity: Number(gift.totalQuantity || 1),
  }));
}

function writeTemplateGiftsToBlocks(blocks: any[], giftItems: TemplateGiftFormItem[]) {
  const normalizedGifts = normalizeTemplateGiftItems(giftItems);
  const safeBlocks = sanitizeTemplateBlocks(blocks);
  const hasGiftsBlock = safeBlocks.some((block) => block.type === 'gifts');
  const nextBlocks = hasGiftsBlock
    ? safeBlocks
    : [
        ...safeBlocks,
        { id: `gifts-${Date.now()}`, type: 'gifts', order: safeBlocks.length + 1, enabled: true, config: {} },
      ];

  return nextBlocks.map((block, index) => {
    if (block.type !== 'gifts') return { ...block, order: index + 1 };
    return {
      ...block,
      order: index + 1,
      enabled: true,
      config: {
        ...(block.config || {}),
        templateGiftItems: normalizedGifts,
      },
    };
  });
}

export default function AdminTemplateEditorPage() {
  const params = useParams<{ templateId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const templateId = String(params.templateId || 'new');
  const isNew = templateId === 'new';

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blocks' | 'theme' | 'header' | 'template'>('blocks');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingGiftIndex, setUploadingGiftIndex] = useState<number | null>(null);
  const [uploadingThemeBg, setUploadingThemeBg] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: search.get('category') || '',
    description: '',
    thumbnail: '',
    isActive: false,
  });

  const [blocks, setBlocks] = useState<any[]>(sanitizeTemplateBlocks(defaultBlocks));
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [templateGifts, setTemplateGifts] = useState<TemplateGiftFormItem[]>([]);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const previewList = useMemo(() => ({ theme }), [theme]);
  const previewSlug = useMemo(() => slugify(form.slug || form.name || ''), [form.slug, form.name]);
  const previewHref = previewSlug ? `/templates/${encodeURIComponent(previewSlug)}` : '/templates';
  const previewGiftsHref = previewSlug ? `/templates/${encodeURIComponent(previewSlug)}/presentes` : '/templates';
  const previewGifts = useMemo(
    () =>
      normalizeTemplateGiftItems(templateGifts).map((gift, index) => ({
        id: `tg-${index}`,
        title: gift.name,
        description: gift.description || '',
        value: Number(gift.basePrice || 0),
        photo: gift.imageUrl || '',
        quantity: Number(gift.totalQuantity || 1),
        quantityAvailable: Number(gift.totalQuantity || 1),
        status: 'active',
      })),
    [templateGifts]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const categoryRes = await fetch('/api/admin/template-categories', { cache: 'no-store' });
        const categoryJson = await categoryRes.json();
        if (!cancelled && categoryRes.ok) {
          setCategories(categoryJson.categories || []);
          if (isNew && !form.category && (categoryJson.categories || []).length > 0) {
            setForm((prev) => ({ ...prev, category: categoryJson.categories[0].slug }));
          }
        }

        if (isNew && !cancelled) {
          const cleanDefault = sanitizeTemplateBlocks(defaultBlocks);
          setBlocks(cleanDefault);
          setTemplateGifts(readTemplateGiftsFromBlocks(cleanDefault));
        }

        if (!isNew) {
          const templateRes = await fetch(`/api/admin/templates/${templateId}`, { cache: 'no-store' });
          const templateJson = await templateRes.json();
          if (!templateRes.ok) throw new Error(templateJson?.error || 'Erro ao carregar template');
          const template = templateJson.template;
          if (!cancelled) {
            setForm({
              name: template.name || '',
              slug: template.slug || '',
              category: template.category || '',
              description: template.description || '',
              thumbnail: template.thumbnail || '',
              isActive: Boolean(template.isActive),
            });
            const cleanBlocks = sanitizeTemplateBlocks(
              Array.isArray(template.defaultBlocks) && template.defaultBlocks.length ? template.defaultBlocks : defaultBlocks
            );
            setBlocks(cleanBlocks);
            setTheme(template.defaultTheme || defaultTheme);
            setTemplateGifts(readTemplateGiftsFromBlocks(cleanBlocks));
          }
        }
      } catch (error: any) {
        if (!cancelled) alert(error?.message || 'Erro ao carregar editor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  function addBlock(type: string) {
    if (blocks.some((block) => block.type === type)) return;
    const next = {
      id: `${type}-${Date.now()}`,
      type,
      order: blocks.length + 1,
      enabled: true,
      config: {},
    };
    setBlocks((prev) => sanitizeTemplateBlocks([...prev, next]));
    setDirty(true);
    setSelectedBlockId(next.id);
  }

  function toggleBlockVisibility(blockId: string) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? block.type === 'gifts'
            ? { ...block, enabled: true }
            : { ...block, enabled: !block.enabled }
          : block
      )
    );
    setDirty(true);
  }

  function handleReorderBlocks(newBlocks: any[]) {
    setBlocks(newBlocks.map((block, index) => ({ ...block, order: index + 1 })));
    setDirty(true);
  }

  function updateBlock(blockId: string, patch: any) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              config: { ...(block.config || {}), ...patch },
            }
          : block
      )
    );
    setDirty(true);
  }

  function deleteBlock(blockId: string) {
    const target = blocks.find((block) => block.id === blockId);
    if (target?.type === 'gifts') return;
    setBlocks((prev) => sanitizeTemplateBlocks(prev.filter((block) => block.id !== blockId)));
    setDirty(true);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  async function saveTemplate(overrideIsActive?: boolean) {
    if (!form.name.trim()) {
      alert('Informe o nome do template.');
      return;
    }
    if (!form.category.trim()) {
      alert('Selecione o tipo de evento.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      category: form.category,
      description: form.description.trim() || null,
      thumbnail: form.thumbnail.trim() || null,
      defaultBlocks: writeTemplateGiftsToBlocks(blocks, templateGifts),
      defaultTheme: theme,
      isActive: typeof overrideIsActive === 'boolean' ? overrideIsActive : true,
    };

    setSaving(true);
    try {
      const res = await fetch(isNew ? '/api/admin/templates' : `/api/admin/templates/${templateId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao salvar template');
      setDirty(false);
      if (json?.template) {
        setForm((prev) => ({
          ...prev,
          slug: json.template.slug || prev.slug,
          isActive: Boolean(json.template.isActive),
        }));
      }
      if (isNew && json?.template?.id) {
        router.replace(`/admin/templates/editor/${json.template.id}`);
      }
      return json?.template ?? null;
    } catch (error: any) {
      alert(error?.message || 'Erro ao salvar template');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished() {
    const next = !form.isActive;
    const saved = await saveTemplate(next);
    if (!saved) {
      return;
    }
    setForm((prev) => ({ ...prev, isActive: next }));
    alert(next ? 'Template publicado.' : 'Template despublicado.');
  }

  async function uploadFile(file: File, folder: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const response = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.url) throw new Error(data?.error || 'Falha no upload');
    return String(data.url);
  }

  async function handleThumbnailUpload(file?: File | null) {
    if (!file) return;
    try {
      setUploadingThumbnail(true);
      const url = await uploadFile(file, 'template-thumbnail');
      setForm((prev) => ({ ...prev, thumbnail: url }));
      setDirty(true);
    } catch (error: any) {
      alert(error?.message || 'Erro ao enviar thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleGiftImageUpload(index: number, file?: File | null) {
    if (!file) return;
    try {
      setUploadingGiftIndex(index);
      const url = await uploadFile(file, 'template-gifts');
      setTemplateGifts((prev) => prev.map((gift, i) => (i === index ? { ...gift, imageUrl: url } : gift)));
      setDirty(true);
    } catch (error: any) {
      alert(error?.message || 'Erro ao enviar imagem do presente');
    } finally {
      setUploadingGiftIndex(null);
    }
  }

  async function handleThemeBackgroundUpload(file?: File | null) {
    if (!file) return;
    try {
      setUploadingThemeBg(true);
      const url = await uploadFile(file, 'template-theme-background');
      setTheme((prev: any) => ({ ...prev, background_image: url }));
      setDirty(true);
    } catch (error: any) {
      alert(error?.message || 'Erro ao enviar imagem de fundo');
    } finally {
      setUploadingThemeBg(false);
    }
  }

  if (loading) return <div className="p-6">Carregando editor de template...</div>;

  return (
    <div className="h-full bg-[#fbf8f5]">
      <div className="sticky top-0 z-40 bg-[#fbf8f5] border-b border-[#ead9cd] px-4 md:px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9] px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-foreground">{isNew ? 'Novo template' : 'Editor de Template'}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {form.isActive ? 'Publicado' : 'Rascunho'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/templates">Voltar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={previewHref} target="_blank">
                Visualizar
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={previewGiftsHref} target="_blank">
                Visualizar presentes
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('template');
                setTemplateGifts((prev) => [...prev, { name: '', description: '', imageUrl: '', basePrice: 100, totalQuantity: 1 }]);
                setDirty(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar presentes
            </Button>
            <Button onClick={() => saveTemplate().catch(() => null)} disabled={saving || !dirty}>
              {saving ? 'Salvando...' : 'Salvar e publicar'}
            </Button>
            <Button
              className="bg-gradient-to-r from-terracota-500 to-terracota-700 text-white hover:from-terracota-600 hover:to-terracota-800"
              onClick={() => togglePublished().catch(() => null)}
              disabled={saving}
            >
              {form.isActive ? 'Despublicar template' : 'Publicar template'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-72 bg-[#fffaf7] border-r border-[#ead9cd] overflow-y-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="p-4">
            <TabsList className="w-full grid grid-cols-4 mb-4 gap-1 h-auto rounded-lg p-1">
              <TabsTrigger value="blocks" className="min-w-0 overflow-hidden text-ellipsis px-1 text-[10px] sm:text-xs">Blocos</TabsTrigger>
              <TabsTrigger value="theme" className="min-w-0 overflow-hidden text-ellipsis px-1 text-[10px] sm:text-xs">Tema</TabsTrigger>
              <TabsTrigger value="header" className="min-w-0 overflow-hidden text-ellipsis px-1 text-[10px] sm:text-xs">Cab.</TabsTrigger>
              <TabsTrigger value="template" className="min-w-0 overflow-hidden text-ellipsis px-1 text-[10px] sm:text-xs">Tpl.</TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Blocos da PÃ¡gina</h3>
                <Reorder.Group axis="y" values={blocks} onReorder={handleReorderBlocks} className="space-y-2">
                  {blocks.map((block) => {
                    const blockType = BLOCK_TYPES.find((item) => item.id === block.type);
                    const Icon = blockType?.icon || Layout;
                    return (
                      <Reorder.Item key={block.id} value={block}>
                        <div
                          className={`p-3 rounded-lg border flex items-center gap-3 cursor-move transition-all ${
                            selectedBlockId === block.id ? 'border-primary bg-primary/5' : 'border-[#ead9cd] bg-white hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="flex-1 text-sm text-foreground truncate">{blockType?.name || block.type}</span>
                          <Switch
                            checked={Boolean(block.enabled)}
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
                  {BLOCK_TYPES.filter((type) => !blocks.some((b) => b.type === type.id)).map((type) => (
                    <Button key={type.id} type="button" variant="outline" size="sm" onClick={() => addBlock(type.id)}>
                      {type.name}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <div className="space-y-1">
                <Label>Cor dos Ã­cones</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.primary_color || '#C65A3A'} onChange={(e) => { setTheme((prev: any) => ({ ...prev, primary_color: e.target.value })); setDirty(true); }} className="h-9 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer" />
                  <Input value={theme.primary_color || ''} onChange={(e) => { setTheme((prev: any) => ({ ...prev, primary_color: e.target.value })); setDirty(true); }} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Cor dos tÃ­tulos</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.title_color || '#8E3D2C'} onChange={(e) => { setTheme((prev: any) => ({ ...prev, title_color: e.target.value })); setDirty(true); }} className="h-9 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer" />
                  <Input value={theme.title_color || ''} onChange={(e) => { setTheme((prev: any) => ({ ...prev, title_color: e.target.value })); setDirty(true); }} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Cor das legendas</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.caption_color || '#5F4A41'} onChange={(e) => { setTheme((prev: any) => ({ ...prev, caption_color: e.target.value })); setDirty(true); }} className="h-9 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer" />
                  <Input value={theme.caption_color || ''} onChange={(e) => { setTheme((prev: any) => ({ ...prev, caption_color: e.target.value })); setDirty(true); }} />
                </div>
              </div>
              <div className="rounded-lg border border-[#ead9cd] bg-white p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Exibir divisores entre blocos</Label>
                  <Switch
                    checked={theme.divider_enabled !== false}
                    onCheckedChange={(checked) => { setTheme((prev: any) => ({ ...prev, divider_enabled: checked })); setDirty(true); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cor do divisor</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.divider_color || '#8E3D2C'}
                      onChange={(e) => { setTheme((prev: any) => ({ ...prev, divider_color: e.target.value })); setDirty(true); }}
                      className="h-9 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
                    />
                    <Input value={theme.divider_color || ''} onChange={(e) => { setTheme((prev: any) => ({ ...prev, divider_color: e.target.value })); setDirty(true); }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Estilo do divisor</Label>
                  <Select value={theme.divider_style || 'dot'} onValueChange={(value) => { setTheme((prev: any) => ({ ...prev, divider_style: value })); setDirty(true); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Linha simples</SelectItem>
                      <SelectItem value="dot">Ponto</SelectItem>
                      <SelectItem value="ornament">Ornamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Cor de fundo</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.background_color || '#FAF4EF'} onChange={(e) => { setTheme((prev: any) => ({ ...prev, background_color: e.target.value })); setDirty(true); }} className="h-9 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer" />
                  <Input value={theme.background_color || ''} onChange={(e) => { setTheme((prev: any) => ({ ...prev, background_color: e.target.value })); setDirty(true); }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagem de fundo (blocos, exceto hero)</Label>
                {theme.background_image ? (
                  <div className="space-y-2">
                    <img src={theme.background_image} alt="Background do tema" className="w-full h-24 rounded-lg object-cover border border-[#ead9cd]" />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setTheme((prev: any) => ({ ...prev, background_image: '' })); setDirty(true); }}
                      >
                        Remover imagem
                      </Button>
                      <label className="inline-flex">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleThemeBackgroundUpload(e.target.files?.[0] || null)} disabled={uploadingThemeBg} />
                        <span className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium cursor-pointer">
                          {uploadingThemeBg ? 'Enviando...' : 'Trocar imagem'}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="mt-1 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#d8c6b7] rounded-lg cursor-pointer hover:bg-[#fff8f2]">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">{uploadingThemeBg ? 'Enviando...' : 'Enviar imagem'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleThemeBackgroundUpload(e.target.files?.[0] || null)} disabled={uploadingThemeBg} />
                  </label>
                )}
              </div>
              <div className="space-y-1">
                <Label>TransparÃªncia da imagem de fundo ({Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)))}%)</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(0, Number(theme.background_overlay_opacity ?? 50)))}
                  onChange={(e) => { setTheme((prev: any) => ({ ...prev, background_overlay_opacity: Number(e.target.value) })); setDirty(true); }}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label>Fonte do tÃ­tulo</Label>
                <Select value={theme.font_title || 'Playfair Display'} onValueChange={(value) => { setTheme((prev: any) => ({ ...prev, font_title: value })); setDirty(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Cormorant Garamond">Cormorant Garamond</SelectItem>
                    <SelectItem value="Great Vibes">Great Vibes</SelectItem>
                    <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                    <SelectItem value="Allura">Allura</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fonte do corpo</Label>
                <Select value={theme.font_body || 'Inter'} onValueChange={(value) => { setTheme((prev: any) => ({ ...prev, font_body: value })); setDirty(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Nunito">Nunito</SelectItem>
                    <SelectItem value="Work Sans">Work Sans</SelectItem>
                    <SelectItem value="Raleway">Raleway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label>Exibir cabeÃ§alho</Label>
                <Switch checked={theme?.header?.enabled !== false} onCheckedChange={(value) => { setTheme((prev: any) => ({ ...prev, header: { ...(prev?.header || {}), enabled: value } })); setDirty(true); }} />
              </div>
              <div className="space-y-1">
                <Label>Texto da marca</Label>
                <Input value={theme?.header?.brandText || 'LUMIE'} onChange={(e) => { setTheme((prev: any) => ({ ...prev, header: { ...(prev?.header || {}), brandText: e.target.value } })); setDirty(true); }} />
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => { setForm((prev) => ({ ...prev, name: e.target.value })); setDirty(true); }} />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => { setForm((prev) => ({ ...prev, slug: e.target.value })); setDirty(true); }} placeholder="automatico se vazio" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de evento</Label>
                <Select value={form.category} onValueChange={(value) => { setForm((prev) => ({ ...prev, category: value })); setDirty(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>DescriÃ§Ã£o</Label>
                <Input value={form.description} onChange={(e) => { setForm((prev) => ({ ...prev, description: e.target.value })); setDirty(true); }} />
              </div>
              <div className="space-y-1">
                <Label>Thumbnail</Label>
                <Input value={form.thumbnail} onChange={(e) => { setForm((prev) => ({ ...prev, thumbnail: e.target.value })); setDirty(true); }} placeholder="URL da thumbnail" />
                {form.thumbnail ? (
                  <img src={form.thumbnail} alt="Thumbnail do template" className="mt-2 h-24 w-full rounded-lg object-cover border border-[#ead9cd]" />
                ) : null}
                <label className="inline-flex mt-2">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleThumbnailUpload(e.target.files?.[0] || null)} disabled={uploadingThumbnail} />
                  <span className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium cursor-pointer">
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadingThumbnail ? 'Enviando...' : 'Upload da thumbnail'}
                  </span>
                </label>
              </div>
              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-medium">Presentes padrÃ£o</p>
                {templateGifts.map((gift, index) => (
                  <div key={`gift-${index}`} className="rounded-md border p-2 space-y-2">
                    <Input placeholder="Nome do presente" value={gift.name} onChange={(e) => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row))); setDirty(true); }} />
                    <Input placeholder="DescriÃ§Ã£o" value={gift.description} onChange={(e) => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, description: e.target.value } : row))); setDirty(true); }} />
                    <Input placeholder="Imagem URL (opcional)" value={gift.imageUrl} onChange={(e) => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, imageUrl: e.target.value } : row))); setDirty(true); }} />
                    {gift.imageUrl ? (
                      <img
                        src={gift.imageUrl}
                        alt={gift.name || `Imagem do presente ${index + 1}`}
                        className="h-24 w-full rounded-md object-cover border border-[#ead9cd]"
                      />
                    ) : null}
                    <div className="flex items-center gap-2">
                      <label className="inline-flex">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGiftImageUpload(index, e.target.files?.[0] || null)} disabled={uploadingGiftIndex === index} />
                        <span className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium cursor-pointer">
                          {uploadingGiftIndex === index ? 'Enviando...' : 'Upload imagem'}
                        </span>
                      </label>
                      {gift.imageUrl ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, imageUrl: '' } : row))); setDirty(true); }}>
                          <X className="w-3 h-3 mr-1" />
                          Remover imagem
                        </Button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min={0.01} step={0.01} placeholder="PreÃ§o" value={gift.basePrice} onChange={(e) => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, basePrice: Number(e.target.value || 0) } : row))); setDirty(true); }} />
                      <Input type="number" min={1} step={1} placeholder="Quantidade" value={gift.totalQuantity} onChange={(e) => { setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, totalQuantity: Number(e.target.value || 1) } : row))); setDirty(true); }} />
                    </div>
                    <Button type="button" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => { setTemplateGifts((prev) => prev.filter((_, i) => i !== index)); setDirty(true); }}>
                      Remover presente
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => { setTemplateGifts((prev) => [...prev, { name: '', description: '', imageUrl: '', basePrice: 100, totalQuantity: 1 }]); setDirty(true); }}>
                  Adicionar presente padrÃ£o
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f7efe8]">
          <div className="max-w-5xl mx-auto px-6 pb-6">
            <BlockPreview list={previewList} blocks={blocks} selectedBlock={selectedBlock} onSelectBlock={(block) => setSelectedBlockId(block.id)} gifts={previewGifts} />
          </div>
        </div>

        {selectedBlock ? (
          <div className="w-80 bg-white border-l border-[#ead9cd] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">ConfiguraÃ§Ãµes</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedBlockId(null)} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <BlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onDelete={() => deleteBlock(selectedBlock.id)} list={{ theme }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

