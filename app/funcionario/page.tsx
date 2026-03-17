'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortMode = 'recent' | 'alpha';

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
    createdAt: string;
    referredByPartner?: { id: string; name: string | null; email: string } | null;
    referredByAmbassador?: { id: string; name: string | null; email: string } | null;
  }>;
  total: number;
  take: number;
  skip: number;
  hasMore: boolean;
};

const PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export default function EmployeeDashboardPage() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [data, setData] = useState<EmployeeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingClientId, setOpeningClientId] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  const qs = useMemo(() => {
    const params = new URLSearchParams({
      sort,
      take: String(visibleCount),
    });
    if (debouncedQuery) params.set('q', debouncedQuery);
    return params.toString();
  }, [debouncedQuery, sort, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, sort]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/employee/overview?${qs}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel de funcionário');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel de funcionário');
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
      if (!res.ok) throw new Error(json?.error || 'Não foi possível abrir o painel do cliente');
      window.location.assign('/dashboard/presentes');
    } catch (error: any) {
      alert(error?.message || 'Não foi possível abrir o painel do cliente');
    } finally {
      setOpeningClientId(null);
    }
  }

  if (loading) return <div className="p-4 md:p-6">Carregando painel de funcionário...</div>;
  if (!data) return <div className="p-4 md:p-6">Não foi possível carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Clientes</p>
            <p className="text-2xl font-bold">{data.kpis.clientsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Com lista</p>
            <p className="text-2xl font-bold">{data.kpis.clientsWithGiftList}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Listas publicadas</p>
            <p className="text-2xl font-bold">{data.kpis.publishedLists}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Clientes</CardTitle>
            <Badge variant="outline">{data.total} resultados</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="Buscar cliente por nome ou e-mail"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="md:flex-1"
            />
            <div className="w-full md:w-[240px]">
              <Select value={sort} onValueChange={(value: SortMode) => setSort(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="alpha">Ordem alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Origem</th>
                  <th className="p-2 text-left">Lista</th>
                  <th className="p-2 text-left">Publicação</th>
                  <th className="p-2 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((client) => (
                  <tr key={client.id} className="border-t">
                    <td className="p-2">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </td>
                    <td className="p-2">
                      <OriginDisplay client={client} />
                    </td>
                    <td className="p-2">{client.hasGiftList ? 'Com lista' : 'Sem lista'}</td>
                    <td className="p-2">{client.published ? 'Publicada' : 'Não publicada'}</td>
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
                    <td className="p-3 text-sm text-gray-500" colSpan={5}>
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Mostrando {data.clients.length} de {data.total}</p>
            {data.hasMore ? (
              <Button variant="outline" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                Ver mais
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OriginDisplay({
  client,
}: {
  client: EmployeeOverview['clients'][number];
}) {
  const partner = client.referredByPartner?.name || client.referredByPartner?.email || null;
  const ambassador = client.referredByAmbassador?.name || client.referredByAmbassador?.email || null;

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
    </div>
  );
}
