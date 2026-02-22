'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GiftModelCategory = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  thumbnail: string | null;
  isActive: boolean;
  order: number;
  itemsCount: number;
};

type GiftModelItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  totalQuantity: number;
};

type GiftModelCategoryDetail = GiftModelCategory & {
  items: GiftModelItem[];
};

type ItemDraft = {
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  totalQuantity: number;
};

export default function AdminGiftModelsPage() {
  const [categories, setCategories] = useState<GiftModelCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GiftModelCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');

  const [itemDraft, setItemDraft] = useState<ItemDraft>({
    name: '',
    description: '',
    imageUrl: '',
    basePrice: 50,
    totalQuantity: 1,
  });

  const selectedFolderPath = useMemo(() => {
    if (!selectedCategory?.slug) return '';
    return `public/gift-models/${selectedCategory.slug}`;
  }, [selectedCategory?.slug]);

  async function parseJsonSafe(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  async function loadCategories(nextSlug?: string) {
    const res = await fetch('/api/admin/gift-models', { cache: 'no-store' });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao carregar categorias');

    const nextCategories = Array.isArray(data?.categories) ? data.categories : [];
    setCategories(nextCategories);

    const slugToUse = nextSlug || selectedSlug || nextCategories[0]?.slug || '';
    setSelectedSlug(slugToUse);
    if (slugToUse) {
      await loadCategory(slugToUse);
    } else {
      setSelectedCategory(null);
    }
  }

  async function loadCategory(slug: string) {
    const res = await fetch(`/api/admin/gift-models/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao carregar categoria');
    setSelectedCategory(data?.category || null);
    setSelectedSlug(slug);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await loadCategories();
      } catch (error: any) {
        if (!cancelled) {
          alert(error?.message || 'Erro ao carregar lista de presentes');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      alert('Informe nome e slug da categoria.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/gift-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          slug: newCategorySlug,
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar categoria');
      }

      setNewCategoryName('');
      setNewCategorySlug('');
      await loadCategories(data?.category?.slug);
    } catch (error: any) {
      alert(error?.message || 'Erro ao criar categoria');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCategory() {
    if (!selectedCategory) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedCategory.name,
          slug: selectedCategory.slug,
          summary: selectedCategory.summary,
          thumbnail: selectedCategory.thumbnail,
          isActive: selectedCategory.isActive,
          order: selectedCategory.order,
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao salvar categoria');
      }

      await loadCategories(data?.category?.slug || selectedCategory.slug);
      alert('Categoria salva com sucesso.');
    } catch (error: any) {
      alert(error?.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory) return;
    if (!window.confirm(`Excluir categoria "${selectedCategory.name}"?`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}`, { method: 'DELETE' });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao excluir categoria');
      }

      await loadCategories();
    } catch (error: any) {
      alert(error?.message || 'Erro ao excluir categoria');
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncFolder() {
    if (!selectedCategory) return;

    setSyncing(true);
    try {
      const res = await fetch(`/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}/sync-folder`, {
        method: 'POST',
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao sincronizar pasta');
      }

      await loadCategory(selectedCategory.slug);
      await loadCategories(selectedCategory.slug);
      alert(`${data?.importedCount || 0} presente(s) sincronizado(s) da pasta.`);
    } catch (error: any) {
      alert(error?.message || 'Erro ao sincronizar pasta');
    } finally {
      setSyncing(false);
    }
  }

  async function handleAddItem() {
    if (!selectedCategory) return;
    if (!itemDraft.name.trim()) {
      alert('Informe o nome do presente.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemDraft),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao adicionar presente');
      }

      setItemDraft({ name: '', description: '', imageUrl: '', basePrice: 50, totalQuantity: 1 });
      await loadCategory(selectedCategory.slug);
      await loadCategories(selectedCategory.slug);
    } catch (error: any) {
      alert(error?.message || 'Erro ao adicionar presente');
    } finally {
      setSaving(false);
    }
  }

  async function handleItemImageUpload(file?: File | null) {
    if (!file) return;

    setUploadingItemImage(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('folder', 'gift-models-admin');

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erro ao enviar imagem');
      }

      setItemDraft((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error: any) {
      alert(error?.message || 'Erro ao enviar imagem');
    } finally {
      setUploadingItemImage(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!selectedCategory) return;
    if (!window.confirm('Excluir este presente do modelo?')) return;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}/items/${encodeURIComponent(itemId)}`,
        { method: 'DELETE' }
      );
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao excluir presente');
      }

      await loadCategory(selectedCategory.slug);
      await loadCategories(selectedCategory.slug);
    } catch (error: any) {
      alert(error?.message || 'Erro ao excluir presente');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditItem(item: GiftModelItem) {
    if (!selectedCategory) return;

    const nextName = window.prompt('Nome do presente:', item.name);
    if (nextName === null) return;

    const nextDescription = window.prompt('Descricao do presente:', item.description || '');
    if (nextDescription === null) return;

    const nextImageUrl = window.prompt('URL da imagem:', item.imageUrl || '');
    if (nextImageUrl === null) return;

    const nextPriceRaw = window.prompt('Preco (entre 50 e 400):', String(item.basePrice));
    if (nextPriceRaw === null) return;

    const nextPrice = Number(nextPriceRaw);
    if (!Number.isFinite(nextPrice) || nextPrice < 50 || nextPrice > 400) {
      alert('Preco invalido. Informe um valor entre 50 e 400.');
      return;
    }

    const nextQtyRaw = window.prompt('Quantidade total:', String(item.totalQuantity));
    if (nextQtyRaw === null) return;

    const nextQty = Number(nextQtyRaw);
    if (!Number.isInteger(nextQty) || nextQty <= 0) {
      alert('Quantidade invalida.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/gift-models/${encodeURIComponent(selectedCategory.slug)}/items/${encodeURIComponent(item.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nextName,
            description: nextDescription,
            imageUrl: nextImageUrl,
            basePrice: nextPrice,
            totalQuantity: nextQty,
          }),
        }
      );
      const data = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao editar presente');
      }

      await loadCategory(selectedCategory.slug);
      await loadCategories(selectedCategory.slug);
    } catch (error: any) {
      alert(error?.message || 'Erro ao editar presente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Base de listas prontas de presentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Gerencie os temas de presentes prontos que aparecem no botao "Modelos prontos" do dashboard do cliente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Label>Nome da categoria</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Presentes de 15 anos" />
            </div>
            <div>
              <Label>Slug da pasta/categoria</Label>
              <Input value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} placeholder="Ex: presentes-15-anos" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateCategory} disabled={saving}>Criar categoria</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Categorias cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-600">Carregando categorias...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma categoria criada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => loadCategory(category.slug).catch((error) => alert(error.message))}
                  className={`rounded-xl border px-4 py-3 text-left ${selectedSlug === category.slug ? 'bg-[#fff4ea] border-[#d9b9a4]' : 'bg-white border-[#ead9cd]'}`}
                >
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-gray-500 mt-1">/{category.slug}</p>
                  <p className="text-xs text-gray-500 mt-1">{category.itemsCount} presentes</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCategory ? (
        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Categoria selecionada: {selectedCategory.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                />
              </div>
              <div>
                <Label>Slug (tambem nome da pasta)</Label>
                <Input
                  value={selectedCategory.slug}
                  onChange={(e) => setSelectedCategory((prev) => (prev ? { ...prev, slug: e.target.value } : prev))}
                />
              </div>
            </div>

            <div>
              <Label>Resumo</Label>
              <Input
                value={selectedCategory.summary || ''}
                onChange={(e) => setSelectedCategory((prev) => (prev ? { ...prev, summary: e.target.value } : prev))}
              />
            </div>

            <div>
              <Label>Thumbnail da categoria (URL opcional)</Label>
              <Input
                value={selectedCategory.thumbnail || ''}
                onChange={(e) => setSelectedCategory((prev) => (prev ? { ...prev, thumbnail: e.target.value || null } : prev))}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleUpdateCategory} disabled={saving}>Salvar categoria</Button>
              <Button variant="outline" onClick={handleSyncFolder} disabled={syncing || saving}>Sincronizar da pasta local</Button>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={handleDeleteCategory} disabled={saving}>
                Excluir categoria
              </Button>
            </div>

            <p className="text-xs text-gray-600">
              Pasta local desta categoria: <span className="font-mono">{selectedFolderPath}</span>
            </p>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Adicionar presente manualmente</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleItemImageUpload(e.target.files?.[0] || null)}
                    disabled={uploadingItemImage || saving}
                  />
                  <span className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer">
                    {uploadingItemImage ? 'Enviando imagem...' : 'Upload de imagem'}
                  </span>
                </label>
                {itemDraft.imageUrl ? (
                  <p className="text-xs text-gray-500 self-center truncate max-w-full">{itemDraft.imageUrl}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Nome"
                  value={itemDraft.name}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="URL da imagem"
                  value={itemDraft.imageUrl}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
                <Input
                  placeholder="Descricao"
                  value={itemDraft.description}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  type="number"
                  min={50}
                  max={400}
                  placeholder="Preco"
                  value={itemDraft.basePrice}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, basePrice: Number(e.target.value) }))}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Quantidade"
                  value={itemDraft.totalQuantity}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, totalQuantity: Number(e.target.value) }))}
                />
                <div className="flex items-end">
                  <Button onClick={handleAddItem} disabled={saving}>Adicionar presente</Button>
                </div>
              </div>
            </div>

            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-[#faf3ee]">
                  <tr>
                    <th className="p-2 text-left">Presente</th>
                    <th className="p-2 text-left">Preco</th>
                    <th className="p-2 text-left">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCategory.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description || 'Sem descricao'}</p>
                        <p className="text-xs text-gray-500">{item.imageUrl || 'Sem imagem'}</p>
                      </td>
                      <td className="p-2">R$ {item.basePrice.toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditItem(item)} disabled={saving}>
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={saving}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {selectedCategory.items.length === 0 ? (
                    <tr>
                      <td className="p-3 text-sm text-gray-500" colSpan={3}>
                        Nenhum presente nesta categoria.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
