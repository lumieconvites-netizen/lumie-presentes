'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, Shield, Users } from 'lucide-react';

type Overview = {
  usersCount: number; adminsCount: number; clientsCount: number; partnersCount: number; ambassadorsCount: number; employeesCount: number;
  publishedListsCount: number; activeTemplatesCount: number; paidTotal: number;
};
type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
  isBlocked: boolean;
  blockReason?: string | null;
  blockedAt?: string | null;
  _count: { giftLists: number };
};
type AdminGiftList = { id: string; title: string; slug: string; isPublished: boolean; user: { email: string; name: string | null }; _count: { gifts: number; orders: number; messages: number } };
type AdminTemplate = { id: string; name: string; slug: string; category: string; isActive: boolean };
type ImpersonationState = {
  isImpersonating: boolean;
  effectiveUser?: { id: string; name: string | null; email: string; role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE' };
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [lists, setLists] = useState<AdminGiftList[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [qUser, setQUser] = useState('');
  const [qList, setQList] = useState('');

  const userQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (qUser.trim()) p.set('q', qUser.trim());
    return p.toString();
  }, [qUser]);
  const listQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (qList.trim()) p.set('q', qList.trim());
    return p.toString();
  }, [qList]);

  async function loadAll() {
    const getJson = async (url: string) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        return await res.json();
      } catch {
        return null;
      }
    };

    const [o, u, l, t, i] = await Promise.all([
      getJson('/api/admin/overview'),
      getJson(`/api/admin/users?${userQuery}`),
      getJson(`/api/admin/gift-lists?${listQuery}`),
      getJson('/api/admin/templates'),
      getJson('/api/admin/impersonation'),
    ]);

    if (o && !o.error) setOverview(o);
    if (u && Array.isArray(u.users)) setUsers(u.users);
    if (l && Array.isArray(l.giftLists)) setLists(l.giftLists);
    if (t && Array.isArray(t.templates)) setTemplates(t.templates);
    if (i) setImpersonation(i);
  }

  useEffect(() => { loadAll().catch(() => null); }, []);
  useEffect(() => { loadAll().catch(() => null); }, [userQuery, listQuery]);

  async function patchList(id: string, payload: any) {
    const res = await fetch(`/api/admin/gift-lists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao atualizar lista'); await loadAll();
  }
  async function patchUser(id: string, payload: any) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao atualizar usuario'); await loadAll();
  }
  async function toggleBlockUser(user: AdminUser) {
    if (user.isBlocked) {
      await patchUser(user.id, { isBlocked: false, blockReason: null });
      return;
    }

    const reason = window.prompt('Motivo do bloqueio (obrigatorio):', user.blockReason || '');
    if (reason === null) return;
    const normalized = reason.trim();
    if (!normalized) {
      alert('Informe o motivo para bloquear o usuario.');
      return;
    }
    await patchUser(user.id, { isBlocked: true, blockReason: normalized });
  }
  async function removeList(id: string) {
    if (!window.confirm('Excluir essa lista zerada?')) return;
    const res = await fetch(`/api/admin/gift-lists/${id}`, { method: 'DELETE' });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Erro ao excluir lista');
    await loadAll();
  }
  async function patchTemplate(id: string, payload: any) {
    setBusyTemplateId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao atualizar template'); await loadAll();
    } finally {
      setBusyTemplateId(null);
    }
  }
  async function removeTemplate(id: string) {
    setBusyTemplateId(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao excluir template'); await loadAll();
    } finally {
      setBusyTemplateId(null);
    }
  }

  async function startImpersonation(userId: string) {
    const res = await fetch('/api/admin/impersonation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Erro ao acessar painel do usuario');
    window.location.assign('/dashboard');
  }

  async function stopImpersonation() {
    const res = await fetch('/api/admin/impersonation', { method: 'DELETE' });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Erro ao sair do modo de acesso');
    await loadAll();
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb] bg-gradient-to-r from-[#fff3eb] via-[#fffaf6] to-[#fffdf9]">
        <CardHeader>
          <CardTitle className="text-3xl font-display">Admin LUMIE</CardTitle>
          <p className="text-sm text-[#8E3D2C]/80">Visao geral da operacao da plataforma.</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-9 gap-3 text-sm">
          <Stat icon={<Users className="w-4 h-4" />} label="Usuarios" value={overview?.usersCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Admins" value={overview?.adminsCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Clientes" value={overview?.clientsCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Parceiros" value={overview?.partnersCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Embaixadores" value={overview?.ambassadorsCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Funcionarios" value={overview?.employeesCount || 0} />
          <Stat icon={<Users className="w-4 h-4" />} label="Listas pub." value={overview?.publishedListsCount || 0} />
          <Stat icon={<LayoutTemplate className="w-4 h-4" />} label="Templates ativos" value={overview?.activeTemplatesCount || 0} />
          <div className="rounded-xl border p-3 bg-white"><p className="text-xs text-gray-500">Arrecadado</p><p className="text-base font-semibold">{brl(overview?.paidTotal || 0)}</p></div>
        </CardContent>
      </Card>

      {impersonation?.isImpersonating && impersonation.effectiveUser ? (
        <Card className="border-[#e7d8cb] bg-[#fff7f1]">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#8E3D2C]">
              Modo acesso ativo: {impersonation.effectiveUser.name || 'Sem nome'} ({impersonation.effectiveUser.email}) - {impersonation.effectiveUser.role}
            </p>
            <Button variant="outline" onClick={() => stopImpersonation().catch((e) => alert(e.message))}>Sair do modo acesso</Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-[#e7d8cb]">
        <CardHeader><CardTitle>Usuarios (clientes, parceiros e embaixadores)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Buscar usuario por nome/email" value={qUser} onChange={(e) => setQUser(e.target.value)} />
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm"><thead className="bg-[#faf3ee]"><tr><th className="p-2 text-left">Usuario</th><th className="p-2 text-left">Papel</th><th className="p-2 text-left">Acoes</th></tr></thead><tbody>
              {users.map((u) => <tr key={u.id} className="border-t"><td className="p-2"><p className="font-medium">{u.name || 'Sem nome'}</p><p className="text-xs text-gray-500">{u.email}</p>{u.isBlocked && u.blockReason ? <p className="text-xs text-red-600 mt-1">Motivo: {u.blockReason}</p> : null}</td><td className="p-2"><Badge variant="outline">{u.role}</Badge></td><td className="p-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'PARTNER' }).catch((e) => alert(e.message))}>Virar parceiro</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'AMBASSADOR' }).catch((e) => alert(e.message))}>Virar embaixador</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'EMPLOYEE' }).catch((e) => alert(e.message))}>Virar funcionario</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'CLIENT' }).catch((e) => alert(e.message))}>Virar cliente</Button><Button size="sm" variant="outline" onClick={() => toggleBlockUser(u).catch((e) => alert(e.message))}>{u.isBlocked ? 'Desbloquear' : 'Bloquear'}</Button>{u.role !== 'ADMIN' ? <Button size="sm" onClick={() => startImpersonation(u.id).catch((e) => alert(e.message))}>Acessar painel</Button> : <span className="text-xs text-gray-500">Admin</span>}</div></td></tr>)}
            </tbody></table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader><CardTitle>Listas (edicao admin)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Buscar lista por titulo/slug/email" value={qList} onChange={(e) => setQList(e.target.value)} />
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm"><thead className="bg-[#faf3ee]"><tr><th className="p-2 text-left">Lista</th><th className="p-2 text-left">Dono</th><th className="p-2 text-left">Acoes</th></tr></thead><tbody>
              {lists.map((l) => <tr key={l.id} className="border-t"><td className="p-2"><p className="font-medium">{l.title}</p><p className="text-xs text-gray-500">/{l.slug} • {l._count.gifts} presentes</p></td><td className="p-2"><p>{l.user.name || 'Sem nome'}</p><p className="text-xs text-gray-500">{l.user.email}</p></td><td className="p-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => patchList(l.id, { isPublished: !l.isPublished }).catch((e) => alert(e.message))}>{l.isPublished ? 'Despublicar' : 'Publicar'}</Button><a href={`/site/${l.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Abrir</Button></a>{l._count.gifts === 0 && l._count.orders === 0 && l._count.messages === 0 ? <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => removeList(l.id).catch((e) => alert(e.message))}>Excluir</Button> : null}</div></td></tr>)}
            </tbody></table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader><CardTitle>Templates (publicacao imediata)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm"><thead className="bg-[#faf3ee]"><tr><th className="p-2 text-left">Template</th><th className="p-2 text-left">Categoria</th><th className="p-2 text-left">Acoes</th></tr></thead><tbody>
              {templates.map((t) => <tr key={t.id} className="border-t"><td className="p-2"><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">/{t.slug}</p></td><td className="p-2">{t.category}</td><td className="p-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={busyTemplateId === t.id} onClick={() => patchTemplate(t.id, { isActive: !t.isActive }).catch((e) => alert(e.message))}>{t.isActive ? 'Despublicar' : 'Publicar'}</Button><Button size="sm" variant="outline" asChild><Link href={`/admin/templates/editor/${t.id}`}>Editar</Link></Button><Button size="sm" variant="outline" asChild><Link href={`/templates/${encodeURIComponent(t.slug)}`} target="_blank" rel="noreferrer">Visualizar</Link></Button><Button size="sm" variant="outline" disabled={busyTemplateId === t.id} onClick={() => { if (confirm('Excluir template?')) removeTemplate(t.id).catch((e) => alert(e.message)); }}>Excluir</Button></div></td></tr>)}
            </tbody></table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border p-3 bg-white"><div className="flex items-center justify-between text-xs text-gray-500"><span>{label}</span><span>{icon}</span></div><p className="text-2xl font-semibold mt-1">{value}</p></div>;
}
