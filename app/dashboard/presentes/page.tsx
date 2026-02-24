'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Copy, Trash2, Boxes, Upload, Loader2, Check, RotateCcw } from 'lucide-react';
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

type EditableGift = {
  localId: string;
  serverId: string | null;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  totalQuantity: number;
  availableQty: number;
  isNew: boolean;
  dirty: boolean;
  deleted: boolean;
};

const feePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 11.99);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TITLE_FONTS = ['Playfair Display', 'Cormorant Garamond', 'Great Vibes', 'Dancing Script', 'Allura', 'Poppins', 'Montserrat'] as const;
const BODY_FONTS = ['Inter', 'Lato', 'Open Sans', 'Roboto', 'Nunito', 'Work Sans', 'Raleway'] as const;

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

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init ?? {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function toEditableGift(gift: GiftRow): EditableGift {
  return {
    localId: gift.id,
    serverId: gift.id,
    name: gift.name,
    description: gift.description ?? '',
    imageUrl: gift.imageUrl ?? '',
    basePrice: Number(gift.basePrice),
    totalQuantity: gift.totalQuantity,
    availableQty: gift.availableQty,
    isNew: false,
    dirty: false,
    deleted: false,
  };
}

export default function PresentesDashboard() {
  const { settings } = useUser();

  const [giftListId, setGiftListId] = useState('');
  const [giftListSlug, setGiftListSlug] = useState('');
  const [giftListFeeMode, setGiftListFeeMode] = useState<'PASS_TO_GUEST' | 'ABSORB'>('PASS_TO_GUEST');

  const [gifts, setGifts] = useState<EditableGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [savingAll, setSavingAll] = useState(false);
  const [uploadingGiftId, setUploadingGiftId] = useState<string | null>(null);
  const [uploadingListCover, setUploadingListCover] = useState(false);
  const [listPageTitle, setListPageTitle] = useState('Minha Lista de Presentes');
  const [listPageMessage, setListPageMessage] = useState('Ajude a realizar nossos sonhos!');
  const [listPageCoverImage, setListPageCoverImage] = useState('');
  const [listPageTitleColor, setListPageTitleColor] = useState('#FFFFFF');
  const [listPageTitleFont, setListPageTitleFont] = useState('Cormorant Garamond');
  const [listPageMessageColor, setListPageMessageColor] = useState('#5F4A41');
  const [listPageMessageFont, setListPageMessageFont] = useState('Inter');

  const [initialListPageTitle, setInitialListPageTitle] = useState('Minha Lista de Presentes');
  const [initialListPageMessage, setInitialListPageMessage] = useState('Ajude a realizar nossos sonhos!');
  const [initialListPageCoverImage, setInitialListPageCoverImage] = useState('');
  const [initialListPageTitleColor, setInitialListPageTitleColor] = useState('#FFFFFF');
  const [initialListPageTitleFont, setInitialListPageTitleFont] = useState('Cormorant Garamond');
  const [initialListPageMessageColor, setInitialListPageMessageColor] = useState('#5F4A41');
  const [initialListPageMessageFont, setInitialListPageMessageFont] = useState('Inter');

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const primary = settings?.theme?.primary_color ?? '#C86E52';

  const filteredGifts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = gifts.filter((gift) => !gift.deleted);
    if (!q) return list;
    return list.filter((gift) => gift.name.toLowerCase().includes(q) || gift.description.toLowerCase().includes(q));
  }, [gifts, searchTerm]);

  const pendingGiftChanges = useMemo(() => gifts.filter((g) => g.isNew || g.dirty || g.deleted).length, [gifts]);

  const listMetaDirty = useMemo(
    () =>
      listPageTitle.trim() !== initialListPageTitle.trim() ||
      listPageMessage.trim() !== initialListPageMessage.trim() ||
      listPageCoverImage !== initialListPageCoverImage ||
      listPageTitleColor !== initialListPageTitleColor ||
      listPageTitleFont !== initialListPageTitleFont ||
      listPageMessageColor !== initialListPageMessageColor ||
      listPageMessageFont !== initialListPageMessageFont,
    [
      listPageTitle,
      initialListPageTitle,
      listPageMessage,
      initialListPageMessage,
      listPageCoverImage,
      initialListPageCoverImage,
      listPageTitleColor,
      initialListPageTitleColor,
      listPageTitleFont,
      initialListPageTitleFont,
      listPageMessageColor,
      initialListPageMessageColor,
      listPageMessageFont,
      initialListPageMessageFont,
    ]
  );

  const pendingChangesCount = pendingGiftChanges + (listMetaDirty ? 1 : 0);

  async function loadGifts(listId: string) {
    if (!listId) return;
    setGiftsLoading(true);
    try {
      const giftsRes = await fetchWithTimeout(`/api/gifts?giftListId=${encodeURIComponent(listId)}`, { cache: 'no-store' });
      const giftsData = await parseJsonSafe(giftsRes);
      if (!giftsRes.ok) throw new Error(giftsData?.error ?? 'Erro ao carregar presentes');

      const mapped = (Array.isArray(giftsData) ? giftsData : []).map((row: any) =>
        toEditableGift({
          ...row,
          basePrice: Number(row.basePrice),
        })
      );

      setGifts(mapped);
      setExpandedIds([]);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao carregar presentes');
    } finally {
      setGiftsLoading(false);
    }
  }

  async function loadGiftListAndGifts() {
    setLoading(true);
    try {
      const glRes = await fetchWithTimeout('/api/gift-lists/my-list?view=presentes-meta', { cache: 'no-store' });
      const glData = await parseJsonSafe(glRes);
      if (!glRes.ok) throw new Error(glData?.error ?? 'Erro ao carregar lista');

      setGiftListId(glData.id);
      setGiftListSlug(glData.slug || '');
      setGiftListFeeMode(glData?.feeMode === 'ABSORB' ? 'ABSORB' : 'PASS_TO_GUEST');

      const title = glData?.title || 'Minha Lista de Presentes';
      const message = glData?.description || '';
      const theme = (glData?.pageLayout?.theme ?? {}) as Record<string, any>;
      const cover = typeof theme.gifts_page_cover_image === 'string' ? theme.gifts_page_cover_image : '';
      const titleColor = typeof theme.gifts_page_title_color === 'string' ? theme.gifts_page_title_color : '#FFFFFF';
      const titleFont = typeof theme.gifts_page_title_font === 'string' ? theme.gifts_page_title_font : (typeof theme.font_title === 'string' ? theme.font_title : 'Cormorant Garamond');
      const messageColor = typeof theme.gifts_page_message_color === 'string' ? theme.gifts_page_message_color : (typeof theme.caption_color === 'string' ? theme.caption_color : '#5F4A41');
      const messageFont = typeof theme.gifts_page_message_font === 'string' ? theme.gifts_page_message_font : (typeof theme.font_body === 'string' ? theme.font_body : 'Inter');

      setListPageTitle(title);
      setInitialListPageTitle(title);
      setListPageMessage(message);
      setInitialListPageMessage(message);
      setListPageCoverImage(cover);
      setInitialListPageCoverImage(cover);
      setListPageTitleColor(titleColor);
      setInitialListPageTitleColor(titleColor);
      setListPageTitleFont(titleFont);
      setInitialListPageTitleFont(titleFont);
      setListPageMessageColor(messageColor);
      setInitialListPageMessageColor(messageColor);
      setListPageMessageFont(messageFont);
      setInitialListPageMessageFont(messageFont);

      void loadGifts(glData.id);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        alert(error?.message ?? 'Erro ao carregar presentes');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGiftListAndGifts();
  }, []);

  async function uploadGiftPhoto(file: File) {
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
  }

  async function handleGiftPhotoUpload(localId: string, file?: File | null) {
    if (!file) return;
    try {
      setUploadingGiftId(localId);
      const url = await uploadGiftPhoto(file);
      updateGift(localId, { imageUrl: url });
    } catch (error: any) {
      alert(error?.message ?? 'Erro no upload da imagem');
    } finally {
      setUploadingGiftId(null);
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

  function handleRemoveListCover() {
    setListPageCoverImage('');
  }

  function addDraftGift() {
    const localId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const draftGift: EditableGift = {
      localId,
      serverId: null,
      name: '',
      description: '',
      imageUrl: '',
      basePrice: 150,
      totalQuantity: 1,
      availableQty: 1,
      isNew: true,
      dirty: true,
      deleted: false,
    };

    setGifts((prev) => [draftGift, ...prev]);
    setExpandedIds((prev) => (prev.includes(localId) ? prev : [...prev, localId]));

    // Scroll to the newly created card so mobile users can edit it immediately.
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        const card = document.getElementById(`gift-card-${localId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const nameInput = card.querySelector('input[placeholder="Nome do presente"]') as HTMLInputElement | null;
          nameInput?.focus();
        }
      }, 120);
    });
  }

  function toggleExpanded(localId: string) {
    setExpandedIds((prev) => (prev.includes(localId) ? prev.filter((id) => id !== localId) : [...prev, localId]));
  }

  function updateGift(localId: string, patch: Partial<EditableGift>) {
    setGifts((prev) =>
      prev.map((gift) => {
        if (gift.localId !== localId) return gift;

        const next: EditableGift = {
          ...gift,
          ...patch,
          dirty: true,
        };

        if (patch.totalQuantity !== undefined) {
          const nextTotal = Math.max(1, Number(patch.totalQuantity || 1));
          const diff = nextTotal - gift.totalQuantity;
          next.totalQuantity = nextTotal;
          next.availableQty = Math.max(0, gift.availableQty + diff);
        }

        return next;
      })
    );
  }

  function duplicateGift(localId: string) {
    const source = gifts.find((gift) => gift.localId === localId);
    if (!source || source.deleted) return;

    const newId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const copy: EditableGift = {
      ...source,
      localId: newId,
      serverId: null,
      name: `${source.name} (cópia)`,
      availableQty: source.totalQuantity,
      isNew: true,
      dirty: true,
      deleted: false,
    };

    setGifts((prev) => [copy, ...prev]);
    setExpandedIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
  }

  function incrementQuantity(localId: string) {
    const gift = gifts.find((row) => row.localId === localId);
    if (!gift || gift.deleted) return;
    updateGift(localId, { totalQuantity: gift.totalQuantity + 1 });
  }

  function markDelete(localId: string) {
    setGifts((prev) =>
      prev
        .map((gift) => {
          if (gift.localId !== localId) return gift;
          if (gift.isNew) return null;
          return { ...gift, deleted: true, dirty: true };
        })
        .filter(Boolean) as EditableGift[]
    );
  }

  function undoDelete(localId: string) {
    setGifts((prev) => prev.map((gift) => (gift.localId === localId ? { ...gift, deleted: false, dirty: true } : gift)));
  }

  async function saveListMeta() {
    const [giftListRes, layoutRes] = await Promise.all([
      fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listPageTitle.trim() || 'Minha Lista de Presentes',
          description: listPageMessage.trim(),
        }),
      }),
      giftListId ? fetch(`/api/gift-lists/${encodeURIComponent(giftListId)}/layout`, { cache: 'no-store' }) : Promise.resolve(null as any),
    ]);

    const listData = await parseJsonSafe(giftListRes);
    if (!giftListRes.ok) {
      throw new Error(listData?.error ?? 'Erro ao salvar textos da página');
    }

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
            gifts_page_title_color: listPageTitleColor || '#FFFFFF',
            gifts_page_title_font: listPageTitleFont || 'Cormorant Garamond',
            gifts_page_message_color: listPageMessageColor || '#5F4A41',
            gifts_page_message_font: listPageMessageFont || 'Inter',
          },
        }),
      });
      const layoutSaveData = await parseJsonSafe(layoutSaveRes);
      if (!layoutSaveRes.ok) {
        throw new Error(layoutSaveData?.error ?? 'Erro ao salvar capa da página');
      }
    }
  }

  async function handleSaveAllChanges() {
    if (!giftListId) return;

    const activeGifts = gifts.filter((gift) => !gift.deleted);
    const invalid = activeGifts.find(
      (gift) => !gift.name.trim() || Number(gift.basePrice) <= 0 || Number(gift.totalQuantity) <= 0
    );

    if (invalid) {
      alert('Preencha nome, valor e quantidade válidos para todos os presentes antes de publicar as alterações.');
      return;
    }

    setSavingAll(true);
    try {
      if (listMetaDirty) {
        await saveListMeta();
      }

      const deletions = gifts.filter((gift) => gift.deleted && !gift.isNew && gift.serverId);
      const updates = gifts.filter((gift) => !gift.deleted && !gift.isNew && gift.dirty && gift.serverId);
      const creations = gifts.filter((gift) => !gift.deleted && gift.isNew);

      for (const gift of deletions) {
        const res = await fetch(`/api/gifts/${gift.serverId}`, { method: 'DELETE' });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.error ?? `Erro ao excluir presente ${gift.name || ''}`.trim());
      }

      for (const gift of updates) {
        const res = await fetch(`/api/gifts/${gift.serverId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: gift.name.trim(),
            description: gift.description.trim() || undefined,
            imageUrl: gift.imageUrl || '',
            basePrice: Number(gift.basePrice),
            totalQuantity: Math.max(1, Number(gift.totalQuantity || 1)),
          }),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.error ?? `Erro ao atualizar presente ${gift.name || ''}`.trim());
      }

      for (const gift of creations) {
        const res = await fetch('/api/gifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            giftListId,
            name: gift.name.trim(),
            description: gift.description.trim() || undefined,
            imageUrl: gift.imageUrl || undefined,
            basePrice: Number(gift.basePrice),
            totalQuantity: Math.max(1, Number(gift.totalQuantity || 1)),
          }),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) throw new Error(data?.error ?? `Erro ao criar presente ${gift.name || ''}`.trim());
      }

      await loadGiftListAndGifts();
      alert('Alterações publicadas com sucesso.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao publicar alterações dos presentes');
    } finally {
      setSavingAll(false);
    }
  }

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
              <Button variant="outline" className="w-full sm:w-auto" asChild disabled={loading || giftsLoading || savingAll}>
                <Link href="/dashboard/presentes/modelos">Modelos prontos</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input type="search" placeholder="Buscar presentes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
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
              disabled={savingAll}
            />
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Foto de capa da página de presentes (recomendado: horizontal 16:9, até 5MB)</p>
              {listPageCoverImage ? (
                <div className="space-y-2">
                  <img src={listPageCoverImage} alt="Prévia da capa da página de presentes" className="h-36 w-full rounded-md object-cover border border-[#ead9cd]" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4" /> {uploadingListCover ? 'Enviando capa...' : 'Trocar capa'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleListCoverUpload(e.target.files?.[0])} disabled={uploadingListCover || savingAll} />
                    </label>
                    <Button type="button" variant="outline" onClick={handleRemoveListCover} disabled={uploadingListCover || savingAll}>
                      Remover capa
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 w-fit">
                  <Upload className="w-4 h-4" /> {uploadingListCover ? 'Enviando capa...' : 'Upload capa 16:9'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleListCoverUpload(e.target.files?.[0])} disabled={uploadingListCover || savingAll} />
                </label>
              )}
            </div>
            <Textarea
              value={listPageMessage}
              onChange={(e) => setListPageMessage(e.target.value)}
              placeholder="Mensagem especial para os convidados"
              rows={3}
              disabled={savingAll}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-[#ead9cd] p-3 bg-[#fffdfb]">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Cor do título (na capa)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={listPageTitleColor}
                    onChange={(e) => setListPageTitleColor(e.target.value)}
                    className="h-10 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
                    disabled={savingAll}
                  />
                  <Input value={listPageTitleColor} onChange={(e) => setListPageTitleColor(e.target.value)} disabled={savingAll} />
                </div>
                <Label className="text-xs font-semibold text-gray-700">Fonte do título (na capa)</Label>
                <Select value={listPageTitleFont} onValueChange={setListPageTitleFont} disabled={savingAll}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {TITLE_FONTS.map((fontName) => (
                      <SelectItem key={fontName} value={fontName} style={{ fontFamily: fontName }}>
                        {fontName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Cor da frase</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={listPageMessageColor}
                    onChange={(e) => setListPageMessageColor(e.target.value)}
                    className="h-10 w-11 rounded-md border border-[#d8c6b7] bg-white p-1 cursor-pointer"
                    disabled={savingAll}
                  />
                  <Input value={listPageMessageColor} onChange={(e) => setListPageMessageColor(e.target.value)} disabled={savingAll} />
                </div>
                <Label className="text-xs font-semibold text-gray-700">Fonte da frase</Label>
                <Select value={listPageMessageFont} onValueChange={setListPageMessageFont} disabled={savingAll}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {BODY_FONTS.map((fontName) => (
                      <SelectItem key={fontName} value={fontName} style={{ fontFamily: fontName }}>
                        {fontName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Dica: faça todas as edições nos cards abaixo e depois clique em <b>Publicar alterações</b> uma única vez.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading || giftsLoading ? (
          <p className="text-gray-600">Carregando presentes...</p>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 text-[#c8a27a]">🎁</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nada por aqui ainda</h3>
            <p className="text-gray-600 mb-6">Crie seu primeiro presente para começar.</p>
            <Button onClick={addDraftGift} style={{ backgroundColor: primary }} className="text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Criar presente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const valueShown = withFee(Number(gift.basePrice || 0), giftListFeeMode === 'PASS_TO_GUEST');
              const soldOut = gift.availableQty <= 0;
              const expanded = expandedIds.includes(gift.localId);

              return (
                <Card
                  key={gift.localId}
                  id={`gift-card-${gift.localId}`}
                  className={`overflow-hidden border-[#ead9cd] bg-white transition-shadow ${gift.dirty || gift.isNew ? 'ring-1 ring-[#d7b49e]' : ''}`}
                >
                  <div className="relative w-full h-56 bg-gradient-to-br from-[#f5eadf] to-[#f1e3d6]">
                    {gift.imageUrl ? (
                      <Image src={gift.imageUrl} alt={gift.name || 'Presente'} fill className="object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Boxes className="w-14 h-14 text-[#c8a27a]" />
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${soldOut ? 'bg-[#d89a84] text-white' : 'bg-[#22c55e] text-white'}`}>
                      {soldOut ? 'Esgotado' : 'Disponível'}
                    </span>
                    {(gift.isNew || gift.dirty) && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#fff6ed] text-[#b85a3d] border border-[#e7d8cb]">
                        Alterado
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid gap-2">
                      <Input
                        placeholder="Nome do presente"
                        value={gift.name}
                        onChange={(e) => updateGift(gift.localId, { name: e.target.value })}
                        disabled={savingAll}
                      />
                      <Textarea
                        placeholder="Descrição (opcional)"
                        value={gift.description}
                        onChange={(e) => updateGift(gift.localId, { description: e.target.value })}
                        rows={2}
                        disabled={savingAll}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="number"
                          placeholder="Valor"
                          value={gift.basePrice}
                          onChange={(e) => updateGift(gift.localId, { basePrice: Number(e.target.value || 0) })}
                          disabled={savingAll}
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Valor</p>
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Quantidade"
                          value={gift.totalQuantity}
                          min={1}
                          onChange={(e) => updateGift(gift.localId, { totalQuantity: Number(e.target.value || 1) })}
                          disabled={savingAll}
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Quantidade total disponível para compra</p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-2xl md:text-3xl font-bold" style={{ color: primary }}>{formatBRL(valueShown)}</p>
                        <p className="text-xs text-gray-500 mt-1">{giftListFeeMode === 'PASS_TO_GUEST' ? 'Valor com taxa' : 'Valor do presente'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{gift.availableQty}/{gift.totalQuantity} disponíveis</p>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-2 rounded-md border border-[#ead9cd] p-3 bg-[#fffdfb]">
                        <Input
                          placeholder="URL da imagem (opcional)"
                          value={gift.imageUrl}
                          onChange={(e) => updateGift(gift.localId, { imageUrl: e.target.value })}
                          disabled={savingAll}
                        />
                        <label className="h-10 px-3 border rounded-md text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50 w-fit">
                          <Upload className="w-4 h-4" />
                          {uploadingGiftId === gift.localId ? 'Enviando foto...' : 'Upload de foto'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleGiftPhotoUpload(gift.localId, e.target.files?.[0])}
                            disabled={savingAll || uploadingGiftId === gift.localId}
                          />
                        </label>
                        <p className="text-xs text-gray-500">Recomendado: formato horizontal 16:9. Limite 5MB.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" className="h-10" onClick={() => toggleExpanded(gift.localId)} title="Editar no card" disabled={savingAll}>
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" className="h-10" onClick={() => duplicateGift(gift.localId)} title="Duplicar" disabled={savingAll}>
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button variant="outline" className="h-10" onClick={() => incrementQuantity(gift.localId)} title="Adicionar 1 unidade" disabled={savingAll}>
                        <Plus className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => markDelete(gift.localId)}
                        title="Excluir"
                        disabled={savingAll}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {gifts.some((gift) => gift.deleted) && (
          <div className="mt-8 rounded-xl border border-[#ead9cd] bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Marcados para excluir</p>
            <div className="flex flex-wrap gap-2">
              {gifts
                .filter((gift) => gift.deleted)
                .map((gift) => (
                  <Button key={gift.localId} variant="outline" className="h-9" onClick={() => undoDelete(gift.localId)} disabled={savingAll}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Desfazer: {gift.name || 'Sem nome'}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-6 sm:bottom-6">
        <div className="rounded-2xl border border-[#ead9cd] bg-white/95 backdrop-blur p-2 shadow-lg">
          <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
            <Button
              onClick={addDraftGift}
              style={{ backgroundColor: primary }}
              className="h-11 w-11 rounded-full text-white hover:opacity-90 p-0"
              disabled={loading || giftsLoading || savingAll}
              title="Novo presente"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSaveAllChanges}
              className="h-11"
              disabled={loading || giftsLoading || savingAll || uploadingListCover || uploadingGiftId !== null || pendingChangesCount === 0}
            >
              {savingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {savingAll ? 'Publicando...' : `Publicar alterações (${pendingChangesCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


