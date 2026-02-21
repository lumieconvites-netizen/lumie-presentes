'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AmbassadorOverview = {
  ambassador: { id: string; name: string; email: string };
  codes: { id: string; code: string; type: string; usageCount: number }[];
  kpis: {
    clientsCount: number;
    activeClientsCount: number;
    partnersCount: number;
    grossSales: number;
    totalCommissionPaid: number;
    directClientCommission: number;
    viaPartnerCommission: number;
    totalOrdersPaid: number;
    pendingCardOrders: number;
    pendingCardAmount: number;
  };
  partners: { id: string; name: string; email: string; clients: number; sales: number; commission: number; orders: number }[];
};

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AmbassadorDashboardPage() {
  const [data, setData] = useState<AmbassadorOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/affiliate/ambassador/overview', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel embaixador');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel embaixador');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const topPartners = useMemo(() => (data?.partners || []).slice(0, 20), [data?.partners]);

  if (loading) return <div>Carregando painel embaixador...</div>;
  if (!data) return <div>Nao foi possivel carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Seus codigos de embaixador</CardTitle>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes indicados</p><p className="text-2xl font-bold">{data.kpis.clientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes com lista ativa</p><p className="text-2xl font-bold">{data.kpis.activeClientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Parceiros indicados</p><p className="text-2xl font-bold">{data.kpis.partnersCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Volume vendido</p><p className="text-2xl font-bold">{brl(data.kpis.grossSales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissao recebida</p><p className="text-2xl font-bold">{brl(data.kpis.totalCommissionPaid)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissao direta (clientes)</p><p className="text-2xl font-bold">{brl(data.kpis.directClientCommission)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissao via parceiros</p><p className="text-2xl font-bold">{brl(data.kpis.viaPartnerCommission)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pedidos pagos</p><p className="text-2xl font-bold">{data.kpis.totalOrdersPaid}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Cartoes pendentes</p><p className="text-2xl font-bold">{data.kpis.pendingCardOrders} • {brl(data.kpis.pendingCardAmount)}</p></CardContent></Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Parceiros da sua rede</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="text-left p-2">Parceiro</th>
                <th className="text-left p-2">Clientes indicados</th>
                <th className="text-left p-2">Pedidos</th>
                <th className="text-left p-2">Vendas</th>
                <th className="text-left p-2">Comissao embaixador</th>
              </tr>
            </thead>
            <tbody>
              {topPartners.map((partner) => (
                <tr key={partner.id} className="border-t">
                  <td className="p-2"><p className="font-medium">{partner.name}</p><p className="text-xs text-gray-500">{partner.email}</p></td>
                  <td className="p-2">{partner.clients}</td>
                  <td className="p-2">{partner.orders}</td>
                  <td className="p-2">{brl(partner.sales)}</td>
                  <td className="p-2">{brl(partner.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

