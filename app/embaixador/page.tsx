'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import AffiliateWithdrawCard from '@/components/affiliate/withdraw-card';

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
  clients: { id: string; name: string; email: string; sales: number; commission: number; orders: number }[];
  partners: { id: string; name: string; email: string; clients: number; sales: number; commission: number; orders: number }[];
};

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AmbassadorDashboardPage() {
  const [data, setData] = useState<AmbassadorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [openingClientId, setOpeningClientId] = useState<string | null>(null);

  const codeMeta = (type: string) => {
    if (type === 'PARTNER_CLIENT') {
      return {
        label: 'Código do parceiro para cliente',
        hint: 'Use quando um PARCEIRO trouxer um CLIENTE.',
      };
    }
    if (type === 'AMBASSADOR_CLIENT') {
      return {
        label: 'Seu código para cliente direto',
        hint: 'Use quando VOCÊ trouxer um CLIENTE direto.',
      };
    }
    if (type === 'AMBASSADOR_PARTNER') {
      return {
        label: 'Seu código para cadastrar parceiro',
        hint: 'Use para cadastrar PARCEIROS na sua rede.',
      };
    }

    return {
      label: type,
      hint: 'Use este código no cadastro.',
    };
  };

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? '' : prev));
      }, 1800);
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/affiliate/ambassador/overview', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel de embaixador');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel de embaixador');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const topPartners = useMemo(() => (data?.partners || []).slice(0, 20), [data?.partners]);
  const topClients = useMemo(() => data?.clients || [], [data?.clients]);
  const visibleCodes = useMemo(
    () => (data?.codes || []).filter((c) => c.type !== 'PARTNER_CLIENT'),
    [data?.codes]
  );

  async function openClientDashboard(clientId: string) {
    setOpeningClientId(clientId);
    try {
      const res = await fetch('/api/affiliate/impersonation', {
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

  if (loading) return <div className="p-4 md:p-6">Carregando painel de embaixador...</div>;
  if (!data) return <div className="p-4 md:p-6">Não foi possível carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <AffiliateWithdrawCard />

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Seus códigos de embaixador</CardTitle>
          <p className="text-sm text-gray-600">
            Aqui aparecem apenas os códigos que você usa: <b>cliente direto</b> e <b>cadastrar parceiro</b>.
          </p>
          <p className="text-sm text-gray-600">
            O código de <b>parceiro para cliente</b> fica no painel do próprio parceiro.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleCodes.map((code) => (
            <div key={code.id} className="rounded-lg border border-[#ead9cd] p-3 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{codeMeta(code.type).label}</p>
              <p className="font-semibold text-lg break-all">{code.code}</p>
              <p className="text-xs text-gray-500 mt-1">{codeMeta(code.type).hint}</p>
              <p className="text-sm text-gray-600">{code.usageCount} cadastros com este código</p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleCopyCode(code.code)}
                >
                  {copiedCode === code.code ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedCode === code.code ? 'Copiado' : 'Copiar código'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes indicados</p><p className="text-xl md:text-2xl font-bold">{data.kpis.clientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes com lista ativa</p><p className="text-xl md:text-2xl font-bold">{data.kpis.activeClientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Parceiros indicados</p><p className="text-xl md:text-2xl font-bold">{data.kpis.partnersCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Volume vendido</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.grossSales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissão recebida</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.totalCommissionPaid)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissão direta (clientes)</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.directClientCommission)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissão via parceiros</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.viaPartnerCommission)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pedidos pagos</p><p className="text-xl md:text-2xl font-bold">{data.kpis.totalOrdersPaid}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Cartões pendentes</p><p className="text-xl md:text-2xl font-bold">{data.kpis.pendingCardOrders} • {brl(data.kpis.pendingCardAmount)}</p></CardContent></Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Clientes da sua rede</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Pedidos</th>
                <th className="text-left p-2">Vendas</th>
                <th className="text-left p-2">Comissão embaixador</th>
                <th className="text-left p-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client) => (
                <tr key={client.id} className="border-t">
                  <td className="p-2"><p className="font-medium">{client.name}</p><p className="text-xs text-gray-500">{client.email}</p></td>
                  <td className="p-2">{client.orders}</td>
                  <td className="p-2">{brl(client.sales)}</td>
                  <td className="p-2">{brl(client.commission)}</td>
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
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Parceiros da sua rede</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="text-left p-2">Parceiro</th>
                <th className="text-left p-2">Clientes indicados</th>
                <th className="text-left p-2">Pedidos</th>
                <th className="text-left p-2">Vendas</th>
                <th className="text-left p-2">Comissão embaixador</th>
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
