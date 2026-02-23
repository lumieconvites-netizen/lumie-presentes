'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Copy, Trash2, Boxes, Upload, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import Link from 'next/link';

type GiftRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  totalQuantity: number;
  availableQty: number;
};

type GiftDraft = {
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  totalQuantity: number;
};

const feePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 11.99);

function withFee(value: number, feePassedToGuest: boolean) {
  if (!feePassedToGuest) return value;
  return Number((value * (1 + feePercent / 100)).toFixed(2));
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init ?? {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default function PresentesDashboard() {
  const { settings } = useUser();
  const [giftListId, setGiftListId] = useState<string>('');
  const [giftListSlug, setGiftListSlug] = useState<string>('');
  const [giftListFeeMode, setGiftListFeeMode] = useState<'PASS_TO_GUEST' | 'ABSORB'>('PASS_TO_GUEST');
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openQty, setOpenQty] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [savingListTexts, setSavingListTexts] = useState(false);
  const [publishingPresents, setPublishingPresents] = useState(false);
  const [uploadingDraftPhoto, setUploadingDraftPhoto] = useState(false);
  const [uploadingListCover, setUploadingListCover] = useState(false);
  const [bankAccountConfigured, setBankAccountConfigured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

  const [draft, setDraft] = useState<GiftDraft>({
    name: '',
    description: '',
    basePrice: 150,
    imageUrl: '',
    totalQuantity: 1,
  });
  const [listPageTitle, setListPageTitle] = useState('Minha Lista de Presentes');
  const [listPageMessage, setListPageMessage] = useState('Ajude a realizar nossos sonhos!');
  const [listPageCoverImage, setListPageCoverImage] = useState('');

  const editingGift = useMemo(() => gifts.find((g) => g.id === editingId) ?? null, [gifts, editingId]);

  const filteredGifts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return gifts;
    return gifts.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q));
  }, [gifts, searchTerm]);

  async function loadGiftListAndGifts() {
    setLoading(true);
    try {
      const glRes = await fetchWithTimeout('/api/gift-lists/my-list?view=presentes', { cache: 'no-store' });
      const glData = await parseJsonSafe(glRes);
      if (!glRes.ok) throw new Error(glData?.error ?? 'Erro ao carregar lista');
      setGiftListId(glData.id);
      setGiftListSlug(glData.slug || '');
      setGiftListFeeMode(glData?.feeMode === 'ABSORB' ? 'ABSORB' : 'PASS_TO_GUEST');
      setIsPublished(Boolean(glData?.isPublished));
      setListPageTitle(glData?.title || 'Minha Lista de Presentes');
      setListPageMessage(glData?.description || '');
      setBankAccountConfigured(Boolean(glData?.bankAccountConfigured));

      const theme = (glData?.pageLayout?.theme ?? {}) as Record<string, any>;
      setListPageCoverImage(typeof theme.gifts_page_cover_image === 'string' ? theme.gifts_page_cover_image : '');

      setGifts((glData?.gifts ?? []).map((row: any) => ({
        ...row,
        basePrice: Number(row.basePrice),
      })));
      setSelectionMode(false);
      setSelectedIds([]);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        alert('O carregamento demorou demais. Tente novamente em alguns segundos.');
      } else {
        alert(error?.message ?? 'Erro ao carregar presentes');
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveListTexts() {
    setSavingListTexts(true);
    try {
      const [giftListRes, layoutRes] = await Promise.all([
        fetch('/api/gift-lists/my-list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: listPageTitle.trim() || 'Minha Lista de Presentes',
            description: listPageMessage.trim(),
          }),
        }),
        giftListId
          ? fetch(`/api/gift-lists/${encodeURIComponent(giftListId)}/layout`, { cache: 'no-store' })
          : Promise.resolve(null as any),
      ]);

      const data = await parseJsonSafe(giftListRes);
      if (!giftListRes.ok) throw new Error(data?.error ?? 'Erro ao salvar textos');

      if (giftListId && layoutRes) {
        const layoutData = await parseJsonSafe(layoutRes);
        if (!layoutRes.ok) {
          throw new Error(layoutData?.error ?? 'Erro ao carregar layout para salvar capa');
        }

        const currentTheme = (layoutData?.theme ?? {}) as Record<string, any>;
        const layoutSaveRes = await fetch(`/api/gift-lists/${encodeURIComponent(giftListId)}/layout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks: layoutData?.blocks ?? [],
            customCss: layoutData?.customCss ?? null,
            theme: {
              ...currentTheme,
              gifts_page_cover_image: listPageCoverImage || '',
            },
          }),
        });
        const layoutSaveData = await parseJsonSafe(layoutSaveRes);
        if (!layoutSaveRes.ok) {
          throw new Error(layoutSaveData?.error ?? 'Erro ao salvar capa da página de presentes');
        }
      }

      return { ok: true as const };
    } catch (error: any) {
      return { ok: false as const, error: error?.message ?? 'Erro ao salvar textos' };
    } finally {
      setSavingListTexts(false);
    }
  }

  async function handlePublishPresents() {
    if (!bankAccountConfigured) {
      alert('Cadastre a conta bancária antes de publicar os presentes.');
      return;
    }

    setPublishingPresents(true);
    try {
      const saveResult = await saveListTexts();
      if (!saveResult.ok) {
        throw new Error(saveResult.error);
      }

      const publishRes = await fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: true }),
      });
      const publishData = await parseJsonSafe(publishRes);
      if (!publishRes.ok) {
        throw new Error(publishData?.error ?? 'Erro ao publicar presentes');
      }

      setIsPublished(true);
      alert('Presentes publicados com sucesso.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao publicar presentes');
    } finally {
      setPublishingPresents(false);
    }
  }

  async function handleListCoverUpload(file?: File | null) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('Imagem maior que 5MB. Escolha um arquivo de até 5MB.');
      return;
    }

    try {
      setUploadingListCover(true);
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'gifts-page-cover');

      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Falha no upload da capa');
      }

      setListPageCoverImage(data.url as string);
    } catch (error: any) {
      alert(error?.message ?? 'Erro no upload da capa');
    } finally {
      setUploadingListCover(false);
    }
  }

  async function handleRemoveListCover() {
    setListPageCoverImage('');
  }

  useEffect(() => {
    loadGiftListAndGifts();
  }, []);

  const uploadGiftPhoto = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('Imagem maior que 5MB. Escolha um arquivo de até 5MB.');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'gifts');

    const res = await fetch('/api/upload/avatar', { method: 'POST', body: form });
    const data = await parseJsonSafe(res);

    if (!res.ok || !data?.url) {
      throw new Error(data?.error ?? 'Falha no upload da imagem');
    }

    return data.url as string;
  };

  const handleDraftPhotoUpload = async (file?: File | null) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('Imagem maior que 5MB. Escolha um arquivo de até 5MB.');
      return;
    }

    try {
      setUploadingDraftPhoto(true);
      const url = await uploadGiftPhoto(file);
      setDraft((prev) => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      alert(error?.message ?? 'Erro no upload da imagem');
    } finally {
      setUploadingDraftPhoto(false);
    }
  };

  async function handleCreate() {
    if (!giftListId) return;
    if (!draft.name.trim()) return alert('Nome do presente é obrigatório.');

    const payload = {
      giftListId,
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      imageUrl: draft.imageUrl || undefined,
      basePrice: Number(draft.basePrice || 0),
      totalQuantity: Math.max(1, Number(draft.totalQuantity || 1)),
    };

    const res = await fetch('/api/gifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return alert(data?.error ?? 'Erro ao criar presente');

    setOpenCreate(false);
    setDraft({ name: '', description: '', basePrice: 150, imageUrl: '', totalQuantity: 1 });
    await loadGiftListAndGifts();
  }

  function handleOpenEdit(id: string) {
    const gift = gifts.find((g) => g.id === id);
    if (!gift) return;

    setEditingId(id);
    setDraft({
      name: gift.name,
      description: gift.description ?? '',
      basePrice: Number(gift.basePrice),
      imageUrl: gift.imageUrl ?? '',
      totalQuantity: gift.totalQuantity,
    });
    setOpenEdit(true);
  }

  async function handleSaveEdit() {
    if (!editingId) return;

    const res = await fetch(`/api/gifts/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        imageUrl: draft.imageUrl || '',
        basePrice: Number(draft.basePrice || 0),
        totalQuantity: Math.max(1, Number(draft.totalQuantity || 1)),
      }),
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) return alert(data?.error ?? 'Erro ao salvar presente');

    setOpenEdit(false);
    setEditingId(null);
    await loadGiftListAndGifts();
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/gifts/${id}/duplicate`, { method: 'POST' });
    const data = await parseJsonSafe(res);
    if (!res.ok) return alert(data?.error ?? 'Erro ao duplicar presente');
    await loadGiftListAndGifts();
  }

  function handleOpenQty(id: string) {
    setEditingId(id);
    setQtyToAdd(1);
    setOpenQty(true);
  }

  async function handleAddQty() {
    if (!editingId || !editingGift) return;
    const nextTotal = editingGift.totalQuantity + Math.max(1, Number(qtyToAdd || 1));

    const res = await fetch(`/api/gifts/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalQuantity: nextTotal }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) return alert(data?.error ?? 'Erro ao adicionar quantidade');

    setOpenQty(false);
    setEditingId(null);
    await loadGiftListAndGifts();
  }

  function handleDelete(id: string) {
    setSelectionMode(true);
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function toggleSelectGift(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Excluir ${selectedIds.length} presente(s) selecionado(s)?`)) return;

    try {
      setDeletingSelected(true);
      setDeletingIds(selectedIds);
      for (const id of selectedIds) {
        const res = await fetch(`/api/gifts/${id}`, { method: 'DELETE' });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.error ?? 'Erro ao excluir presentes');
      }
      setSelectionMode(false);
      setSelectedIds([]);
      await loadGiftListAndGifts();
      alert('Presentes excluídos com sucesso.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao excluir presentes');
    } finally {
      setDeletingSelected(false);
      setDeletingIds([]);
    }
  }

  const primary = settings?.theme?.primary_color ?? '#C86E52';

  return (
    <div className="min-h-screen bg-[#fbf8f5]">
      <div className="bg-[#fbf8f5] border-b border-[#ead9cd] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Meus Presentes</h1>
              <p className="text-gray-600 mt-1">
                {filteredGifts.length} {filteredGifts.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {selectionMode && (
                <>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteSelected}
                    disabled={selectedIds.length === 0 || deletingSelected}
                  >
                    {deletingSelected ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    {deletingSelected ? 'Excluindo...' : `Excluir selecionados (${selectedIds.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds([]);
                    }}
                    disabled={deletingSelected}
                  >
                    Cancelar seleção
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full sm:w-auto" asChild disabled={loading}>
                <Link href="/dashboard/presentes/modelos">Modelos prontos</Link>
              </Button>
              <Button onClick={() => setOpenCreate(true)} style={{ backgroundColor: primary }} className="text-white hover:opacity-90 w-full sm:w-auto" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Presente
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input type="search" placeholder="Buscar presentes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            {selectionMode && (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedIds.length === filteredGifts.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(filteredGifts.map((g) => g.id));
                  }
                }}
                disabled={filteredGifts.length === 0 || deletingSelected}
              >
                {selectedIds.length === filteredGifts.length && filteredGifts.length > 0 ? 'Limpar seleção' : 'Selecionar todos'}
              </Button>
            )}
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={giftListSlug ? `/site/${encodeURIComponent(giftListSlug)}/presentes` : '/site/presentes'} target="_blank">
                Ver página de presentes
              </Link>
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-[#ead9cd] p-4 bg-white space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Página de Presentes (site público)</h2>
            <Input
              value={listPageTitle}
              onChange={(e) => setListPageTitle(e.target.value)}
              placeholder="Título da página de presentes"
            />
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Foto de capa da página de presentes (recomendado: horizontal 16:9, até 5MB)</p>
              {listPageCoverImage ? (
                <div className="space-y-2">
                  <img src={listPageCoverImage} alt="Prévia da capa da página de presentes" className="h-36 w-full rounded-md object-cover border border-[#ead9cd]" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4" /> {uploadingListCover ? 'Enviando capa...' : 'Trocar capa'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleListCoverUpload(e.target.files?.[0])} disabled={uploadingListCover} />
                    </label>
                    <Button type="button" variant="outline" onClick={handleRemoveListCover} disabled={uploadingListCover || savingListTexts}>
                      Remover capa
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 w-fit">
                  <Upload className="w-4 h-4" /> {uploadingListCover ? 'Enviando capa...' : 'Upload capa 16:9'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleListCoverUpload(e.target.files?.[0])} disabled={uploadingListCover} />
                </label>
              )}
            </div>
            <Textarea
              value={listPageMessage}
              onChange={(e) => setListPageMessage(e.target.value)}
              placeholder="Mensagem especial para os convidados"
              rows={3}
            />
            {!bankAccountConfigured ? (
              <p className="text-xs text-amber-700">
                Cadastre sua conta bancária em <b>Conta Bancária</b> para publicar os presentes.
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                onClick={handlePublishPresents}
                style={{ backgroundColor: primary }}
                className="text-white hover:opacity-90"
                disabled={savingListTexts || publishingPresents || uploadingListCover || !bankAccountConfigured || isPublished}
              >
                {isPublished
                  ? 'Presentes publicados'
                  : publishingPresents || savingListTexts
                    ? 'Publicando...'
                    : 'Publicar presentes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎀</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nada por aqui ainda</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro presente para começar.</p>
            <Button onClick={() => setOpenCreate(true)} style={{ backgroundColor: primary }} className="text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Criar presente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const valueShown = withFee(Number(gift.basePrice), giftListFeeMode === 'PASS_TO_GUEST');
              const soldOut = gift.availableQty <= 0;

              return (
                <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow border-[#ead9cd] bg-white">
                  <div className="relative w-full h-56 bg-gradient-to-br from-[#f5eadf] to-[#f1e3d6]">
                    {selectionMode && (
                      <label className="absolute top-3 left-3 z-10 h-7 w-7 rounded-md bg-white/95 border border-[#e7d8cb] flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#c65a3a]"
                          checked={selectedIds.includes(gift.id)}
                          onChange={() => toggleSelectGift(gift.id)}
                        />
                      </label>
                    )}
                    {gift.imageUrl ? (
                      <Image src={gift.imageUrl} alt={gift.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Boxes className="w-14 h-14 text-[#c8a27a]" />
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${soldOut ? 'bg-[#d89a84] text-white' : 'bg-[#22c55e] text-white'}`}>
                      {soldOut ? 'Esgotado' : 'Disponível'}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-semibold text-lg md:text-xl text-gray-900 leading-tight mb-2">{gift.name}</h3>

                    {gift.description ? (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gift.description}</p>
                    ) : (
                      <p className="text-gray-400 text-sm mb-4">Sem descrição</p>
                    )}

                    <div className="flex items-end justify-between mb-4 gap-3">
                      <div>
                        <p className="text-2xl md:text-3xl font-bold" style={{ color: primary }}>{formatBRL(valueShown)}</p>
                        <p className="text-xs text-gray-500 mt-1">{giftListFeeMode === 'PASS_TO_GUEST' ? 'Valor com taxa' : 'Valor do presente'}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">{gift.availableQty}/{gift.totalQuantity} disponíveis</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" className="h-10" onClick={() => handleOpenEdit(gift.id)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" className="h-10" onClick={() => handleDuplicate(gift.id)} title="Duplicar">
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" className="h-10" onClick={() => handleOpenQty(gift.id)} title="Adicionar quantidade">
                        <Plus className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(gift.id)}
                        title="Selecionar para excluir"
                        disabled={deletingIds.includes(gift.id)}
                      >
                        {deletingIds.includes(gift.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo presente</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os dados para criar um novo presente na sua lista.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Título" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input placeholder="Descrição" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            <Input placeholder="URL da foto (opcional)" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            {draft.imageUrl ? (
              <div className="rounded-md border border-[#ead9cd] bg-white p-2">
                <img src={draft.imageUrl} alt="Prévia do presente" className="h-32 w-full rounded-md object-cover" />
              </div>
            ) : null}
            <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" /> {uploadingDraftPhoto ? 'Enviando foto...' : 'Upload de foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftPhotoUpload(e.target.files?.[0])} disabled={uploadingDraftPhoto} />
            </label>
            <p className="text-xs text-gray-500">Recomendado: formato horizontal 16:9. Limite de 5MB por foto.</p>

            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Valor" value={draft.basePrice} onChange={(e) => setDraft((d) => ({ ...d, basePrice: Number(e.target.value) }))} />
              <Input type="number" placeholder="Quantidade" value={draft.totalQuantity} onChange={(e) => setDraft((d) => ({ ...d, totalQuantity: Number(e.target.value) }))} />
            </div>

            <div className="text-xs text-muted-foreground">Valor exibido ao convidado: <span className="font-medium">{formatBRL(withFee(draft.basePrice, giftListFeeMode === 'PASS_TO_GUEST'))}</span></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} style={{ backgroundColor: primary }} className="text-white hover:opacity-90">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar presente</DialogTitle>
            <DialogDescription className="sr-only">
              Atualize as informacoes do presente selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Título" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input placeholder="Descrição" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            <Input placeholder="URL da foto (opcional)" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            {draft.imageUrl ? (
              <div className="rounded-md border border-[#ead9cd] bg-white p-2">
                <img src={draft.imageUrl} alt="Prévia do presente" className="h-32 w-full rounded-md object-cover" />
              </div>
            ) : null}
            <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" /> {uploadingDraftPhoto ? 'Enviando foto...' : 'Upload de foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftPhotoUpload(e.target.files?.[0])} disabled={uploadingDraftPhoto} />
            </label>
            <p className="text-xs text-gray-500">Recomendado: formato horizontal 16:9. Limite de 5MB por foto.</p>

            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Valor" value={draft.basePrice} onChange={(e) => setDraft((d) => ({ ...d, basePrice: Number(e.target.value) }))} />
              <Input type="number" placeholder="Quantidade" value={draft.totalQuantity} onChange={(e) => setDraft((d) => ({ ...d, totalQuantity: Number(e.target.value) }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} style={{ backgroundColor: primary }} className="text-white hover:opacity-90">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openQty} onOpenChange={setOpenQty}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar quantidade</DialogTitle>
            <DialogDescription className="sr-only">
              Informe quantas unidades deseja adicionar ao presente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input type="number" placeholder="Quantidade a adicionar" value={qtyToAdd} onChange={(e) => setQtyToAdd(Number(e.target.value))} />
            <div className="text-xs text-muted-foreground">Isso aumenta quantidade total e disponível.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenQty(false)}>Cancelar</Button>
            <Button onClick={handleAddQty} style={{ backgroundColor: primary }} className="text-white hover:opacity-90">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
