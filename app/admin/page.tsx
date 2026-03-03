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
type UserApiResponse = { users: AdminUser[] };

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const RECENT_LIMIT = 10;
const ROLE_SECTIONS: { role: ManagedRole; title: string; description: string }[] = [
  { role: 'CLIENT', title: 'Clientes', description: 'Últimos clientes cadastrados.' },
  { role: 'PARTNER', title: 'Parceiros', description: 'Últimos parceiros cadastrados.' },
  { role: 'AMBASSADOR', title: 'Embaixadores', description: 'Últimos embaixadores cadastrados.' },
  { role: 'EMPLOYEE', title: 'Funcionários', description: 'Últimos acessos internos.' },
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
  const [qList, setQList] = useState('');
  const [recentUsers, setRecentUsers] = useState<Record<ManagedRole, AdminUser[]>>({
    CLIENT: [],
    PARTNER: [],
    AMBASSADOR: [],
    EMPLOYEE: [],
  });

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

  async function loadRecentUsers() {
    const responses = await Promise.all(
      ROLE_SECTIONS.map(({ role }) =>
        getJson<UserApiResponse & { error?: string }>(`/api/admin/users?role=${role}&take=${RECENT_LIMIT}`)
      )
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

    setRecentUsers(nextState);
  }

  useEffect(() => {
    loadNonUserData().catch(() => null);
  }, [period, listQuery]);

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
              <CardTitle>Usuários recentes</CardTitle>
              <p className="text-sm text-gray-600">O dashboard mostra só os últimos registros. A gestão completa fica em Usuários.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/usuarios">Abrir usuários</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ROLE_SECTIONS.map((section) => (
            <RecentRoleSection
              key={section.role}
              title={section.title}
              description={section.description}
              users={recentUsers[section.role]}
              moreHref={`/admin/usuarios?role=${section.role}`}
              onOpenPanel={startImpersonation}
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

function RecentRoleSection({
  title,
  description,
  users,
  moreHref,
  onOpenPanel,
}: {
  title: string;
  description: string;
  users: AdminUser[];
  moreHref: string;
  onOpenPanel: (userId: string, role?: AdminUser['role']) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-[#ead9cd]">
      <div className="border-b border-[#ead9cd] bg-[#fffaf6] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href={moreHref} className="font-medium text-[#8E3D2C] hover:underline">
              {title}
            </Link>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={moreHref}>Ver mais</Link>
          </Button>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-[#ead9cd] p-3">
            <button
              type="button"
              className="text-left"
              onClick={() => onOpenPanel(user.id, user.role).catch((error) => alert(error.message))}
            >
              <p className="font-medium hover:text-[#8E3D2C]">{user.name || 'Sem nome'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </button>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge variant="outline">{user._count.giftLists} listas</Badge>
              <Button size="sm" variant="outline" onClick={() => onOpenPanel(user.id, user.role).catch((error) => alert(error.message))}>
                Abrir
              </Button>
            </div>
          </div>
        ))}
        {!users.length ? <p className="text-sm text-gray-500">Nenhum registro recente.</p> : null}
      </div>
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
