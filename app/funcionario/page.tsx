'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type EmployeeOverview = {
  employee: { id: string; name: string; email: string };
  kpis: {
    clientsCount: number;
    clientsWithGiftList: number;
    publishedLists: number;
  };
  clients: Array<{
    id: string;
    name: string;
    email: string;
    hasGiftList: boolean;
    published: boolean;
  }>;
};

export default function EmployeeDashboardPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<EmployeeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingClientId, setOpeningClientId] = useState<string | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    return params.toString();
  }, [query]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/employee/overview?${qs}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel de funcionario');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel de funcionario');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [qs]);

  async function openClientDashboard(clientId: string) {
    setOpeningClientId(clientId);
    try {
      const res = await fetch('/api/employee/impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clientId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Nao foi possivel abrir o painel do cliente');
      window.location.assign('/dashboard/presentes');
    } catch (error: any) {
      alert(error?.message || 'Nao foi possivel abrir o painel do cliente');
    } finally {
      setOpeningClientId(null);
    }
  }

  if (loading) return <div className="p-4 md:p-6">Carregando painel de funcionario...</div>;
  if (!data) return <div className="p-4 md:p-6">Nao foi possivel carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes</p><p className="text-2xl font-bold">{data.kpis.clientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Com lista</p><p className="text-2xl font-bold">{data.kpis.clientsWithGiftList}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Listas publicadas</p><p className="text-2xl font-bold">{data.kpis.publishedLists}</p></CardContent></Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Buscar cliente por nome ou email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Lista</th>
                  <th className="text-left p-2">Publicacao</th>
                  <th className="text-left p-2">Acao</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((client) => (
                  <tr key={client.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </td>
                    <td className="p-2">{client.hasGiftList ? 'Com lista' : 'Sem lista'}</td>
                    <td className="p-2">{client.published ? 'Publicada' : 'Nao publicada'}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={openingClientId === client.id}
                        onClick={() => openClientDashboard(client.id)}
                      >
                        {openingClientId === client.id ? 'Abrindo...' : 'Acessar painel'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.clients.length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={4}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
