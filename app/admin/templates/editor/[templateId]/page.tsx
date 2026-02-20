'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BlockEditor from '@/components/builder/BlockEditor';
import BlockPreview from '@/components/builder/BlockPreview';
import { Image as ImageIcon, Layout, Music2, Sparkles, Type, Video, Globe, Plus } from 'lucide-react';
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

  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: search.get('category') || '',
    description: '',
    thumbnail: '',
    isActive: true,
  });

  const [blocks, setBlocks] = useState<any[]>(sanitizeTemplateBlocks(defaultBlocks));
  const [theme, setTheme] = useState<any>(defaultTheme);
  const [templateGifts, setTemplateGifts] = useState<TemplateGiftFormItem[]>([]);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const previewList = useMemo(() => ({ theme }), [theme]);
  const previewGifts = useMemo(
    () => [
      { id: 'g1', title: 'Presente exemplo', value: 150, quantity: 1, quantityAvailable: 1, status: 'active' },
      { id: 'g2', title: 'Presente premium', value: 450, quantity: 1, quantityAvailable: 1, status: 'active' },
    ],
    []
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
      isActive: typeof overrideIsActive === 'boolean' ? overrideIsActive : form.isActive,
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

  if (loading) return <div className="p-6">Carregando editor de template...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-[#8E3D2C]">{isNew ? 'Novo template' : 'Editar template'}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/templates">Voltar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={form.category ? `/templates?categoria=${encodeURIComponent(form.category)}` : '/templates'} target="_blank">
              Visualizar
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTemplateGifts((prev) => [...prev, { name: '', description: '', imageUrl: '', basePrice: 100, totalQuantity: 1 }]);
              setDirty(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar presentes
          </Button>
          <Button onClick={() => saveTemplate().catch(() => null)} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar template'}
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

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Configuracoes do template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="automatico se vazio" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de evento</Label>
              <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descricao</Label>
              <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Thumbnail (URL)</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label>Publicado</Label>
              <Switch checked={form.isActive} onCheckedChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tema</p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={theme.primary_color || ''} onChange={(e) => setTheme((prev: any) => ({ ...prev, primary_color: e.target.value }))} placeholder="primary" />
                <Input value={theme.secondary_color || ''} onChange={(e) => setTheme((prev: any) => ({ ...prev, secondary_color: e.target.value }))} placeholder="secondary" />
                <Input value={theme.background_color || ''} onChange={(e) => setTheme((prev: any) => ({ ...prev, background_color: e.target.value }))} placeholder="background" />
                <Input value={theme.title_color || ''} onChange={(e) => setTheme((prev: any) => ({ ...prev, title_color: e.target.value }))} placeholder="title" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Blocos</p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map((blockType) => (
                  <Button key={blockType.id} type="button" variant="outline" size="sm" onClick={() => addBlock(blockType.id)}>
                    {blockType.name}
                  </Button>
                ))}
              </div>

              <div className="rounded-lg border divide-y">
                {blocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm ${selectedBlockId === block.id ? 'bg-[#fff6ef]' : 'bg-white'}`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    {block.type} {block.enabled === false ? '(oculto)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {selectedBlock ? (
              <div className="border-t pt-3">
                <BlockEditor
                  block={selectedBlock}
                  onUpdate={(patch) => updateBlock(selectedBlock.id, patch)}
                  onDelete={() => deleteBlock(selectedBlock.id)}
                  list={{}}
                />
              </div>
            ) : null}

            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-medium">Presentes padrao do template</p>
              <p className="text-xs text-gray-500">Esses presentes entram automaticamente quando o cliente escolhe o template.</p>

              <div className="space-y-2">
                {templateGifts.map((gift, index) => (
                  <div key={`gift-${index}`} className="rounded-md border p-2 space-y-2">
                    <Input
                      placeholder="Nome do presente"
                      value={gift.name}
                      onChange={(e) =>
                        setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))
                      }
                    />
                    <Input
                      placeholder="Descricao (opcional)"
                      value={gift.description}
                      onChange={(e) =>
                        setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)))
                      }
                    />
                    <Input
                      placeholder="Imagem URL (opcional)"
                      value={gift.imageUrl}
                      onChange={(e) =>
                        setTemplateGifts((prev) => prev.map((row, i) => (i === index ? { ...row, imageUrl: e.target.value } : row)))
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        placeholder="Preco"
                        value={gift.basePrice}
                        onChange={(e) =>
                          setTemplateGifts((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, basePrice: Number(e.target.value || 0) } : row
                            )
                          )
                        }
                      />
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Quantidade"
                        value={gift.totalQuantity}
                        onChange={(e) =>
                          setTemplateGifts((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, totalQuantity: Number(e.target.value || 1) } : row
                            )
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setTemplateGifts((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remover presente
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setTemplateGifts((prev) => [
                    ...prev,
                    { name: '', description: '', imageUrl: '', basePrice: 100, totalQuantity: 1 },
                  ])
                }
              >
                Adicionar presente padrao
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Preview do template</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockPreview
              list={previewList}
              blocks={blocks}
              selectedBlock={selectedBlock}
              onSelectBlock={(block) => setSelectedBlockId(block.id)}
              gifts={previewGifts}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
