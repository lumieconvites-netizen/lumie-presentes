'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

type RoleFilter = 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
type UserApiResponse = { users: AdminUser[]; total: number; hasMore: boolean };

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'CLIENT', label: 'Clientes' },
  { value: 'PARTNER', label: 'Parceiros' },
  { value: 'AMBASSADOR', label: 'Embaixadores' },
  { value: 'EMPLOYEE', label: 'Funcionários' },
];
const INITIAL_LIMIT = 50;
const LOAD_MORE_STEP = 50;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as RoleFilter) || 'CLIENT';
  const safeInitialRole = ROLE_OPTIONS.some((option) => option.value === initialRole) ? initialRole : 'CLIENT';

  const [role, setRole] = useState<RoleFilter>(safeInitialRole);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const debouncedQuery = useDebouncedValue(q.trim(), 350);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      role,
      take: String(limit),
    });
    if (debouncedQuery) params.set('q', debouncedQuery);
    return params.toString();
  }, [role, limit, debouncedQuery]);

  useEffect(() => {
    if (searchParams.get('role') === role) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('role', role);
    router.replace(`/admin/usuarios?${nextParams.toString()}`);
  }, [role, router, searchParams]);

  useEffect(() => {
    setLimit(INITIAL_LIMIT);
  }, [role, debouncedQuery]);

  async function reloadUsers(activeQuery: string) {
    const response = await fetch(`/api/admin/users?${activeQuery}`, { cache: 'no-store' });
    const data: UserApiResponse & { error?: string } = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao carregar usuários');
    setUsers(data.users || []);
    setTotal(data.total || 0);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users?${queryString}`, { cache: 'no-store' });
        const data: UserApiResponse & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar usuários');
        if (!cancelled) {
          setUsers(data.users || []);
          setTotal(data.total || 0);
        }
      } catch (error: any) {
        if (!cancelled) alert(error?.message || 'Erro ao carregar usuários');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  async function patchUser(id: string, payload: unknown) {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao atualizar usuário');
    await reloadUsers(queryString);
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Excluir ${user.name || user.email}? Esta ação remove a conta e os dados vinculados.`)) return;
    const response = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao excluir usuário');
    await reloadUsers(queryString);
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

  async function startImpersonation(user: AdminUser) {
    const response = await fetch('/api/admin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao acessar painel do usuário');

    if (user.role === 'PARTNER') {
      window.location.assign('/parceiro');
      return;
    }
    if (user.role === 'AMBASSADOR') {
      window.location.assign('/embaixador');
      return;
    }
    if (user.role === 'EMPLOYEE') {
      window.location.assign('/funcionario');
      return;
    }
    window.location.assign('/dashboard');
  }

  const metricLabel =
    role === 'CLIENT'
      ? 'Origem'
      : role === 'PARTNER'
        ? 'Clientes'
        : role === 'AMBASSADOR'
          ? 'Rede'
          : 'Listas';

  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Usuários</CardTitle>
            <p className="text-sm text-gray-600">Gestão completa por perfil, com busca e carregamento em lotes.</p>
          </div>
          <Badge variant="outline">{total} registros</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={role === option.value ? 'default' : 'outline'}
              className={role === option.value ? 'bg-[#8e3d2c] hover:bg-[#7a3426] text-white' : ''}
              onClick={() => setRole(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Input
          placeholder="Buscar por nome ou e-mail"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />

        <div className="overflow-auto rounded-lg border">
          <table className="w-full min-w-[980px] text-sm">
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
                    <p className="font-medium">{user.name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.isBlocked && user.blockReason ? (
                      <p className="mt-1 text-xs text-red-600">Motivo: {user.blockReason}</p>
                    ) : null}
                  </td>
                  <td className="p-2">
                    {role === 'CLIENT' ? (
                      <div className="space-y-1">
                        <Badge variant="outline">
                          Parceiro: {user.referredByPartner?.name || user.referredByPartner?.email || 'LUMIÊ'}
                        </Badge>
                        <Badge variant="outline">
                          Embaixador: {user.referredByAmbassador?.name || user.referredByAmbassador?.email || 'LUMIÊ'}
                        </Badge>
                      </div>
                    ) : null}
                    {role === 'PARTNER' ? <Badge variant="outline">{user._count.referredClientsAsPartner} clientes</Badge> : null}
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
                        <Button size="sm" variant="outline" onClick={() => patchUser(user.id, { role: 'AMBASSADOR' }).catch((error) => alert(error.message))}>
                          Virar embaixador
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => toggleBlockUser(user).catch((error) => alert(error.message))}>
                        {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => deleteUser(user).catch((error) => alert(error.message))}>
                        Excluir
                      </Button>
                      <Button size="sm" onClick={() => startImpersonation(user).catch((error) => alert(error.message))}>
                        Acessar painel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && !loading ? (
                <tr>
                  <td className="p-3 text-sm text-gray-500" colSpan={3}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Mostrando {users.length} de {total}</p>
          {users.length < total ? (
            <Button variant="outline" onClick={() => setLimit((current) => current + LOAD_MORE_STEP)}>
              Ver mais
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
