'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, Shield, Users } from 'lucide-react';

type Overview = {
  usersCount: number; adminsCount: number; clientsCount: number; partnersCount: number; ambassadorsCount: number;
  publishedListsCount: number; activeTemplatesCount: number; paidTotal: number;
};
type AdminUser = { id: string; name: string | null; email: string; role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR'; isBlocked: boolean; _count: { giftLists: number } };
type AdminGiftList = { id: string; title: string; slug: string; isPublished: boolean; user: { email: string; name: string | null }; _count: { gifts: number; orders: number; messages: number } };
type AdminTemplate = { id: string; name: string; slug: string; category: string; isActive: boolean };

const slugify = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [lists, setLists] = useState<AdminGiftList[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [qUser, setQUser] = useState('');
  const [qList, setQList] = useState('');
  const [newTemplate, setNewTemplate] = useState({ name: '', slug: '', category: 'casamento' });

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
    const [o, u, l, t] = await Promise.all([
      fetch('/api/admin/overview', { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/admin/users?${userQuery}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/admin/gift-lists?${listQuery}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/templates', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    setOverview(o);
    setUsers(u.users || []);
    setLists(l.giftLists || []);
    setTemplates(t.templates || []);
  }

  useEffect(() => { loadAll().catch(() => null); }, []);
  useEffect(() => { loadAll().catch(() => null); }, [userQuery, listQuery]);

  async function patchUser(id: string, payload: any) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao atualizar usuario'); await loadAll();
  }
  async function patchList(id: string, payload: any) {
    const res = await fetch(`/api/admin/gift-lists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao atualizar lista'); await loadAll();
  }
  async function createTemplate() {
    const slug = slugify(newTemplate.slug || newTemplate.name);
    const res = await fetch('/api/admin/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTemplate.name, slug, category: newTemplate.category, description: null, thumbnail: null,
        defaultTheme: { primary_color: '#C65A3A', secondary_color: '#8E3D2C', background_color: '#FAF4EF', font_title: 'Playfair Display', font_body: 'Inter' },
        defaultBlocks: [{ id: 'hero-1', type: 'hero', order: 1, enabled: true, config: { title: newTemplate.name || 'Novo template', subtitle: 'Seu evento especial', backgroundColor: '#8E3D2C' } }],
      }),
    });
    const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'Erro ao criar template');
    setNewTemplate({ name: '', slug: '', category: 'casamento' }); await loadAll();
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

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9]">
        <CardHeader><CardTitle className="text-3xl font-display">Admin LUMIE</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 text-sm">
          <Stat icon={<Users className="w-4 h-4" />} label="Usuarios" value={overview?.usersCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Admins" value={overview?.adminsCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Clientes" value={overview?.clientsCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Parceiros" value={overview?.partnersCount || 0} />
          <Stat icon={<Shield className="w-4 h-4" />} label="Embaixadores" value={overview?.ambassadorsCount || 0} />
          <Stat icon={<Users className="w-4 h-4" />} label="Listas pub." value={overview?.publishedListsCount || 0} />
          <Stat icon={<LayoutTemplate className="w-4 h-4" />} label="Templates ativos" value={overview?.activeTemplatesCount || 0} />
          <div className="rounded-xl border p-3 bg-white"><p className="text-xs text-gray-500">Arrecadado</p><p className="text-base font-semibold">{brl(overview?.paidTotal || 0)}</p></div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader><CardTitle>Usuarios (clientes, parceiros e embaixadores)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Buscar usuario por nome/email" value={qUser} onChange={(e) => setQUser(e.target.value)} />
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm"><thead className="bg-[#faf3ee]"><tr><th className="p-2 text-left">Usuario</th><th className="p-2 text-left">Papel</th><th className="p-2 text-left">Acoes</th></tr></thead><tbody>
              {users.map((u) => <tr key={u.id} className="border-t"><td className="p-2"><p className="font-medium">{u.name || 'Sem nome'}</p><p className="text-xs text-gray-500">{u.email}</p></td><td className="p-2"><Badge variant="outline">{u.role}</Badge></td><td className="p-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'PARTNER' }).catch((e) => alert(e.message))}>Virar parceiro</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'AMBASSADOR' }).catch((e) => alert(e.message))}>Virar embaixador</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { role: 'CLIENT' }).catch((e) => alert(e.message))}>Virar cliente</Button><Button size="sm" variant="outline" onClick={() => patchUser(u.id, { isBlocked: !u.isBlocked }).catch((e) => alert(e.message))}>{u.isBlocked ? 'Desbloquear' : 'Bloquear'}</Button><Button size="sm" variant="outline" onClick={() => setQList(u.email)}>Ver listas</Button></div></td></tr>)}
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
              {lists.map((l) => <tr key={l.id} className="border-t"><td className="p-2"><p className="font-medium">{l.title}</p><p className="text-xs text-gray-500">/{l.slug} • {l._count.gifts} presentes</p></td><td className="p-2"><p>{l.user.name || 'Sem nome'}</p><p className="text-xs text-gray-500">{l.user.email}</p></td><td className="p-2"><div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => patchList(l.id, { isPublished: !l.isPublished }).catch((e) => alert(e.message))}>{l.isPublished ? 'Despublicar' : 'Publicar'}</Button><Button size="sm" variant="outline" onClick={() => { const t = window.prompt('Novo titulo', l.title); if (t && t.trim()) patchList(l.id, { title: t.trim() }).catch((e) => alert(e.message)); }}>Editar titulo</Button><Button size="sm" variant="outline" onClick={() => { const s = window.prompt('Novo slug', l.slug); if (s && s.trim()) patchList(l.id, { slug: slugify(s) }).catch((e) => alert(e.message)); }}>Editar slug</Button><a href={`/site/${l.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Abrir</Button></a></div></td></tr>)}
            </tbody></table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader><CardTitle>Templates (publicacao imediata)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Nome do template" value={newTemplate.name} onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Slug" value={newTemplate.slug} onChange={(e) => setNewTemplate((p) => ({ ...p, slug: e.target.value }))} />
            <Input placeholder="Categoria" value={newTemplate.category} onChange={(e) => setNewTemplate((p) => ({ ...p, category: e.target.value }))} />
            <Button onClick={() => createTemplate().catch((e) => alert(e.message))}>Criar e publicar</Button>
          </div>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm"><thead className="bg-[#faf3ee]"><tr><th className="p-2 text-left">Template</th><th className="p-2 text-left">Categoria</th><th className="p-2 text-left">Acoes</th></tr></thead><tbody>
              {templates.map((t) => <tr key={t.id} className="border-t"><td className="p-2"><p className="font-medium">{t.name}</p><p className="text-xs text-gray-500">/{t.slug}</p></td><td className="p-2">{t.category}</td><td className="p-2"><div className="flex gap-1"><Button size="sm" variant="outline" disabled={busyTemplateId === t.id} onClick={() => patchTemplate(t.id, { isActive: !t.isActive }).catch((e) => alert(e.message))}>{t.isActive ? 'Despublicar' : 'Publicar'}</Button><Button size="sm" variant="outline" disabled={busyTemplateId === t.id} onClick={() => { if (confirm('Excluir template?')) removeTemplate(t.id).catch((e) => alert(e.message)); }}>Excluir</Button></div></td></tr>)}
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
