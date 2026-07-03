'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutTemplate, Shield, Users } from 'lucide-react';

type Overview = {
  usersCount: number;
  adminsCount: number;
  clientsCount: number;
  partnersCount: number;
  ambassadorsCount: number;
  employeesCount: number;
  publishedListsCount: number;
  activeTemplatesCount: number;
  paidTotal: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
  isBlocked: boolean;
  blockReason?: string | null;
  referredByPartner?: { id: string; name: string | null; email: string } | null;
  referredByAmbassador?: { id: string; name: string | null; email: string } | null;
  _count: {
    giftLists: number;
    referredClientsAsPartner: number;
    referredClientsAsAmbassador: number;
    partnerReferrals: number;
  };
};

type AdminGiftList = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  user: { email: string; name: string | null };
  _count: { gifts: number; orders: number; messages: number };
};

type AdminTemplate = { id: string; name: string; slug: string; category: string; isActive: boolean };
type AdminGiftModelCategory = { id: string; name: string; slug: string; itemsCount: number };
type AdminGiftItem = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number | string;
  totalQuantity: number;
};
type GiftCopyPanelState = {
  list: AdminGiftList;
  gifts: AdminGiftItem[];
  selectedIds: string[];
  categorySlug: string;
};

type ImpersonationState = {
  isImpersonating: boolean;
  effectiveUser?: { id: string; name: string | null; email: string; role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE' };
};

type PeriodFilter = 'total' | 'current_month' | 'last_month';
type ManagedRole = 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
type UserApiResponse = { users: AdminUser[] };

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const RECENT_LIMIT = 10;
const LISTS_STEP = 10;
const ROLE_SECTIONS: { role: ManagedRole; title: string; description: string }[] = [
  { role: 'CLIENT', title: 'Clientes', description: '10 mais recentes com controles.' },
  { role: 'PARTNER', title: 'Parceiros', description: '10 mais recentes com controles.' },
  { role: 'AMBASSADOR', title: 'Embaixadores', description: '10 mais recentes com controles.' },
  { role: 'EMPLOYEE', title: 'Funcionários', description: '10 mais recentes com controles.' },
];

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export default function AdminPage() {
  const [period, setPeriod] = useState<PeriodFilter>('total');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [lists, setLists] = useState<AdminGiftList[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [giftModelCategories, setGiftModelCategories] = useState<AdminGiftModelCategory[]>([]);
  const [giftCopyPanel, setGiftCopyPanel] = useState<GiftCopyPanelState | null>(null);
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [busyListId, setBusyListId] = useState<string | null>(null);
  const [qUser, setQUser] = useState('');
  const [qList, setQList] = useState('');
  const [visibleListCount, setVisibleListCount] = useState(LISTS_STEP);
  const [sectionUsers, setSectionUsers] = useState<Record<ManagedRole, AdminUser[]>>({
    CLIENT: [],
    PARTNER: [],
    AMBASSADOR: [],
    EMPLOYEE: [],
  });

  const debouncedUserQuery = useDebouncedValue(qUser.trim(), 350);
  const debouncedListQuery = useDebouncedValue(qList.trim(), 350);

  const listQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedListQuery) params.set('q', debouncedListQuery);
    return params.toString();
  }, [debouncedListQuery]);

  async function getJson<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      return await response.json();
    } catch {
      return null;
    }
  }

  async function loadNonUserData() {
    const [overviewResponse, listResponse, templateResponse, giftModelsResponse, impersonationResponse] = await Promise.all([
      getJson<Overview & { error?: string }>(`/api/admin/overview?period=${period}`),
      getJson<{ giftLists: AdminGiftList[]; error?: string }>(`/api/admin/gift-lists?${listQuery}`),
      getJson<{ templates: AdminTemplate[]; error?: string }>('/api/admin/templates'),
      getJson<{ categories: AdminGiftModelCategory[]; error?: string }>('/api/admin/gift-models'),
      getJson<ImpersonationState>('/api/admin/impersonation'),
    ]);

    if (overviewResponse && !('error' in overviewResponse)) setOverview(overviewResponse);
    if (listResponse && Array.isArray(listResponse.giftLists)) setLists(listResponse.giftLists);
    if (templateResponse && Array.isArray(templateResponse.templates)) setTemplates(templateResponse.templates);
    if (giftModelsResponse && Array.isArray(giftModelsResponse.categories)) setGiftModelCategories(giftModelsResponse.categories);
    if (impersonationResponse) setImpersonation(impersonationResponse);
  }

  async function loadSectionUsers() {
    const responses = await Promise.all(
      ROLE_SECTIONS.map(({ role }) => {
        const params = new URLSearchParams({
          role,
          take: String(RECENT_LIMIT),
        });
        if (debouncedUserQuery) params.set('q', debouncedUserQuery);
        return getJson<UserApiResponse & { error?: string }>(`/api/admin/users?${params.toString()}`);
      })
    );

    const nextState: Record<ManagedRole, AdminUser[]> = {
      CLIENT: [],
      PARTNER: [],
      AMBASSADOR: [],
      EMPLOYEE: [],
    };

    responses.forEach((response, index) => {
      const role = ROLE_SECTIONS[index].role;
      if (response && !('error' in response) && Array.isArray(response.users)) {
        nextState[role] = response.users;
      }
    });

    setSectionUsers(nextState);
  }

  useEffect(() => {
    loadNonUserData().catch(() => null);
  }, [period, listQuery]);

  useEffect(() => {
    setVisibleListCount(LISTS_STEP);
  }, [debouncedListQuery]);

  useEffect(() => {
    loadSectionUsers().catch(() => null);
  }, [debouncedUserQuery]);

  async function patchUser(id: string, payload: unknown) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao atualizar usuário');
    await loadSectionUsers();
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Excluir ${user.name || user.email}? Esta ação remove a conta e os dados vinculados.`)) return;
    const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao excluir usuário');
    await loadSectionUsers();
  }

  async function toggleBlockUser(user: AdminUser) {
    if (user.isBlocked) {
      await patchUser(user.id, { isBlocked: false, blockReason: null });
      return;
    }

    const reason = window.prompt('Motivo do bloqueio (obrigatório):', user.blockReason || '');
    if (reason === null) return;
    const normalized = reason.trim();
    if (!normalized) {
      alert('Informe o motivo para bloquear o usuário.');
      return;
    }

    await patchUser(user.id, { isBlocked: true, blockReason: normalized });
  }

  async function patchList(id: string, payload: unknown) {
    const response = await fetch(`/api/admin/gift-lists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao atualizar lista');
    await loadNonUserData();
  }

  async function removeList(id: string) {
    if (!window.confirm('Excluir essa lista zerada?')) return;
    const response = await fetch(`/api/admin/gift-lists/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao excluir lista');
    await loadNonUserData();
  }

  async function copyListAsTemplate(list: AdminGiftList) {
    const defaultName = `${list.title} - modelo`;
    const name = window.prompt('Nome do novo template:', defaultName);
    if (name === null) return;

    const normalizedName = name.trim();
    if (!normalizedName) {
      alert('Informe um nome para o template.');
      return;
    }

    const category = window.prompt('Categoria do template:', 'modelos-clientes');
    if (category === null) return;

    setBusyListId(list.id);
    try {
      const response = await fetch(`/api/admin/gift-lists/${list.id}/copy-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          category: category.trim() || 'modelos-clientes',
          isActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao copiar site como template');
      alert(`Template criado: ${data.template?.name || normalizedName}`);
      await loadNonUserData();
    } finally {
      setBusyListId(null);
    }
  }

  async function openGiftCopyPanel(list: AdminGiftList) {
    setBusyListId(list.id);
    try {
      const response = await fetch(`/api/admin/gift-lists/${list.id}/gifts`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar presentes');

      const gifts = Array.isArray(data.gifts) ? data.gifts : [];
      if (!gifts.length) {
        alert('Essa lista ainda nao tem presentes para copiar.');
        return;
      }

      const firstCategory = giftModelCategories[0]?.slug || '';
      setGiftCopyPanel({
        list,
        gifts,
        selectedIds: gifts.map((gift: AdminGiftItem) => gift.id),
        categorySlug: firstCategory,
      });
    } finally {
      setBusyListId(null);
    }
  }

  async function copySelectedGiftsToModel() {
    if (!giftCopyPanel) return;
    if (!giftCopyPanel.categorySlug) {
      alert('Escolha uma categoria de modelo.');
      return;
    }
    if (!giftCopyPanel.selectedIds.length) {
      alert('Selecione pelo menos um presente.');
      return;
    }

    setBusyListId(giftCopyPanel.list.id);
    try {
      const response = await fetch(`/api/admin/gift-lists/${giftCopyPanel.list.id}/copy-gifts-to-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug: giftCopyPanel.categorySlug,
          giftIds: giftCopyPanel.selectedIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao copiar presentes');
      alert(`${data.importedCount || giftCopyPanel.selectedIds.length} presentes adicionados ao modelo.`);
      setGiftCopyPanel(null);
      await loadNonUserData();
    } finally {
      setBusyListId(null);
    }
  }

  async function patchTemplate(id: string, payload: unknown) {
    setBusyTemplateId(id);
    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao atualizar template');
      await loadNonUserData();
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function removeTemplate(id: string) {
    setBusyTemplateId(id);
    try {
      const response = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao excluir template');
      await loadNonUserData();
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function startImpersonation(userId: string, role?: AdminUser['role']) {
    const response = await fetch('/api/admin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao acessar painel do usuário');

    if (role === 'PARTNER') {
      window.location.assign('/parceiro');
      return;
    }
    if (role === 'AMBASSADOR') {
      window.location.assign('/embaixador');
      return;
    }
    if (role === 'EMPLOYEE') {
      window.location.assign('/funcionario');
      return;
    }
    window.location.assign('/dashboard');
  }

  async function stopImpersonation() {
    const response = await fetch('/api/admin/impersonation', { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao sair do modo de acesso');
    await loadNonUserData();
  }

  const visibleLists = useMemo(() => lists.slice(0, visibleListCount), [lists, visibleListCount]);

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb] bg-gradient-to-r from-[#fff3eb] via-[#fffaf6] to-[#fffdf9]">
        <CardHeader>
          <CardTitle className="text-3xl font-display">Admin LUMIÊ</CardTitle>
          <p className="text-sm text-[#8E3D2C]/80">Visão geral da operação da plataforma.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="w-full md:w-56">
            <p className="mb-1 text-xs text-gray-500">Período</p>
            <Select value={period} onValueChange={(value: PeriodFilter) => setPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês atual</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5 xl:grid-cols-9">
            <Stat icon={<Users className="h-4 w-4" />} label="Usuários" value={overview?.usersCount || 0} />
            <Stat icon={<Shield className="h-4 w-4" />} label="Admins" value={overview?.adminsCount || 0} />
            <Stat icon={<Shield className="h-4 w-4" />} label="Clientes" value={overview?.clientsCount || 0} />
            <Stat icon={<Shield className="h-4 w-4" />} label="Parceiros" value={overview?.partnersCount || 0} />
            <Stat icon={<Shield className="h-4 w-4" />} label="Embaixadores" value={overview?.ambassadorsCount || 0} />
            <Stat icon={<Shield className="h-4 w-4" />} label="Funcionários" value={overview?.employeesCount || 0} />
            <Stat icon={<Users className="h-4 w-4" />} label="Listas pub." value={overview?.publishedListsCount || 0} />
            <Stat icon={<LayoutTemplate className="h-4 w-4" />} label="Templates ativos" value={overview?.activeTemplatesCount || 0} />
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Arrecadado</p>
              <p className="mt-1 text-base font-semibold">{brl(overview?.paidTotal || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {impersonation?.isImpersonating && impersonation.effectiveUser ? (
        <Card className="border-[#e7d8cb] bg-[#fff7f1]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm text-[#8E3D2C]">
              Modo de acesso ativo: {impersonation.effectiveUser.name || 'Sem nome'} ({impersonation.effectiveUser.email}) - {impersonation.effectiveUser.role}
            </p>
            <Button variant="outline" onClick={() => stopImpersonation().catch((error) => alert(error.message))}>
              Sair do modo de acesso
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Usuários por perfil</CardTitle>
              <p className="text-sm text-gray-600">Os controles ficam aqui. O “Ver mais” abre a página completa de usuários.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/usuarios">Abrir usuários</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={qUser}
            onChange={(event) => setQUser(event.target.value)}
          />

          {ROLE_SECTIONS.map((section) => (
            <RoleSection
              key={section.role}
              title={section.title}
              description={section.description}
              users={sectionUsers[section.role]}
              role={section.role}
              moreHref={`/admin/usuarios?role=${section.role}`}
              onOpenPanel={startImpersonation}
              onPatchUser={patchUser}
              onToggleBlock={toggleBlockUser}
              onDeleteUser={deleteUser}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Listas (edição admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="Buscar lista por título, slug ou e-mail"
            value={qList}
            onChange={(event) => setQList(event.target.value)}
          />
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Lista</th>
                  <th className="p-2 text-left">Dono</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleLists.map((list) => (
                  <tr key={list.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{list.title}</p>
                      <p className="text-xs text-gray-500">/{list.slug} • {list._count.gifts} presentes</p>
                    </td>
                    <td className="p-2">
                      <p>{list.user.name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">{list.user.email}</p>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => patchList(list.id, { isPublished: !list.isPublished }).catch((error) => alert(error.message))}>
                          {list.isPublished ? 'Despublicar' : 'Publicar'}
                        </Button>
                        <a href={`/site/${list.slug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">Abrir</Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyListId === list.id}
                          onClick={() => copyListAsTemplate(list).catch((error) => alert(error.message))}
                        >
                          Copiar site
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyListId === list.id}
                          onClick={() => openGiftCopyPanel(list).catch((error) => alert(error.message))}
                        >
                          Copiar presentes
                        </Button>
                        {list._count.gifts === 0 && list._count.orders === 0 && list._count.messages === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => removeList(list.id).catch((error) => alert(error.message))}
                          >
                            Excluir
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {giftCopyPanel ? (
            <div className="rounded-xl border border-[#ead9cd] bg-[#fffaf6] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-[#8E3D2C]">Copiar presentes para modelos prontos</h3>
                  <p className="text-sm text-gray-600">
                    Lista: {giftCopyPanel.list.title} ({giftCopyPanel.gifts.length} presentes)
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setGiftCopyPanel(null)}>
                  Fechar
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="max-h-80 overflow-auto rounded-lg border bg-white">
                  {giftCopyPanel.gifts.map((gift) => {
                    const checked = giftCopyPanel.selectedIds.includes(gift.id);
                    return (
                      <label key={gift.id} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#8E3D2C]"
                          checked={checked}
                          onChange={(event) => {
                            const nextSelected = event.target.checked
                              ? [...giftCopyPanel.selectedIds, gift.id]
                              : giftCopyPanel.selectedIds.filter((id) => id !== gift.id);
                            setGiftCopyPanel({ ...giftCopyPanel, selectedIds: nextSelected });
                          }}
                        />
                        {gift.imageUrl ? (
                          <img src={gift.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <span className="h-12 w-12 rounded-md bg-[#f3e6dc]" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{gift.name}</span>
                          <span className="block text-xs text-gray-500">
                            {brl(Number(gift.basePrice || 0))} - qtd. {gift.totalQuantity}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-3 rounded-lg border bg-white p-3">
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Categoria de destino</p>
                    <Select
                      value={giftCopyPanel.categorySlug}
                      onValueChange={(value) => setGiftCopyPanel({ ...giftCopyPanel, categorySlug: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {giftModelCategories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    disabled={busyListId === giftCopyPanel.list.id || !giftCopyPanel.selectedIds.length}
                    onClick={() => copySelectedGiftsToModel().catch((error) => alert(error.message))}
                  >
                    Adicionar selecionados
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftCopyPanel({ ...giftCopyPanel, selectedIds: giftCopyPanel.gifts.map((gift) => gift.id) })}
                    >
                      Selecionar todos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGiftCopyPanel({ ...giftCopyPanel, selectedIds: [] })}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Mostrando {visibleLists.length} de {lists.length}</p>
            <div className="flex flex-wrap gap-2">
              {visibleListCount > LISTS_STEP ? (
                <Button variant="outline" size="sm" onClick={() => setVisibleListCount((current) => Math.max(LISTS_STEP, current - LISTS_STEP))}>
                  Ver menos
                </Button>
              ) : null}
              {visibleListCount < lists.length ? (
                <Button variant="outline" size="sm" onClick={() => setVisibleListCount((current) => Math.min(lists.length, current + LISTS_STEP))}>
                  Ver mais
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Templates (publicação imediata)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-auto rounded-lg border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Template</th>
                  <th className="p-2 text-left">Categoria</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-gray-500">/{template.slug}</p>
                    </td>
                    <td className="p-2">{template.category}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyTemplateId === template.id}
                          onClick={() => patchTemplate(template.id, { isActive: !template.isActive }).catch((error) => alert(error.message))}
                        >
                          {template.isActive ? 'Despublicar' : 'Publicar'}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/templates/editor/${template.id}`}>Editar</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/templates/${encodeURIComponent(template.slug)}`} target="_blank" rel="noreferrer">
                            Visualizar
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyTemplateId === template.id}
                          onClick={() => {
                            if (window.confirm('Excluir template?')) {
                              removeTemplate(template.id).catch((error) => alert(error.message));
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleSection({
  role,
  title,
  description,
  users,
  moreHref,
  onOpenPanel,
  onPatchUser,
  onToggleBlock,
  onDeleteUser,
}: {
  role: ManagedRole;
  title: string;
  description: string;
  users: AdminUser[];
  moreHref: string;
  onOpenPanel: (userId: string, role?: AdminUser['role']) => Promise<void>;
  onPatchUser: (id: string, payload: unknown) => Promise<void>;
  onToggleBlock: (user: AdminUser) => Promise<void>;
  onDeleteUser: (user: AdminUser) => Promise<void>;
}) {
  const metricLabel =
    role === 'CLIENT'
      ? 'Origem'
      : role === 'PARTNER'
        ? 'Clientes'
        : role === 'AMBASSADOR'
          ? 'Rede'
          : 'Listas';

  return (
    <div className="rounded-xl border border-[#ead9cd]">
      <div className="border-b border-[#ead9cd] bg-[#fffaf6] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-[#8E3D2C]">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={moreHref}>Ver mais</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-[#faf3ee]">
            <tr>
              <th className="p-2 text-left">Usuário</th>
              <th className="p-2 text-left">{metricLabel}</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => onOpenPanel(user.id, user.role).catch((error) => alert(error.message))}
                  >
                    <p className="font-medium hover:text-[#8E3D2C]">{user.name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </button>
                  {user.isBlocked && user.blockReason ? (
                    <p className="mt-1 text-xs text-red-600">Motivo: {user.blockReason}</p>
                  ) : null}
                </td>
                <td className="p-2">
                  {role === 'CLIENT' ? (
                    <OriginDisplay user={user} />
                  ) : null}
                  {role === 'PARTNER' ? (
                    <Badge variant="outline">{user._count.referredClientsAsPartner} clientes</Badge>
                  ) : null}
                  {role === 'AMBASSADOR' ? (
                    <div className="space-y-1">
                      <Badge variant="outline">{user._count.referredClientsAsAmbassador} clientes</Badge>
                      <Badge variant="outline">{user._count.partnerReferrals} parceiros</Badge>
                    </div>
                  ) : null}
                  {role === 'EMPLOYEE' ? <Badge variant="outline">{user._count.giftLists} listas</Badge> : null}
                </td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {role === 'PARTNER' ? (
                      <Button size="sm" variant="outline" onClick={() => onPatchUser(user.id, { role: 'AMBASSADOR' }).catch((error) => alert(error.message))}>
                        Virar embaixador
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => onToggleBlock(user).catch((error) => alert(error.message))}>
                      {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => onDeleteUser(user).catch((error) => alert(error.message))}>
                      Excluir
                    </Button>
                    <Button size="sm" onClick={() => onOpenPanel(user.id, user.role).catch((error) => alert(error.message))}>
                      Acessar painel
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td className="p-3 text-sm text-gray-500" colSpan={3}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OriginDisplay({ user }: { user: AdminUser }) {
  const partner = user.referredByPartner?.name || user.referredByPartner?.email || null;
  const ambassador = user.referredByAmbassador?.name || user.referredByAmbassador?.email || null;

  if (!partner && !ambassador) {
    return <Badge variant="outline">LUMIÊ</Badge>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {partner ? (
        <span className="inline-flex items-center rounded-full border border-[#ead9cd] bg-white px-2 py-1 text-xs text-[#5f4a41]">
          <span className="mr-1 text-[#8E3D2C]">Parceiro</span>
          {partner}
        </span>
      ) : null}
      {ambassador ? (
        <span className="inline-flex items-center rounded-full border border-[#ead9cd] bg-white px-2 py-1 text-xs text-[#5f4a41]">
          <span className="mr-1 text-[#8E3D2C]">Embaixador</span>
          {ambassador}
        </span>
      ) : null}
      {!partner || !ambassador ? (
        <span className="inline-flex items-center rounded-full border border-dashed border-[#ead9cd] bg-[#fffaf6] px-2 py-1 text-xs text-[#8E3D2C]">
          LUMIÊ
        </span>
      ) : null}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
