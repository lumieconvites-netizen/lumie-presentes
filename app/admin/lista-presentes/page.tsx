'use client';

import { ChangeEvent, useEffect, useMemo, useState, type UIEvent } from 'react';
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

type ClientGiftList = {
  id: string;
  title: string;
  slug: string;
  user: {
    email: string;
    name: string | null;
    referredByPartner?: { id: string; name: string | null; email: string } | null;
    referredByAmbassador?: { id: string; name: string | null; email: string } | null;
  };
  _count: { gifts: number; orders: number; messages: number };
};

type ClientGiftItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number | string;
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

const CLIENT_LIST_PAGE_SIZE = 10;

export default function AdminGiftModelsPage() {
  const [categories, setCategories] = useState<GiftModelCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GiftModelCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [uploadingCategoryThumbnail, setUploadingCategoryThumbnail] = useState(false);
  const [clientListQuery, setClientListQuery] = useState('');
  const [clientLists, setClientLists] = useState<ClientGiftList[]>([]);
  const [clientListsTotal, setClientListsTotal] = useState(0);
  const [clientListsHasMore, setClientListsHasMore] = useState(false);
  const [clientListsLoading, setClientListsLoading] = useState(false);
  const [selectedClientList, setSelectedClientList] = useState<ClientGiftList | null>(null);
  const [clientGifts, setClientGifts] = useState<ClientGiftItem[]>([]);
  const [selectedClientGiftIds, setSelectedClientGiftIds] = useState<string[]>([]);
  const [importTargetSlug, setImportTargetSlug] = useState('');
  const [importingClientGifts, setImportingClientGifts] = useState(false);

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

  async function loadClientLists(options: { reset?: boolean } = {}) {
    if (clientListsLoading) return;
    setClientListsLoading(true);
    const skip = options.reset ? 0 : clientLists.length;
    const params = new URLSearchParams();
    if (clientListQuery.trim()) params.set('q', clientListQuery.trim());
    params.set('take', String(CLIENT_LIST_PAGE_SIZE));
    params.set('skip', String(skip));
    try {
      const res = await fetch(`/api/admin/gift-lists?${params.toString()}`, { cache: 'no-store' });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar listas de clientes');
      const nextLists = Array.isArray(data?.giftLists) ? data.giftLists : [];
      setClientLists((current) => (options.reset ? nextLists : [...current, ...nextLists]));
      setClientListsTotal(data?.total || nextLists.length);
      setClientListsHasMore(Boolean(data?.hasMore));
    } finally {
      setClientListsLoading(false);
    }
  }

  function handleClientListScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
    if (nearBottom && clientListsHasMore && !clientListsLoading) {
      loadClientLists().catch((error) => alert(error.message));
    }
  }

  async function loadClientGifts(list: ClientGiftList) {
    const res = await fetch(`/api/admin/gift-lists/${list.id}/gifts`, { cache: 'no-store' });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao carregar presentes do cliente');

    const gifts = Array.isArray(data?.gifts) ? data.gifts : [];
    setSelectedClientList(list);
    setClientGifts(gifts);
    setSelectedClientGiftIds(gifts.map((gift: ClientGiftItem) => gift.id));
    setImportTargetSlug(selectedCategory?.slug || selectedSlug || categories[0]?.slug || '');
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

  useEffect(() => {
    loadClientLists({ reset: true }).catch((error) => alert(error.message));
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

  async function handleCategoryThumbnailUpload(file?: File | null) {
    if (!file || !selectedCategory) return;

    setUploadingCategoryThumbnail(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('folder', `gift-models-thumbnail-${selectedCategory.slug}`);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erro ao enviar thumbnail');
      }

      setSelectedCategory((prev) => (prev ? { ...prev, thumbnail: data.url } : prev));
    } catch (error: any) {
      alert(error?.message || 'Erro ao enviar thumbnail');
    } finally {
      setUploadingCategoryThumbnail(false);
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

    const nextDescription = window.prompt('Descrição do presente:', item.description || '');
    if (nextDescription === null) return;

    const nextImageUrl = window.prompt('URL da imagem:', item.imageUrl || '');
    if (nextImageUrl === null) return;

    const nextPriceRaw = window.prompt('Preço (entre 50 e 400):', String(item.basePrice));
    if (nextPriceRaw === null) return;

    const nextPrice = Number(nextPriceRaw);
    if (!Number.isFinite(nextPrice) || nextPrice < 50 || nextPrice > 400) {
      alert('Preço inválido. Informe um valor entre 50 e 400.');
      return;
    }

    const nextQtyRaw = window.prompt('Quantidade total:', String(item.totalQuantity));
    if (nextQtyRaw === null) return;

    const nextQty = Number(nextQtyRaw);
    if (!Number.isInteger(nextQty) || nextQty <= 0) {
      alert('Quantidade inválida.');
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

  async function handleImportClientGifts() {
    if (!selectedClientList) return;
    if (!importTargetSlug) {
      alert('Escolha a categoria de destino.');
      return;
    }
    if (!selectedClientGiftIds.length) {
      alert('Selecione pelo menos um presente.');
      return;
    }

    setImportingClientGifts(true);
    try {
      const res = await fetch(`/api/admin/gift-lists/${selectedClientList.id}/copy-gifts-to-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug: importTargetSlug,
          giftIds: selectedClientGiftIds,
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Erro ao importar presentes do cliente');

      alert(`${data?.importedCount || selectedClientGiftIds.length} presente(s) importado(s).`);
      await loadCategories(importTargetSlug);
      await loadCategory(importTargetSlug);
      setSelectedClientList(null);
      setClientGifts([]);
      setSelectedClientGiftIds([]);
    } catch (error: any) {
      alert(error?.message || 'Erro ao importar presentes');
    } finally {
      setImportingClientGifts(false);
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
            Gerencie os temas de presentes prontos que aparecem no botão "Modelos prontos" do dashboard do cliente.
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
          <CardTitle>Importar presentes de uma lista de cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Busque uma lista real, veja os presentes e escolha quais itens entram nos modelos prontos.
          </p>

          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar cliente, lista, slug ou e-mail"
              value={clientListQuery}
              onChange={(e) => setClientListQuery(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" onClick={() => loadClientLists({ reset: true }).catch((error) => alert(error.message))}>
              Buscar listas
            </Button>
            <p className="self-center text-xs text-gray-500">
              {clientLists.length} de {clientListsTotal || clientLists.length}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="max-h-[480px] overflow-auto rounded-lg border bg-white" onScroll={handleClientListScroll}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#faf3ee]">
                  <tr>
                    <th className="p-2 text-left">Lista</th>
                    <th className="p-2 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLists.map((list) => (
                    <tr key={list.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{list.title}</p>
                        <p className="text-xs text-gray-500">/{list.slug}</p>
                        <p className="text-xs text-gray-500">{list.user.name || 'Sem nome'} - {list.user.email}</p>
                        {list.user.referredByPartner ? (
                          <p className="text-xs text-[#8E3D2C]">Parceiro: {list.user.referredByPartner.name || list.user.referredByPartner.email}</p>
                        ) : null}
                        {list.user.referredByAmbassador ? (
                          <p className="text-xs text-[#8E3D2C]">Embaixador: {list.user.referredByAmbassador.name || list.user.referredByAmbassador.email}</p>
                        ) : null}
                        <p className="text-xs text-gray-500">{list._count.gifts} presentes</p>
                      </td>
                      <td className="p-2">
                        <Button size="sm" variant="outline" onClick={() => loadClientGifts(list).catch((error) => alert(error.message))}>
                          Ver presentes
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!clientLists.length ? (
                    <tr>
                      <td className="p-3 text-sm text-gray-500" colSpan={2}>
                        Nenhuma lista encontrada.
                      </td>
                    </tr>
                  ) : null}
                  {clientListsLoading ? (
                    <tr>
                      <td className="p-3 text-sm text-gray-500" colSpan={2}>
                        Carregando mais listas...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border bg-[#fffaf6] p-3">
              {selectedClientList ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#8E3D2C]">{selectedClientList.title}</p>
                      <p className="text-xs text-gray-500">/{selectedClientList.slug}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/site/${selectedClientList.slug}/presentes`} target="_blank" rel="noreferrer">Abrir página</a>
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="max-h-[420px] overflow-auto rounded-lg border bg-white">
                      {clientGifts.map((gift) => {
                        const checked = selectedClientGiftIds.includes(gift.id);
                        return (
                          <label key={gift.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#8E3D2C]"
                              checked={checked}
                              onChange={(event) => {
                                setSelectedClientGiftIds((current) =>
                                  event.target.checked ? [...current, gift.id] : current.filter((id) => id !== gift.id)
                                );
                              }}
                            />
                            {gift.imageUrl ? (
                              <img src={gift.imageUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
                            ) : (
                              <span className="h-14 w-14 rounded-md bg-[#f3e6dc]" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{gift.name}</span>
                              <span className="block text-xs text-gray-500">
                                R$ {Number(gift.basePrice || 0).toFixed(2)} - qtd. {gift.totalQuantity}
                              </span>
                              {gift.description ? <span className="block truncate text-xs text-gray-500">{gift.description}</span> : null}
                            </span>
                          </label>
                        );
                      })}
                      {!clientGifts.length ? (
                        <p className="p-3 text-sm text-gray-500">Essa lista não tem presentes.</p>
                      ) : null}
                    </div>

                    <div className="space-y-3 rounded-lg border bg-white p-3">
                      <div>
                        <Label>Categoria de destino</Label>
                        <select
                          className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={importTargetSlug}
                          onChange={(e) => setImportTargetSlug(e.target.value)}
                        >
                          <option value="">Escolha uma categoria</option>
                          {categories.map((category) => (
                            <option key={category.slug} value={category.slug}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button className="w-full" onClick={handleImportClientGifts} disabled={importingClientGifts || !selectedClientGiftIds.length}>
                        {importingClientGifts ? 'Importando...' : 'Adicionar selecionados'}
                      </Button>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedClientGiftIds(clientGifts.map((gift) => gift.id))}>
                          Selecionar todos
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedClientGiftIds([])}>
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed bg-white text-sm text-gray-500">
                  Escolha uma lista ao lado para visualizar os presentes antes de importar.
                </div>
              )}
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
                <Label>Slug (também nome da pasta)</Label>
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
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleCategoryThumbnailUpload(e.target.files?.[0] || null)}
                    disabled={uploadingCategoryThumbnail || saving}
                  />
                  <span className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer">
                    {uploadingCategoryThumbnail ? 'Enviando thumbnail...' : 'Upload thumbnail'}
                  </span>
                </label>
                {selectedCategory.thumbnail ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedCategory((prev) => (prev ? { ...prev, thumbnail: null } : prev))}
                    disabled={uploadingCategoryThumbnail || saving}
                  >
                    Remover thumbnail
                  </Button>
                ) : null}
              </div>
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
                  placeholder="Descrição"
                  value={itemDraft.description}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  type="number"
                  min={50}
                  max={400}
                  placeholder="Preço"
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

            <div className="max-h-[520px] overflow-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#faf3ee]">
                  <tr>
                    <th className="p-2 text-left">Presente</th>
                    <th className="p-2 text-left">Preço</th>
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCategory.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.description || 'Sem descrição'}</p>
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

