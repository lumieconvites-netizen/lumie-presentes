'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type MethodFilter = 'all' | 'card' | 'pix';

type OptionUser = {
  id: string;
  name: string | null;
  email: string;
};

type FinanceResponse = {
  options: {
    clients: OptionUser[];
    partners: OptionUser[];
    ambassadors: OptionUser[];
  };
  summary: {
    ordersCount: number;
    totalPaidAmount: number;
    totalClientReceived: number;
    totalPlatformReceived: number;
    totalLumieNetReceived: number;
    totalPagarmeReceived: number;
    totalPartnerReceived: number;
    totalAmbassadorReceived: number;
    cardAmount: number;
    cardCount: number;
    pixAmount: number;
    pixCount: number;
    pendingCardCount: number;
    pendingCardAmount: number;
  };
  breakdown: {
    clients: Array<{ id: string; name: string; email: string; amount: number; orders: number }>;
    partners: Array<{ id: string; name: string; email: string; amount: number; orders: number }>;
    ambassadors: Array<{ id: string; name: string; email: string; amount: number; orders: number }>;
  };
  orders: Array<{
    id: string;
    paymentMethod: 'card' | 'pix' | 'other';
    totalAmount: number;
    paidAt: string | null;
    createdAt: string;
    giftList: { id: string; title: string; slug: string };
    client: { id: string; name: string; email: string };
    partner: { id: string; name: string; email: string } | null;
    ambassador: { id: string; name: string; email: string } | null;
    split: {
      clientReceived: number;
      platformReceived: number;
      lumieNetReceived: number;
      pagarmeFee: number;
      partnerReceived: number;
      ambassadorReceived: number;
    };
  }>;
  pendingCards: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    giftList: { id: string; title: string; slug: string };
    client: { id: string; name: string; email: string };
  }>;
};

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateBr = (value?: string | null) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-');

export default function AdminFinanceiroPage() {
  const [method, setMethod] = useState<MethodFilter>('all');
  const [clientId, setClientId] = useState('all');
  const [partnerId, setPartnerId] = useState('all');
  const [ambassadorId, setAmbassadorId] = useState('all');
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('method', method);
    if (clientId !== 'all') params.set('clientId', clientId);
    if (partnerId !== 'all') params.set('partnerId', partnerId);
    if (ambassadorId !== 'all') params.set('ambassadorId', ambassadorId);
    return params.toString();
  }, [method, clientId, partnerId, ambassadorId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/financeiro?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar financeiro');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar financeiro');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => null);
  }, [query]);

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Metodo de pagamento</p>
              <Select value={method} onValueChange={(value: MethodFilter) => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="card">Somente cart?o</SelectItem>
                  <SelectItem value="pix">Somente PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Cliente</p>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {(data?.options.clients || []).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {(client.name || 'Sem nome') + ' - ' + client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Parceiro</p>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os parceiros</SelectItem>
                  {(data?.options.partners || []).map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {(partner.name || 'Sem nome') + ' - ' + partner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Embaixador</p>
              <Select value={ambassadorId} onValueChange={setAmbassadorId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os embaixadores</SelectItem>
                  {(data?.options.ambassadors || []).map((ambassador) => (
                    <SelectItem key={ambassador.id} value={ambassador.id}>
                      {(ambassador.name || 'Sem nome') + ' - ' + ambassador.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Button variant="outline" onClick={() => {
              setMethod('all');
              setClientId('all');
              setPartnerId('all');
              setAmbassadorId('all');
            }}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Total de presentes" value={brl(data?.summary.totalPaidAmount || 0)} />
        <StatCard label="Total recebido Pagar.me" value={brl(data?.summary.totalPagarmeReceived || 0)} />
        <StatCard label="Total recebido LUMIÊ (líquido)" value={brl(data?.summary.totalLumieNetReceived || 0)} />
        <StatCard label="Total recebido clientes" value={brl(data?.summary.totalClientReceived || 0)} />
        <StatCard label="Total recebido parceiros" value={brl(data?.summary.totalPartnerReceived || 0)} />
        <StatCard label="Total recebido embaixadores" value={brl(data?.summary.totalAmbassadorReceived || 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          label="Cartao"
          value={`${data?.summary.cardCount || 0} pedidos - ${brl(data?.summary.cardAmount || 0)}`}
        />
        <StatCard
          label="PIX"
          value={`${data?.summary.pixCount || 0} pedidos - ${brl(data?.summary.pixAmount || 0)}`}
        />
        <StatCard label="Pedidos pagos" value={String(data?.summary.ordersCount || 0)} />
        <StatCard
          label="Cartao pendente"
          value={`${data?.summary.pendingCardCount || 0} pedidos - ${brl(data?.summary.pendingCardAmount || 0)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Recebimento por parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-[#faf3ee]">
                  <tr>
                    <th className="text-left p-2">Parceiro</th>
                    <th className="text-left p-2">Pedidos</th>
                    <th className="text-left p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdown.partners || []).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </td>
                      <td className="p-2">{item.orders}</td>
                      <td className="p-2">{brl(item.amount)}</td>
                    </tr>
                  ))}
                  {(data?.breakdown.partners || []).length === 0 ? (
                    <tr>
                      <td className="p-3 text-gray-500 text-sm" colSpan={3}>
                        Sem recebimentos de parceiros no filtro atual.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e7d8cb]">
          <CardHeader>
            <CardTitle>Recebimento por embaixadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-[#faf3ee]">
                  <tr>
                    <th className="text-left p-2">Embaixador</th>
                    <th className="text-left p-2">Pedidos</th>
                    <th className="text-left p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.breakdown.ambassadors || []).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.email}</p>
                      </td>
                      <td className="p-2">{item.orders}</td>
                      <td className="p-2">{brl(item.amount)}</td>
                    </tr>
                  ))}
                  {(data?.breakdown.ambassadors || []).length === 0 ? (
                    <tr>
                      <td className="p-3 text-gray-500 text-sm" colSpan={3}>
                        Sem recebimentos de embaixadores no filtro atual.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Ultimos pagamentos (max 200)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Metodo</th>
                  <th className="p-2 text-left">Lista</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Pagar.me</th>
                  <th className="p-2 text-left">LUMIÊ (líquido)</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Parceiro</th>
                  <th className="p-2 text-left">Embaixador</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-2">{dateBr(order.paidAt || order.createdAt)}</td>
                    <td className="p-2 uppercase">{order.paymentMethod}</td>
                    <td className="p-2">
                      <p className="font-medium">{order.giftList.title}</p>
                      <p className="text-xs text-gray-500">/{order.giftList.slug}</p>
                    </td>
                    <td className="p-2">
                      <p>{order.client.name}</p>
                      <p className="text-xs text-gray-500">{order.client.email}</p>
                    </td>
                    <td className="p-2">{brl(order.totalAmount)}</td>
                    <td className="p-2">{brl(order.split.pagarmeFee)}</td>
                    <td className="p-2">{brl(order.split.lumieNetReceived)}</td>
                    <td className="p-2">{brl(order.split.clientReceived)}</td>
                    <td className="p-2">{brl(order.split.partnerReceived)}</td>
                    <td className="p-2">{brl(order.split.ambassadorReceived)}</td>
                  </tr>
                ))}
                {(data?.orders || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={10}>
                      Nenhum pagamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Cartoes de cr?dito pendentes</CardTitle>
          <p className="text-xs text-gray-500">
            Considera pedidos em status pendente/autorizado e cartoes pagos ainda em janela de liquidacao (at? 45 dias).
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Lista</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.pendingCards || []).map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-2">{dateBr(order.createdAt)}</td>
                    <td className="p-2">{order.status}</td>
                    <td className="p-2">
                      <p className="font-medium">{order.giftList.title}</p>
                      <p className="text-xs text-gray-500">/{order.giftList.slug}</p>
                    </td>
                    <td className="p-2">
                      <p>{order.client.name}</p>
                      <p className="text-xs text-gray-500">{order.client.email}</p>
                    </td>
                    <td className="p-2">{brl(order.totalAmount)}</td>
                  </tr>
                ))}
                {(data?.pendingCards || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={5}>
                      Nenhum cart?o pendente para os filtros selecionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-gray-500">Atualizando dados...</p> : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-[#e7d8cb]">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
