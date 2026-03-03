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
  blockedAté?: string | null;
  _count: { giftLists: number };
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

type ImpersonationState = {
  isImpersonating: boolean;
  effectiveUser?: { id: string; name: string | null; email: string; role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE' };
};

type PeriodFilter = 'total' | 'current_month' | 'last_month';
type ManagedRole = 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
type UserApiResponse = { users: AdminUser[]; total: number; hasMore: boolean };

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const INITIAL_ROLE_LIMIT = 10;
const LOAD_MORE_STEP = 50;
const SIDE_RECENT_LIMIT = 15;
const ROLE_SECTIONS: { role: ManagedRole; title: string; description: string }[] = [
  { role: 'CLIENT', title: 'Clientes', description: 'Contas finais da plataforma.' },
  { role: 'PARTNER', title: 'Parceiros', description: 'Contas com comissão por indicação.' },
  { role: 'AMBASSADOR', title: 'Embaixadores', description: 'Rede de parceiros e clientes.' },
  { role: 'EMPLOYEE', title: 'Funcionários', description: 'Equipe interna com acesso operacional.' },
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
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [qUser, setQUser] = useState('');
  const [qList, setQList] = useState('');
  const [usersByRole, setUsersByRole] = useState<Record<ManagedRole, AdminUser[]>>({
    CLIENT: [],
    PARTNER: [],
    AMBASSADOR: [],
    EMPLOYEE: [],
  });
  const [totalsByRole, setTotalsByRole] = useState<Record<ManagedRole, number>>({
    CLIENT: 0,
    PARTNER: 0,
    AMBASSADOR: 0,
    EMPLOYEE: 0,
  });
  const [visibleByRole, setVisibleByRole] = useState<Record<ManagedRole, number>>({
    CLIENT: INITIAL_ROLE_LIMIT,
    PARTNER: INITIAL_ROLE_LIMIT,
    AMBASSADOR: INITIAL_ROLE_LIMIT,
    EMPLOYEE: INITIAL_ROLE_LIMIT,
  });
  const [recentUsers, setRecentUsers] = useState<Record<'CLIENT' | 'PARTNER', AdminUser[]>>({
    CLIENT: [],
    PARTNER: [],
  });
  const [usersLoading, setUsersLoading] = useState(true);

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
    const [overviewResponse, listResponse, templateResponse, impersonationResponse] = await Promise.all([
      getJson<Overview & { error?: string }>(`/api/admin/overview?period=${period}`),
      getJson<{ giftLists: AdminGiftList[]; error?: string }>(`/api/admin/gift-lists?${listQuery}`),
      getJson<{ templates: AdminTemplate[]; error?: string }>('/api/admin/templates'),
      getJson<ImpersonationState>('/api/admin/impersonation'),
    ]);

    if (overviewResponse && !('error' in overviewResponse)) setOverview(overviewResponse);
    if (listResponse && Array.isArray(listResponse.giftLists)) setLists(listResponse.giftLists);
    if (templateResponse && Array.isArray(templateResponse.templates)) setTemplates(templateResponse.templates);
    if (impersonationResponse) setImpersonation(impersonationResponse);
  }

  async function fetchRoleUsers(role: ManagedRole, take: number, query: string) {
    const params = new URLSearchParams({
      role,
      take: String(take),
    });
    if (query) params.set('q', query);

    const response = await getJson<UserApiResponse & { error?: string }>(`/api/admin/users?${params.toString()}`);
    if (!response || 'error' in response || !Array.isArray(response.users)) {
      throw new Error(`Erro ao carregar ${role.toLowerCase()}`);
    }

    setUsersByRole((current) => ({ ...current, [role]: response.users }));
    setTotalsByRole((current) => ({ ...current, [role]: response.total || 0 }));
    setVisibleByRole((current) => ({ ...current, [role]: take }));
  }

  async function loadUserSections(query: string) {
    setUsersLoading(true);
    try {
      await Promise.all(ROLE_SECTIONS.map(({ role }) => fetchRoleUsers(role, INITIAL_ROLE_LIMIT, query)));
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar usuários.');
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadRecentUsers() {
    const [clientResponse, partnerResponse] = await Promise.all([
      getJson<UserApiResponse & { error?: string }>(`/api/admin/users?role=CLIENT&take=${SIDE_RECENT_LIMIT}`),
      getJson<UserApiResponse & { error?: string }>(`/api/admin/users?role=PARTNER&take=${SIDE_RECENT_LIMIT}`),
    ]);

    if (clientResponse && !('error' in clientResponse) && Array.isArray(clientResponse.users)) {
      setRecentUsers((current) => ({ ...current, CLIENT: clientResponse.users }));
    }
    if (partnerResponse && !('error' in partnerResponse) && Array.isArray(partnerResponse.users)) {
      setRecentUsers((current) => ({ ...current, PARTNER: partnerResponse.users }));
    }
  }

  useEffect(() => {
    loadNonUserData().catch(() => null);
  }, [period, listQuery]);

  useEffect(() => {
    loadUserSections(debouncedUserQuery).catch(() => null);
  }, [debouncedUserQuery]);

  useEffect(() => {
    loadRecentUsers().catch(() => null);
  }, []);

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

  async function patchUser(id: string, payload: unknown) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao atualizar usuário');
    await Promise.all([loadUserSections(debouncedUserQuery), loadRecentUsers()]);
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

  async function removeList(id: string) {
    if (!window.confirm('Excluir essa lista zerada?')) return;
    const response = await fetch(`/api/admin/gift-lists/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao excluir lista');
    await loadNonUserData();
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

  async function startImpersonation(userId: string) {
    const targetRole =
      Object.values(usersByRole)
        .flat()
        .find((user) => user.id === userId)?.role ??
      Object.values(recentUsers)
        .flat()
        .find((user) => user.id === userId)?.role;

    const response = await fetch('/api/admin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao acessar painel do usuário');

    if (targetRole === 'PARTNER') {
      window.location.assign('/parceiro');
      return;
    }
    if (targetRole === 'AMBASSADOR') {
      window.location.assign('/embaixador');
      return;
    }
    if (targetRole === 'EMPLOYEE') {
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

  async function loadMoreUsers(role: ManagedRole) {
    const nextCount = visibleByRole[role] + LOAD_MORE_STEP;
    try {
      await fetchRoleUsers(role, nextCount, debouncedUserQuery);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar mais usuários.');
    }
  }

  function renderUserActions(user: AdminUser) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" onClick={() => patchUser(user.id, { role: 'PARTNER' }).catch((error) => alert(error.message))}>
          Virar parceiro
        </Button>
        <Button size="sm" variant="outline" onClick={() => patchUser(user.id, { role: 'AMBASSADOR' }).catch((error) => alert(error.message))}>
          Virar embaixador
        </Button>
        <Button size="sm" variant="outline" onClick={() => patchUser(user.id, { role: 'EMPLOYEE' }).catch((error) => alert(error.message))}>
          Virar funcionário
        </Button>
        <Button size="sm" variant="outline" onClick={() => patchUser(user.id, { role: 'CLIENT' }).catch((error) => alert(error.message))}>
          Virar cliente
        </Button>
        <Button size="sm" variant="outline" onClick={() => toggleBlockUser(user).catch((error) => alert(error.message))}>
          {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
        </Button>
        {user.role !== 'ADMIN' ? (
          <Button size="sm" onClick={() => startImpersonation(user.id).catch((error) => alert(error.message))}>
            Acessar painel
          </Button>
        ) : (
          <span className="text-xs text-gray-500">Admin</span>
        )}
      </div>
    );
  }

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Usuários por perfil</CardTitle>
            <p className="text-sm text-gray-600">A busca agora é dividida por papel e abre só os últimos registros por padrão.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por nome ou e-mail"
              value={qUser}
              onChange={(event) => setQUser(event.target.value)}
            />

            {ROLE_SECTIONS.map((section) => {
              const users = usersByRole[section.role];
              const total = totalsByRole[section.role];
              const hasMore = users.length < total;

              return (
                <div key={section.role} className="rounded-xl border border-[#ead9cd]">
                  <div className="border-b border-[#ead9cd] bg-[#fffaf6] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-[#8E3D2C]">{section.title}</h3>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                      <Badge variant="outline">{total} encontrados</Badge>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="bg-[#faf3ee]">
                        <tr>
                          <th className="p-2 text-left">Usuário</th>
                          <th className="p-2 text-left">Listas</th>
                          <th className="p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-t">
                            <td className="p-2">
                              <p className="font-medium">{user.name || 'Sem nome'}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              {user.isBlocked && user.blockReason ? (
                                <p className="mt-1 text-xs text-red-600">Motivo: {user.blockReason}</p>
                              ) : null}
                            </td>
                            <td className="p-2">{user._count.giftLists}</td>
                            <td className="p-2">{renderUserActions(user)}</td>
                          </tr>
                        ))}
                        {!users.length && !usersLoading ? (
                          <tr>
                            <td className="p-3 text-sm text-gray-500" colSpan={3}>
                              Nenhum registro encontrado.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ead9cd] px-4 py-3">
                    <p className="text-xs text-gray-500">
                      Mostrando {users.length} de {total}
                    </p>
                    {hasMore ? (
                      <Button variant="outline" size="sm" onClick={() => loadMoreUsers(section.role)}>
                        Ver mais 50
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <RecentUsersCard
            title="Clientes recentes"
            description="Últimos 15 clientes cadastrados."
            users={recentUsers.CLIENT}
            onOpenPanel={startImpersonation}
          />
          <RecentUsersCard
            title="Parceiros recentes"
            description="Últimos 15 parceiros cadastrados."
            users={recentUsers.PARTNER}
            onOpenPanel={startImpersonation}
          />
        </div>
      </div>

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
                {lists.map((list) => (
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

function RecentUsersCard({
  title,
  description,
  users,
  onOpenPanel,
}: {
  title: string;
  description: string;
  users: AdminUser[];
  onOpenPanel: (userId: string) => Promise<void>;
}) {
  return (
    <Card className="border-[#e7d8cb]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-[#ead9cd] p-3">
            <p className="font-medium">{user.name || 'Sem nome'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge variant="outline">{user._count.giftLists} listas</Badge>
              <Button size="sm" variant="outline" onClick={() => onOpenPanel(user.id).catch((error) => alert(error.message))}>
                Abrir
              </Button>
            </div>
          </div>
        ))}
        {!users.length ? <p className="text-sm text-gray-500">Nenhum registro recente.</p> : null}
      </CardContent>
    </Card>
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
