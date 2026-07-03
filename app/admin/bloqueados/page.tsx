'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
  isBlocked: boolean;
  blockReason?: string | null;
  blockedAt: string | null;
};

export default function AdminBloqueadosPage() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('blocked', 'true');
    if (q.trim()) p.set('q', q.trim());
    return p.toString();
  }, [q]);

  async function loadUsers() {
    const res = await fetch(`/api/admin/users?${query}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao carregar bloqueados');
    setUsers(json.users || []);
  }

  async function patchUser(id: string, payload: any) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Erro ao atualizar usuário');
    await loadUsers();
  }

  async function editBlockReason(user: AdminUser) {
    const reason = window.prompt('Editar motivo do bloqueio:', user.blockReason || '');
    if (reason === null) return;
    const normalized = reason.trim();
    if (!normalized) {
      alert('Motivo não pode ficar vazio.');
      return;
    }
    await patchUser(user.id, { isBlocked: true, blockReason: normalized });
  }

  useEffect(() => {
    loadUsers().catch((error) => alert(error.message));
  }, [query]);

  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <CardTitle>Usuários bloqueados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Buscar por nome ou email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-[520px] overflow-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#faf3ee]">
              <tr>
                <th className="p-2 text-left">Usuário</th>
                <th className="p-2 text-left">Papel</th>
                <th className="p-2 text-left">Motivo</th>
                <th className="p-2 text-left">Bloqueado em</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-2">
                    <p className="font-medium">{user.name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.blockReason?.trim() || 'Sem motivo informado'}</td>
                  <td className="p-2">{user.blockedAt ? new Date(user.blockedAt).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editBlockReason(user).catch((error) => alert(error.message))}
                      >
                        Editar motivo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchUser(user.id, { isBlocked: false, blockReason: null }).catch((error) => alert(error.message))}
                      >
                        Desbloquear
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="p-3 text-sm text-gray-500" colSpan={5}>
                    Nenhum usuário bloqueado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
