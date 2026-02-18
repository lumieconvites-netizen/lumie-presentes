'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  const editingGift = useMemo(() => gifts.find((g) => g.id === editingId) ?? null, [gifts, editingId]);

  const filteredGifts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return gifts;
    return gifts.filter((g) => g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q));
  }, [gifts, searchTerm]);

  async function loadGiftListAndGifts() {
    setLoading(true);
    try {
      const glRes = await fetch('/api/gift-lists/my-list', { cache: 'no-store' });
      const glData = await parseJsonSafe(glRes);
      if (!glRes.ok) throw new Error(glData?.error ?? 'Erro ao carregar lista');
      setGiftListId(glData.id);
      setGiftListSlug(glData.slug || '');
      setGiftListFeeMode(glData?.feeMode === 'ABSORB' ? 'ABSORB' : 'PASS_TO_GUEST');
      setListPageTitle(glData?.title || 'Minha Lista de Presentes');
      setListPageMessage(glData?.description || '');

      const giftsRes = await fetch(`/api/gifts?giftListId=${encodeURIComponent(glData.id)}`, { cache: 'no-store' });
      const giftsData = await parseJsonSafe(giftsRes);
      if (!giftsRes.ok) throw new Error(giftsData?.error ?? 'Erro ao carregar presentes');
      setGifts((giftsData ?? []).map((row: any) => ({
        ...row,
        basePrice: Number(row.basePrice),
      })));
      setSelectionMode(false);
      setSelectedIds([]);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao carregar presentes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveListTexts() {
    setSavingListTexts(true);
    try {
      const res = await fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listPageTitle.trim() || 'Minha Lista de Presentes',
          description: listPageMessage.trim(),
        }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao salvar textos');
      alert('Textos da página de presentes salvos.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao salvar textos');
    } finally {
      setSavingListTexts(false);
    }
  }

  useEffect(() => {
    loadGiftListAndGifts();
  }, []);

  const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

  async function compressImageForUpload(file: File): Promise<File> {
    if (file.size <= MAX_UPLOAD_BYTES) return file;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const el = new window.Image();
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao processar imagem'));
      };
      el.src = url;
    });

    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.max(1, Math.floor(img.width * scale));
    const height = Math.max(1, Math.floor(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Falha ao comprimir imagem');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.86;
    let blob: Blob | null = null;
    while (quality >= 0.45) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= MAX_UPLOAD_BYTES) break;
      quality -= 0.08;
    }

    if (!blob) throw new Error('Não foi possível comprimir imagem');
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Imagem muito grande. Use uma imagem menor.');

    return new File([blob], `${file.name.replace(/\.[^/.]+$/, '') || 'imagem'}.jpg`, { type: 'image/jpeg' });
  }

  const uploadGiftPhoto = async (file: File) => {
    const optimizedFile = await compressImageForUpload(file);
    const form = new FormData();
    form.append('file', optimizedFile);
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
    try {
      const url = await uploadGiftPhoto(file);
      setDraft((prev) => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      alert(error?.message ?? 'Erro no upload da imagem');
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
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Meus Presentes</h1>
              <p className="text-gray-600 mt-1">
                {filteredGifts.length} {filteredGifts.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
              <Button onClick={() => setOpenCreate(true)} style={{ backgroundColor: primary }} className="text-white hover:opacity-90" disabled={loading}>
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
            <Button variant="outline" asChild>
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
            <Textarea
              value={listPageMessage}
              onChange={(e) => setListPageMessage(e.target.value)}
              placeholder="Mensagem especial para os convidados"
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveListTexts} style={{ backgroundColor: primary }} className="text-white hover:opacity-90" disabled={savingListTexts}>
                {savingListTexts ? 'Salvando...' : 'Salvar textos da página'}
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
                    <h3 className="font-semibold text-xl text-gray-900 leading-tight mb-2">{gift.name}</h3>

                    {gift.description ? (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{gift.description}</p>
                    ) : (
                      <p className="text-gray-400 text-sm mb-4">Sem descrição</p>
                    )}

                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-3xl font-bold" style={{ color: primary }}>{formatBRL(valueShown)}</p>
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
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Título" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input placeholder="Descrição" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            <Input placeholder="URL da foto (opcional)" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" /> Upload de foto
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftPhotoUpload(e.target.files?.[0])} />
            </label>

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
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Título" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <Input placeholder="Descrição" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            <Input placeholder="URL da foto (opcional)" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
            <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" /> Upload de foto
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftPhotoUpload(e.target.files?.[0])} />
            </label>

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
