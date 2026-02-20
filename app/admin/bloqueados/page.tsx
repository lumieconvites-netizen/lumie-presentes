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
    if (!res.ok) throw new Error(json?.error || 'Erro ao atualizar usuario');
    await loadUsers();
  }

  useEffect(() => {
    loadUsers().catch((error) => alert(error.message));
  }, [query]);

  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <CardTitle>Usuarios bloqueados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Buscar por nome ou email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="p-2 text-left">Usuario</th>
                <th className="p-2 text-left">Papel</th>
                <th className="p-2 text-left">Acoes</th>
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
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchUser(user.id, { isBlocked: false }).catch((error) => alert(error.message))}
                    >
                      Desbloquear
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="p-3 text-sm text-gray-500" colSpan={3}>
                    Nenhum usuario bloqueado.
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
