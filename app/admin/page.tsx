'use client';

import { useEffect, useMemo, useState } from 'react';

type Overview = {
  usersCount: number;
  adminsCount: number;
  blockedUsersCount: number;
  listsCount: number;
  publishedListsCount: number;
  ordersCount: number;
  paidTotal: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR';
  isBlocked: boolean;
  emailVerified: string | null;
  createdAt: string;
  _count: { giftLists: number };
};

type AdminGiftList = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  feeMode: 'PASS_TO_GUEST' | 'ABSORB';
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    gifts: number;
    orders: number;
    messages: number;
  };
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [giftLists, setGiftLists] = useState<AdminGiftList[]>([]);

  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR'>('ALL');
  const [userBlockedFilter, setUserBlockedFilter] = useState<'ALL' | 'BLOCKED' | 'ACTIVE'>('ALL');

  const [listQuery, setListQuery] = useState('');
  const [listPublishedFilter, setListPublishedFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyListId, setBusyListId] = useState<string | null>(null);

  const userQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (userQuery.trim()) params.set('q', userQuery.trim());
    if (userRoleFilter !== 'ALL') params.set('role', userRoleFilter);
    if (userBlockedFilter === 'BLOCKED') params.set('blocked', 'true');
    if (userBlockedFilter === 'ACTIVE') params.set('blocked', 'false');
    return params.toString();
  }, [userBlockedFilter, userQuery, userRoleFilter]);

  const listQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (listQuery.trim()) params.set('q', listQuery.trim());
    if (listPublishedFilter === 'PUBLISHED') params.set('published', 'true');
    if (listPublishedFilter === 'DRAFT') params.set('published', 'false');
    return params.toString();
  }, [listPublishedFilter, listQuery]);

  async function loadOverview() {
    const res = await fetch('/api/admin/overview', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Erro ao carregar overview');
    setOverview(data);
  }

  async function loadUsers() {
    const res = await fetch(`/api/admin/users?${userQueryString}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Erro ao carregar usuarios');
    setUsers(data.users ?? []);
  }

  async function loadGiftLists() {
    const res = await fetch(`/api/admin/gift-lists?${listQueryString}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? 'Erro ao carregar listas');
    setGiftLists(data.giftLists ?? []);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadUsers(), loadGiftLists()]);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao carregar painel admin');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadUsers().catch(() => null);
  }, [userQueryString]);

  useEffect(() => {
    loadGiftLists().catch(() => null);
  }, [listQueryString]);

  async function updateUser(
    userId: string,
    payload: { role?: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR'; isBlocked?: boolean }
  ) {
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao atualizar usuario');
      await Promise.all([loadOverview(), loadUsers()]);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao atualizar usuario');
    } finally {
      setBusyUserId(null);
    }
  }

  async function updateGiftList(giftListId: string, isPublished: boolean) {
    setBusyListId(giftListId);
    try {
      const res = await fetch(`/api/admin/gift-lists/${giftListId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao atualizar lista');
      await Promise.all([loadOverview(), loadGiftLists()]);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao atualizar lista');
    } finally {
      setBusyListId(null);
    }
  }

  if (loading && !overview) {
    return <div className="p-4">Carregando painel admin...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Usuarios</p>
          <p className="text-2xl font-semibold">{overview?.usersCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Admins</p>
          <p className="text-2xl font-semibold">{overview?.adminsCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Bloqueados</p>
          <p className="text-2xl font-semibold">{overview?.blockedUsersCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Listas</p>
          <p className="text-2xl font-semibold">{overview?.listsCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Publicadas</p>
          <p className="text-2xl font-semibold">{overview?.publishedListsCount ?? 0}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Arrecadacao paga</p>
          <p className="text-xl font-semibold">{formatCurrency(overview?.paidTotal ?? 0)}</p>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Gestao de Usuarios</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <input
              className="border rounded-md h-10 px-3 text-sm"
              placeholder="Buscar por nome ou email"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <select
              className="border rounded-md h-10 px-3 text-sm"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value as any)}
            >
              <option value="ALL">Todos os papeis</option>
              <option value="ADMIN">Admins</option>
              <option value="CLIENT">Clientes</option>
              <option value="PARTNER">Parceiros</option>
              <option value="AMBASSADOR">Embaixadores</option>
            </select>
            <select
              className="border rounded-md h-10 px-3 text-sm"
              value={userBlockedFilter}
              onChange={(e) => setUserBlockedFilter(e.target.value as any)}
            >
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="BLOCKED">Bloqueados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Usuario</th>
                <th className="py-2">Papel</th>
                <th className="py-2">Status</th>
                <th className="py-2">Listas</th>
                <th className="py-2">Cadastro</th>
                <th className="py-2">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b align-top">
                  <td className="py-2">
                    <p className="font-medium">{user.name ?? 'Sem nome'}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </td>
                  <td className="py-2">{user.role}</td>
                  <td className="py-2">{user.isBlocked ? 'Bloqueado' : 'Ativo'}</td>
                  <td className="py-2">{user._count.giftLists}</td>
                  <td className="py-2">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-3 h-8 rounded-md border"
                        disabled={busyUserId === user.id}
                        onClick={() =>
                          updateUser(user.id, { role: user.role === 'ADMIN' ? 'CLIENT' : 'ADMIN' })
                        }
                      >
                        {user.role === 'ADMIN' ? 'Tornar Cliente' : 'Tornar Admin'}
                      </button>
                      <button
                        className="px-3 h-8 rounded-md border"
                        disabled={busyUserId === user.id}
                        onClick={() => updateUser(user.id, { isBlocked: !user.isBlocked })}
                      >
                        {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Gestao de Listas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <input
              className="border rounded-md h-10 px-3 text-sm"
              placeholder="Buscar por titulo, slug, nome ou email"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
            />
            <select
              className="border rounded-md h-10 px-3 text-sm"
              value={listPublishedFilter}
              onChange={(e) => setListPublishedFilter(e.target.value as any)}
            >
              <option value="ALL">Todas</option>
              <option value="PUBLISHED">Publicadas</option>
              <option value="DRAFT">Rascunho</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Lista</th>
                <th className="py-2">Dono</th>
                <th className="py-2">Status</th>
                <th className="py-2">Itens</th>
                <th className="py-2">Pedidos</th>
                <th className="py-2">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {giftLists.map((giftList) => (
                <tr key={giftList.id} className="border-b align-top">
                  <td className="py-2">
                    <p className="font-medium">{giftList.title}</p>
                    <p className="text-gray-500">/{giftList.slug}</p>
                  </td>
                  <td className="py-2">
                    <p>{giftList.user.name ?? 'Sem nome'}</p>
                    <p className="text-gray-500">{giftList.user.email}</p>
                  </td>
                  <td className="py-2">{giftList.isPublished ? 'Publicada' : 'Rascunho'}</td>
                  <td className="py-2">{giftList._count.gifts}</td>
                  <td className="py-2">{giftList._count.orders}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-3 h-8 rounded-md border"
                        disabled={busyListId === giftList.id}
                        onClick={() => updateGiftList(giftList.id, !giftList.isPublished)}
                      >
                        {giftList.isPublished ? 'Despublicar' : 'Publicar'}
                      </button>
                      <a
                        className="px-3 h-8 rounded-md border inline-flex items-center"
                        href={`/site/${giftList.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir pagina
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {giftLists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Nenhuma lista encontrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
