'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Copy,
  Trash2,
  Boxes,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

type GiftStatus = 'active' | 'inactive';

type GiftDraft = {
  title: string;
  description: string;
  value: number;
  photo?: string;
  quantity: number;
  status: GiftStatus;
};

const feePercent = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE ?? 7.99);

function withFee(value: number, feePassedToGuest: boolean) {
  if (!feePassedToGuest) return value;
  return Number((value * (1 + feePercent / 100)).toFixed(2));
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function GiftsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="space-y-2">
              <div className="h-8 w-40 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-4 w-72 bg-gray-100 rounded-md animate-pulse" />
            </div>

            <div className="flex gap-2">
              <div className="h-10 w-36 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-10 w-36 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-10 w-full sm:w-48 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-xl overflow-hidden">
              <div className="h-56 bg-gray-100 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-5 w-44 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>

                <div className="h-4 w-full bg-gray-100 rounded-md animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 rounded-md animate-pulse" />

                <div className="flex items-end justify-between pt-2">
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded-md animate-pulse" />
                  </div>
                  <div className="h-4 w-28 bg-gray-100 rounded-md animate-pulse" />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="h-10 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Templates com fotos fictícias locais
 * Coloque imagens em /public/gifts/...
 * Se não existir, cai no placeholder.
 */
const templates = {
  glam: {
    name: 'Debutante Glam',
    description: 'Tech + beleza + viagem + itens “uau”.',
    gifts: [
      { title: 'iPhone', description: 'Modelo atual (contribuição)', value: 6500, quantity: 1, status: 'active', photo: '/gifts/iphone.jpg' },
      { title: 'AirPods', description: 'Fones sem fio (contribuição)', value: 1500, quantity: 1, status: 'active', photo: '/gifts/airpods.jpg' },
      { title: 'Apple Watch', description: 'Relógio inteligente (contribuição)', value: 2800, quantity: 1, status: 'active', photo: '/gifts/applewatch.jpg' },
      { title: 'Notebook', description: 'Para estudos e projetos (contribuição)', value: 4200, quantity: 1, status: 'active', photo: '/gifts/notebook.jpg' },
      { title: 'Câmera Instax', description: 'Fotos instantâneas para memórias', value: 650, quantity: 1, status: 'active', photo: '/gifts/instax.jpg' },
      { title: 'Kit de maquiagem premium', description: 'Base, corretivo, paleta e pincéis', value: 900, quantity: 1, status: 'active', photo: '/gifts/makeup.jpg' },
      { title: 'Skincare completo', description: 'Rotina completa (limpeza + hidratação)', value: 780, quantity: 1, status: 'active', photo: '/gifts/skincare.jpg' },
      { title: 'Perfume importado', description: 'Perfume assinatura (contribuição)', value: 650, quantity: 1, status: 'active', photo: '/gifts/perfume.jpg' },
      { title: 'Bolsa clássica', description: 'Bolsa elegante (contribuição)', value: 1200, quantity: 1, status: 'active', photo: '/gifts/bag.jpg' },
      { title: 'Ensaio fotográfico', description: 'Ensaio para guardar pra sempre', value: 850, quantity: 1, status: 'active', photo: '/gifts/photoshoot.jpg' },
      { title: 'Viagem dos sonhos', description: 'Contribuição para a viagem', value: 2500, quantity: 1, status: 'active', photo: '/gifts/travel.jpg' },
      { title: 'Passagem aérea', description: 'Contribuição para passagens', value: 1800, quantity: 1, status: 'active', photo: '/gifts/flight.jpg' },
      { title: 'Hotel', description: 'Contribuição para hospedagem', value: 1200, quantity: 1, status: 'active', photo: '/gifts/hotel.jpg' },
      { title: 'Passeios na viagem', description: 'Experiências e tours', value: 600, quantity: 1, status: 'active', photo: '/gifts/tour.jpg' },
      { title: 'Spa Day', description: 'Dia de spa e relaxamento', value: 550, quantity: 1, status: 'active', photo: '/gifts/spa.jpg' },
    ] as GiftDraft[],
  },
  classic: {
    name: 'Debutante Clássica',
    description: 'Experiências, cursos, itens elegantes e úteis.',
    gifts: [
      { title: 'Joia delicada', description: 'Colar ou brinco (contribuição)', value: 750, quantity: 1, status: 'active', photo: '/gifts/jewelry.jpg' },
      { title: 'Relógio clássico', description: 'Contribuição para um relógio elegante', value: 900, quantity: 1, status: 'active', photo: '/gifts/watch.jpg' },
      { title: 'Vestido para ocasião especial', description: 'Contribuição para um vestido inesquecível', value: 900, quantity: 1, status: 'active', photo: '/gifts/dress.jpg' },
      { title: 'Saltos para festas', description: 'Um par elegante para eventos', value: 480, quantity: 1, status: 'active', photo: '/gifts/heels.jpg' },
      { title: 'Tênis branco premium', description: 'Estilo e conforto', value: 600, quantity: 1, status: 'active', photo: '/gifts/sneakers.jpg' },
      { title: 'Curso online', description: 'Curso de interesse (contribuição)', value: 250, quantity: 1, status: 'active', photo: '/gifts/course.jpg' },
      { title: 'Aula de dança', description: 'Aulas particulares (contribuição)', value: 350, quantity: 1, status: 'active', photo: '/gifts/dance.jpg' },
      { title: 'Aula de canto', description: 'Aulas particulares (contribuição)', value: 350, quantity: 1, status: 'active', photo: '/gifts/singing.jpg' },
      { title: 'Jantar especial', description: 'Experiência gastronômica (contribuição)', value: 450, quantity: 1, status: 'active', photo: '/gifts/dinner.jpg' },
      { title: 'Show/Evento', description: 'Ingresso e experiência (contribuição)', value: 350, quantity: 1, status: 'active', photo: '/gifts/event.jpg' },
      { title: 'Manicure + pedicure', description: 'Pacote de serviços', value: 180, quantity: 1, status: 'active', photo: '/gifts/nails.jpg' },
      { title: 'Cílios + sobrancelha', description: 'Pacote beleza (contribuição)', value: 220, quantity: 1, status: 'active', photo: '/gifts/beauty.jpg' },
      { title: 'Secador profissional', description: 'Secador potente (contribuição)', value: 650, quantity: 1, status: 'active', photo: '/gifts/hairdryer.jpg' },
      { title: 'Prancha profissional', description: 'Chapinha de alta performance', value: 480, quantity: 1, status: 'active', photo: '/gifts/flatiron.jpg' },
      { title: 'Escova modeladora', description: 'Para cabelo impecável', value: 330, quantity: 1, status: 'active', photo: '/gifts/brush.jpg' },
    ] as GiftDraft[],
  },
} as const;

type TemplateKey = keyof typeof templates;

function safeImg(src?: string) {
  return typeof src === 'string' && src.trim().length > 0;
}

export default function PresentesDashboard() {
  const { gifts, addGift, updateGift, deleteGift, settings } = useUser();

  // ✅ todos os hooks SEMPRE executam (sem return antecipado)
  const [mounted, setMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GiftStatus>('all');

  // dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openQty, setOpenQty] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

  const [draft, setDraft] = useState<GiftDraft>({
    title: '',
    description: '',
    value: 150,
    photo: '',
    quantity: 1,
    status: 'active',
  });

  // templates
  const [templateKey, setTemplateKey] = useState<TemplateKey>('glam');
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());

  const editingGift = useMemo(
    () => gifts.find((g) => g.id === editingId) ?? null,
    [gifts, editingId]
  );

  const currentTemplate = templates[templateKey];

  const primary = settings?.theme?.primary_color ?? '#C86E52';

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const matchesSearch =
        gift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gift.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || gift.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [gifts, searchTerm, statusFilter]);

  useEffect(() => setMounted(true), []);

  function handleCreate() {
    if (!draft.title.trim()) return;

    addGift({
      title: draft.title.trim(),
      description: draft.description?.trim() ?? '',
      value: Number(draft.value || 0),
      photo: draft.photo || undefined,
      quantity: Math.max(1, Number(draft.quantity || 1)),
      quantityAvailable: Math.max(1, Number(draft.quantity || 1)),
      status: draft.status,
    });

    setDraft({ title: '', description: '', value: 150, photo: '', quantity: 1, status: 'active' });
    setOpenCreate(false);
  }

  function handleOpenEdit(id: string) {
    const g = gifts.find((x) => x.id === id);
    if (!g) return;

    setEditingId(id);
    setDraft({
      title: g.title,
      description: g.description ?? '',
      value: g.value,
      photo: g.photo ?? '',
      quantity: g.quantity,
      status: g.status,
    });
    setOpenEdit(true);
  }

  function handleSaveEdit() {
    if (!editingId) return;

    const nextQty = Math.max(1, Number(draft.quantity || 1));
    updateGift(editingId, {
      title: draft.title.trim(),
      description: draft.description?.trim() ?? '',
      value: Number(draft.value || 0),
      photo: draft.photo || undefined,
      quantity: nextQty,
      quantityAvailable: Math.max(
        0,
        (editingGift?.quantityAvailable ?? nextQty) +
          (nextQty - (editingGift?.quantity ?? nextQty))
      ),
      status: draft.status,
    });

    setOpenEdit(false);
    setEditingId(null);
  }

  function handleDuplicate(id: string) {
    const g = gifts.find((x) => x.id === id);
    if (!g) return;

    addGift({
      title: `${g.title} (cópia)`,
      description: g.description,
      value: g.value,
      photo: g.photo,
      quantity: g.quantity,
      quantityAvailable: g.quantityAvailable,
      status: g.status,
    });
  }

  function handleOpenQty(id: string) {
    setEditingId(id);
    setQtyToAdd(1);
    setOpenQty(true);
  }

  function handleAddQty() {
    if (!editingGift || !editingId) return;
    const add = Math.max(1, Number(qtyToAdd || 1));
    updateGift(editingId, {
      quantity: editingGift.quantity + add,
      quantityAvailable: editingGift.quantityAvailable + add,
    });
    setOpenQty(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este presente?')) return;
    deleteGift(id);
  }

  function addOneFromTemplate(item: GiftDraft) {
    addGift({
      title: item.title,
      description: item.description,
      value: item.value,
      photo: item.photo || undefined,
      quantity: item.quantity,
      quantityAvailable: item.quantity,
      status: item.status,
    });
  }

  function toggleSelect(title: string) {
    setSelectedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  function clearSelected() {
    setSelectedTitles(new Set());
  }

  function addSelected() {
    const items = currentTemplate.gifts.filter((g) => selectedTitles.has(g.title));
    items.forEach(addOneFromTemplate);
    clearSelected();
  }

  function addAllFromTemplate() {
    currentTemplate.gifts.forEach(addOneFromTemplate);
    clearSelected();
  }

  return !mounted ? (
    <GiftsSkeleton />
  ) : (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Presentes
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredGifts.length} {filteredGifts.length === 1 ? 'item' : 'itens'} ·{' '}
                <span className="font-medium" style={{ color: primary }}>
                  {settings?.feePassedToGuest ? `Taxa repassada (${feePercent}%)` : 'Taxa assumida por você'}
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => setOpenTemplates(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Listas prontas
              </Button>

              <Button
                onClick={() => setOpenCreate(true)}
                style={{ backgroundColor: primary }}
                className="text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar presente
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar presentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredGifts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎀</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nada por aqui ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Crie um presente ou use uma lista pronta para começar.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setOpenTemplates(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Listas prontas
              </Button>
              <Button
                onClick={() => setOpenCreate(true)}
                style={{ backgroundColor: primary }}
                className="text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar presente
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const valueShown = withFee(gift.value, !!settings?.feePassedToGuest);

              return (
                <Card key={gift.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200">
                    {safeImg(gift.photo) ? (
                      <Image
                        src={gift.photo as string}
                        alt={gift.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Boxes className="w-14 h-14 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-xl text-gray-900 leading-tight">
                        {gift.title}
                      </h3>
                      <Badge variant={gift.status === 'active' ? 'default' : 'secondary'}>
                        {gift.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {gift.description ? (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {gift.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm mb-4">
                        Sem descrição
                      </p>
                    )}

                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-3xl font-bold" style={{ color: primary }}>
                          {formatBRL(valueShown)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {settings?.feePassedToGuest ? 'Valor com taxa' : 'Valor do presente'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {gift.quantityAvailable}/{gift.quantity} disponível(eis)
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        className="h-10"
                        onClick={() => handleOpenEdit(gift.id)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10"
                        onClick={() => handleDuplicate(gift.id)}
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10"
                        onClick={() => handleOpenQty(gift.id)}
                        title="Adicionar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(gift.id)}
                        title="Excluir"
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
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo presente</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              placeholder="Título"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <Input
              placeholder="Descrição"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
            <Input
              placeholder="URL da foto (opcional) ou /gifts/arquivo.jpg"
              value={draft.photo ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, photo: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Valor"
                value={draft.value}
                onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Quantidade"
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
              />
            </div>

            <Select value={draft.status} onValueChange={(v: any) => setDraft((d) => ({ ...d, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              Valor exibido ao convidado:{' '}
              <span className="font-medium">
                {formatBRL(withFee(draft.value, !!settings?.feePassedToGuest))}
              </span>
              {settings?.feePassedToGuest ? ` (com taxa ${feePercent}%)` : ' (sem taxa)'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              style={{ backgroundColor: primary }}
              className="text-white hover:opacity-90"
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar presente</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              placeholder="Título"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <Input
              placeholder="Descrição"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
            <Input
              placeholder="URL da foto (opcional) ou /gifts/arquivo.jpg"
              value={draft.photo ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, photo: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Valor"
                value={draft.value}
                onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) }))}
              />
              <Input
                type="number"
                placeholder="Quantidade"
                value={draft.quantity}
                onChange={(e) => setDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
              />
            </div>

            <Select value={draft.status} onValueChange={(v: any) => setDraft((d) => ({ ...d, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              Valor exibido ao convidado:{' '}
              <span className="font-medium">
                {formatBRL(withFee(draft.value, !!settings?.feePassedToGuest))}
              </span>
              {settings?.feePassedToGuest ? ` (com taxa ${feePercent}%)` : ' (sem taxa)'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              style={{ backgroundColor: primary }}
              className="text-white hover:opacity-90"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quantity Dialog */}
      <Dialog open={openQty} onOpenChange={setOpenQty}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar quantidade</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              type="number"
              placeholder="Quantidade a adicionar"
              value={qtyToAdd}
              onChange={(e) => setQtyToAdd(Number(e.target.value))}
            />
            <div className="text-xs text-muted-foreground">
              Isso aumenta <b>quantidade total</b> e <b>disponível</b>.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenQty(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddQty}
              style={{ backgroundColor: primary }}
              className="text-white hover:opacity-90"
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog
        open={openTemplates}
        onOpenChange={(v) => {
          setOpenTemplates(v);
          if (!v) setSelectedTitles(new Set());
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Listas prontas</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Escolha um template e adicione 1 por 1, alguns selecionados ou todos.
            </div>

            <Select
              value={templateKey}
              onValueChange={(v: any) => {
                setTemplateKey(v);
                setSelectedTitles(new Set());
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glam">Debutante Glam</SelectItem>
                <SelectItem value="classic">Debutante Clássica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{currentTemplate.name}</div>
                <div className="text-xs text-muted-foreground">{currentTemplate.description}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTitles(new Set())}
                  disabled={selectedTitles.size === 0}
                  title="Limpar seleção"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const items = currentTemplate.gifts.filter((g) => selectedTitles.has(g.title));
                    items.forEach(addOneFromTemplate);
                    setSelectedTitles(new Set());
                  }}
                  disabled={selectedTitles.size === 0}
                  title="Adicionar selecionados"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Adicionar ({selectedTitles.size})
                </Button>

                <Button
                  onClick={() => {
                    currentTemplate.gifts.forEach(addOneFromTemplate);
                    setSelectedTitles(new Set());
                  }}
                  style={{ backgroundColor: primary }}
                  className="text-white hover:opacity-90"
                  title="Adicionar todos"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Adicionar todos
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto grid gap-2 pr-1">
            {currentTemplate.gifts.map((g) => {
              const selected = selectedTitles.has(g.title);
              const shown = formatBRL(withFee(g.value, !!settings?.feePassedToGuest));

              return (
                <div
                  key={g.title}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 bg-white ${
                    selected ? 'ring-2 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className={`h-5 w-5 rounded border flex items-center justify-center ${
                        selected ? 'bg-black text-white border-black' : 'bg-white'
                      }`}
                      onClick={() => {
                        setSelectedTitles((prev) => {
                          const next = new Set(prev);
                          if (next.has(g.title)) next.delete(g.title);
                          else next.add(g.title);
                          return next;
                        });
                      }}
                      type="button"
                      aria-label="Selecionar"
                      title="Selecionar"
                    >
                      {selected ? <Check className="w-3.5 h-3.5" /> : null}
                    </button>

                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      {safeImg(g.photo) ? (
                        <Image src={g.photo as string} alt={g.title} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Boxes className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">{g.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{g.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold whitespace-nowrap">{shown}</div>
                    <Button
                      variant="outline"
                      onClick={() => addOneFromTemplate(g)}
                      title="Adicionar este item"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTemplates(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
