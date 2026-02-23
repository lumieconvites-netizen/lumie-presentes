'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AffiliateWithdrawCard from '@/components/affiliate/withdraw-card';

type PartnerOverview = {
  partner: { id: string; name: string; email: string; ambassador?: { name: string | null; email: string } | null };
  codes: { id: string; code: string; type: string; usageCount: number }[];
  kpis: {
    clientsCount: number;
    activeClientsCount: number;
    grossSales: number;
    totalCommissionPaid: number;
    totalOrdersPaid: number;
    pendingCardOrders: number;
    pendingCardAmount: number;
  };
  clients: { id: string; name: string; email: string; sales: number; commission: number; orders: number }[];
};

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PartnerDashboardPage() {
  const [data, setData] = useState<PartnerOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/affiliate/partner/overview', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel parceiro');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel parceiro');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const topClients = useMemo(() => (data?.clients || []).slice(0, 12), [data?.clients]);

  if (loading) return <div className="p-4 md:p-6">Carregando painel parceiro...</div>;
  if (!data) return <div className="p-4 md:p-6">Nao foi possivel carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <AffiliateWithdrawCard />

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Seus codigos de parceiro</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.codes.map((code) => (
            <div key={code.id} className="rounded-lg border border-[#ead9cd] p-3 bg-white">
              <p className="text-xs text-gray-500">{code.type}</p>
              <p className="font-semibold text-lg">{code.code}</p>
              <p className="text-sm text-gray-600">{code.usageCount} cadastros com este codigo</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes indicados</p><p className="text-xl md:text-2xl font-bold">{data.kpis.clientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes com lista ativa</p><p className="text-xl md:text-2xl font-bold">{data.kpis.activeClientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Volume vendido</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.grossSales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissao recebida</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.totalCommissionPaid)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pedidos pagos</p><p className="text-xl md:text-2xl font-bold">{data.kpis.totalOrdersPaid}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Cartoes pendentes</p><p className="text-xl md:text-2xl font-bold">{data.kpis.pendingCardOrders} • {brl(data.kpis.pendingCardAmount)}</p></CardContent></Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Clientes que mais geraram comissao</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Pedidos</th>
                <th className="text-left p-2">Vendas</th>
                <th className="text-left p-2">Comissao</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client) => (
                <tr key={client.id} className="border-t">
                  <td className="p-2"><p className="font-medium">{client.name}</p><p className="text-xs text-gray-500">{client.email}</p></td>
                  <td className="p-2">{client.orders}</td>
                  <td className="p-2">{brl(client.sales)}</td>
                  <td className="p-2">{brl(client.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

