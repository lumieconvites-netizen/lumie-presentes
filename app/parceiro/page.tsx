'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Copy } from 'lucide-react';
import AffiliateWithdrawCard from '@/components/affiliate/withdraw-card';

type PartnerOverview = {
  partner: { id: string; name: string; email: string; ambassador?: { name: string | null; email: string } | null };
  bankAccountConfigured: boolean;
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
type PeriodFilter = 'total' | 'current_month' | 'last_month';

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PartnerDashboardPage() {
  const [period, setPeriod] = useState<PeriodFilter>('total');
  const [data, setData] = useState<PartnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingClientId, setOpeningClientId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string>('');

  function getSignupLink(code: string) {
    const params = new URLSearchParams({ code });
    return `/auth/cadastro?${params.toString()}`;
  }

  async function handleCopy(value: string, copyKey: string, options?: { absolute?: boolean }) {
    try {
      const textToCopy = options?.absolute ? `${window.location.origin}${value}` : value;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedValue(copyKey);
      window.setTimeout(() => {
        setCopiedValue((prev) => (prev === copyKey ? '' : prev));
      }, 1800);
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  }

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/affiliate/partner/overview?period=${period}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar painel de parceiro');
        if (!cancel) setData(json);
      } catch (error: any) {
        if (!cancel) alert(error?.message || 'Erro ao carregar painel de parceiro');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [period]);

  const topClients = useMemo(() => data?.clients || [], [data?.clients]);

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

  if (loading) return <div className="p-4 md:p-6">Carregando painel de parceiro...</div>;
  if (!data) return <div className="p-4 md:p-6">Não foi possível carregar os dados.</div>;

  return (
    <div className="space-y-6">
      <AffiliateWithdrawCard />

      <Card className="border-[#ead9cd]">
        <CardContent className="p-4">
          <div className="w-full md:w-56">
            <p className="text-xs text-gray-500 mb-1">Período</p>
            <Select value={period} onValueChange={(value: PeriodFilter) => setPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês atual</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Seus códigos de parceiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">Compartilhe esse código com os seus clientes.</p>

          {data.bankAccountConfigured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.codes.map((code) => (
                <div key={code.id} className="rounded-lg border border-[#ead9cd] p-3 bg-white">
                  <p className="text-xs text-gray-500">{code.type}</p>
                  <p className="font-semibold text-lg">{code.code}</p>
                  <p className="text-sm text-gray-600">{code.usageCount} cadastros com este código</p>
                  <div className="mt-3 rounded-md bg-[#faf3ee] p-2">
                    <p className="text-xs text-gray-500">Link de cadastro com código aplicado</p>
                    <Link
                      href={getSignupLink(code.code)}
                      className="mt-1 block break-all text-xs font-medium text-[#8e3d2c] hover:underline"
                    >
                      {getSignupLink(code.code)}
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleCopy(code.code, `code:${code.id}`)}
                    >
                      {copiedValue === `code:${code.id}` ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copiedValue === `code:${code.id}` ? 'Copiado' : 'Copiar código'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleCopy(getSignupLink(code.code), `link:${code.id}`, { absolute: true })}
                    >
                      {copiedValue === `link:${code.id}` ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copiedValue === `link:${code.id}` ? 'Link copiado' : 'Copiar link'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Cadastre sua conta bancária para liberar seus códigos.</p>
              <p className="text-sm text-amber-800 mt-1">Depois do cadastro, seus códigos de parceiro aparecem automaticamente.</p>
              <div className="mt-3">
                <Button asChild className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white">
                  <a href="/parceiro/configuracoes">Cadastrar conta bancária</a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes indicados</p><p className="text-xl md:text-2xl font-bold">{data.kpis.clientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Clientes com lista ativa</p><p className="text-xl md:text-2xl font-bold">{data.kpis.activeClientsCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Volume vendido</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.grossSales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Comissão recebida</p><p className="text-xl md:text-2xl font-bold">{brl(data.kpis.totalCommissionPaid)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pedidos pagos</p><p className="text-xl md:text-2xl font-bold">{data.kpis.totalOrdersPaid}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Cartões pendentes</p><p className="text-xl md:text-2xl font-bold">{data.kpis.pendingCardOrders} • {brl(data.kpis.pendingCardAmount)}</p></CardContent></Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle>Clientes que mais geraram comissão</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-[#faf3ee]">
              <tr>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Pedidos</th>
                <th className="text-left p-2">Vendas</th>
                <th className="text-left p-2">Comissão</th>
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
    </div>
  );
}
