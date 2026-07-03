'use client';

import { useEffect, useMemo, useState, type UIEvent } from 'react';
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
  plan: 'FREE' | 'PREMIUM';
  planExpiresAt?: string | null;
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
type AffiliateOption = { id: string; name: string | null; email: string; role: AdminUser['role'] };

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'CLIENT', label: 'Clientes' },
  { value: 'PARTNER', label: 'Parceiros' },
  { value: 'AMBASSADOR', label: 'Embaixadores' },
  { value: 'EMPLOYEE', label: 'Funcionários' },
];
const INITIAL_LIMIT = 10;
const LOAD_MORE_STEP = 10;

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
  const [partners, setPartners] = useState<AffiliateOption[]>([]);
  const [ambassadors, setAmbassadors] = useState<AffiliateOption[]>([]);
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/admin/users?roles=PARTNER,AMBASSADOR&take=200', { cache: 'no-store' });
        const data: UserApiResponse & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar parceiros e embaixadores');
        if (cancelled) return;

        const options = data.users || [];
        setPartners(options.filter((user) => user.role === 'PARTNER'));
        setAmbassadors(options.filter((user) => user.role === 'AMBASSADOR'));
      } catch (error: any) {
        if (!cancelled) alert(error?.message || 'Erro ao carregar parceiros e embaixadores');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function togglePlan(user: AdminUser) {
    const nextPlan = user.plan === 'PREMIUM' ? 'FREE' : 'PREMIUM';
    const payload =
      nextPlan === 'PREMIUM'
        ? {
            plan: nextPlan,
            planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }
        : { plan: nextPlan, planExpiresAt: null };
    await patchUser(user.id, payload);
  }

  async function updateReferrals(user: AdminUser, payload: { referredByPartnerId?: string | null; referredByAmbassadorId?: string | null }) {
    await patchUser(user.id, payload);
  }

  function handleUsersScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
    if (nearBottom && users.length < total && !loading) {
      setLimit((current) => current + LOAD_MORE_STEP);
    }
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

        <div className="max-h-[520px] overflow-auto rounded-lg border bg-white" onScroll={handleUsersScroll}>
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-[#faf3ee]">
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
                    {role === 'CLIENT' ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={user.plan === 'PREMIUM' ? 'default' : 'outline'}>
                          {user.plan === 'PREMIUM' ? 'Premium' : 'Gratuito'}
                        </Badge>
                        {user.plan === 'PREMIUM' && user.planExpiresAt ? (
                          <span className="text-xs text-gray-500">
                            expira em {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {user.isBlocked && user.blockReason ? (
                      <p className="mt-1 text-xs text-red-600">Motivo: {user.blockReason}</p>
                    ) : null}
                  </td>
                  <td className="p-2">
                    {role === 'CLIENT' ? (
                      <div className="space-y-2">
                        <OriginDisplay user={user} />
                        <ReferralControls
                          user={user}
                          partners={partners}
                          ambassadors={ambassadors}
                          onSave={(payload) => updateReferrals(user, payload)}
                        />
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
                      {role === 'CLIENT' ? (
                        <Button size="sm" variant="outline" onClick={() => togglePlan(user).catch((error) => alert(error.message))}>
                          {user.plan === 'PREMIUM' ? 'Voltar ao gratuito' : 'Ativar premium'}
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
              {loading ? (
                <tr>
                  <td className="p-3 text-sm text-gray-500" colSpan={3}>
                    Carregando mais usuários...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">Mostrando {users.length} de {total}</p>
        </div>
      </CardContent>
    </Card>
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

function formatOptionLabel(user: AffiliateOption) {
  return `${user.name || 'Sem nome'} - ${user.email}`;
}

function ReferralControls({
  user,
  partners,
  ambassadors,
  onSave,
}: {
  user: AdminUser;
  partners: AffiliateOption[];
  ambassadors: AffiliateOption[];
  onSave: (payload: { referredByPartnerId?: string | null; referredByAmbassadorId?: string | null }) => Promise<void>;
}) {
  const [partnerId, setPartnerId] = useState(user.referredByPartner?.id ?? 'none');
  const [ambassadorId, setAmbassadorId] = useState(user.referredByAmbassador?.id ?? 'none');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPartnerId(user.referredByPartner?.id ?? 'none');
    setAmbassadorId(user.referredByAmbassador?.id ?? 'none');
  }, [user.referredByPartner?.id, user.referredByAmbassador?.id]);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        referredByPartnerId: partnerId === 'none' ? null : partnerId,
        referredByAmbassadorId: ambassadorId === 'none' ? null : ambassadorId,
      });
    } catch (error: any) {
      alert(error?.message || 'Erro ao atualizar vinculos');
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!window.confirm('Desvincular parceiro e embaixador deste cliente?')) return;
    setSaving(true);
    try {
      setPartnerId('none');
      setAmbassadorId('none');
      await onSave({ referredByPartnerId: null, referredByAmbassadorId: null });
    } catch (error: any) {
      alert(error?.message || 'Erro ao desvincular');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid max-w-[560px] gap-2 rounded-md border border-[#ead9cd] bg-[#fffaf6] p-2">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1 text-xs text-gray-600">
          <span>Parceiro</span>
          <select
            className="h-9 w-full rounded-md border border-[#e7d8cb] bg-white px-2 text-xs"
            value={partnerId}
            onChange={(event) => setPartnerId(event.target.value)}
            disabled={saving}
          >
            <option value="none">Sem parceiro</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {formatOptionLabel(partner)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs text-gray-600">
          <span>Embaixador</span>
          <select
            className="h-9 w-full rounded-md border border-[#e7d8cb] bg-white px-2 text-xs"
            value={ambassadorId}
            onChange={(event) => setAmbassadorId(event.target.value)}
            disabled={saving}
          >
            <option value="none">Sem embaixador</option>
            {ambassadors.map((ambassador) => (
              <option key={ambassador.id} value={ambassador.id}>
                {formatOptionLabel(ambassador)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Salvando...' : 'Salvar vinculo'}
        </Button>
        <Button
          size="sm"
          type="button"
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
          disabled={saving || (partnerId === 'none' && ambassadorId === 'none')}
          onClick={clear}
        >
          Desvincular
        </Button>
      </div>
    </div>
  );
}
