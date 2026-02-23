'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Copy,
  DollarSign,
  Gift,
  Calendar,
  ExternalLink,
  Clock3,
  Wallet,
  Settings,
  Landmark,
  Info,
} from 'lucide-react';
import Link from 'next/link';

type DashboardSummary = {
  totalGifts: number;
  activeGifts: number;
  pendingOrdersCount: number;
  recentPayments: Array<{
    id: string;
    guestName: string;
    totalAmount: number | string;
    feeAmount: number | string;
    createdAt: string;
    giftItem?: { name?: string } | null;
  }>;
  recentMessages: Array<{
    id: string;
    guestName: string;
    content: string;
    createdAt: string;
    order?: {
      giftItem?: { name?: string } | null;
    } | null;
  }>;
};

type DashboardData = {
  slug: string;
  isPublished: boolean;
  title: string;
  description: string | null;
  summary: DashboardSummary;
};

type FinancialSummary = {
  available: number;
  waitingFunds: number;
  pendingTransferAmount: number;
  pendingTransferCount: number;
  completedTransferAmount: number;
  nonFailedTransferAmount: number;
  nonFailedTransferCount: number;
  latestPendingTransfer: {
    id: string | null;
    status: string | null;
    amount: number;
    createdAt: string | null;
  } | null;
};

function toNumber(v: number | string) {
  return typeof v === 'number' ? v : Number(v ?? 0);
}

const WITHDRAW_FEE_CENTS = 367;
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [copying, setCopying] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const listRes = await fetch('/api/gift-lists/my-list/full?view=dashboard', { cache: 'no-store' });
        const listJson = await listRes.json();
        if (!listRes.ok) throw new Error(listJson?.error ?? 'Falha ao carregar dashboard');
        if (!cancelled) setData(listJson);
      } catch (error: any) {
        if (!cancelled) alert(error?.message ?? 'Erro ao carregar dashboard');
      }
    })();

    (async () => {
      try {
        const financialRes = await fetch('/api/recipient/financial-summary', { cache: 'no-store' });
        const financialJson = await financialRes.json().catch(() => null);
        if (!financialRes.ok) return;
        if (!cancelled) setFinancial(financialJson?.summary ?? null);
      } catch {
        // Nao bloqueia o carregamento principal do dashboard.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;
  const totalGifts = Number(summary?.totalGifts ?? 0);
  const activeGifts = Number(summary?.activeGifts ?? 0);
  const pendingOrdersCount = Number(summary?.pendingOrdersCount ?? 0);
  const recentPayments = summary?.recentPayments ?? [];
  const recentMessages = summary?.recentMessages ?? [];
  const availableNow = Math.max(0, Number(financial?.available ?? 0)) / 100;
  const waitingFunds = Math.max(0, Number(financial?.waitingFunds ?? 0)) / 100;
  const pendingTransferAmount = Math.max(0, Number(financial?.pendingTransferAmount ?? 0)) / 100;
  const pendingTransferCount = Math.max(0, Number(financial?.pendingTransferCount ?? 0));
  const nonFailedTransferAmount = Math.max(0, Number(financial?.nonFailedTransferAmount ?? 0)) / 100;
  const nonFailedTransferCount = Math.max(0, Number(financial?.nonFailedTransferCount ?? 0));
  const withdrawFee = WITHDRAW_FEE_CENTS / 100;
  const collectedTotal = availableNow + nonFailedTransferAmount + nonFailedTransferCount * withdrawFee;

  const publicLink = data?.slug ? `/site/${data.slug}` : '/site';
  const statusLabel = useMemo(() => (data?.isPublished ? 'Publicada' : 'Rascunho'), [data?.isPublished]);

  const copyPublicLink = async () => {
    if (!data?.slug || copying) return;

    try {
      setCopying(true);
      const url = `${window.location.origin}/site/${data.slug}`;
      await navigator.clipboard.writeText(url);
      alert('Link copiado com sucesso.');
    } catch {
      alert('Não foi possível copiar o link agora.');
    } finally {
      setCopying(false);
    }
  };

  const requestWithdraw = async () => {
    if (withdrawing) return;

    try {
      setWithdrawing(true);
      const res = await fetch('/api/recipient/withdraw', {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Não foi possível solicitar o saque.');
      alert(json?.message ?? 'Saque solicitado com sucesso.');
      setWithdrawOpen(false);
      const summaryRes = await fetch('/api/recipient/financial-summary', { cache: 'no-store' });
      const summaryJson = await summaryRes.json();
      if (summaryRes.ok) setFinancial(summaryJson?.summary ?? null);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao solicitar saque.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#fbf8f5]">
      <div className="rounded-2xl border border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-foreground mb-1">Dashboard</h1>
            <p className="text-gray-600">Visão geral da sua lista de presentes</p>
            <p className="text-sm text-gray-500 mt-1">
              {data?.title || 'Sua Lista'}
              {data?.description ? ` - ${data.description}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white w-full sm:w-auto"
              onClick={() => setWithdrawOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Efetuar Saque
            </Button>

            <Button
              variant="outline"
              className="border-[#e0c6b4] bg-white hover:bg-[#fff6ef] w-full sm:w-auto"
              onClick={copyPublicLink}
              disabled={!data?.slug || !data?.isPublished || copying}
              title={!data?.isPublished ? 'Publique seu site para copiar o link.' : undefined}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copying ? 'Copiando...' : 'Copiar link do site'}
            </Button>

          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-[#d7e8db] bg-gradient-to-br from-[#f3fff6] to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-3">
            <CardTitle className="text-sm font-medium text-gray-700">Total Arrecadado</CardTitle>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbf7e2] text-[#1e8a43]">
              <DollarSign className="w-5 h-5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {collectedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Saldo atual + saques solicitados (com taxa)</p>
            <p className="text-xs text-gray-500">Saldo atual: {availableNow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </CardContent>
        </Card>

        <Card className="border-[#f0e2cb] bg-gradient-to-br from-[#fffaf1] to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <span>Pendente</span>
              <span
                className="inline-flex items-center text-gray-400 hover:text-gray-600 cursor-help"
                title="Pagamentos em cartão ficam pendentes até a liquidação pela operadora (prazo médio D+30). Após liberação, o valor entra em Saldo atual."
                aria-label="Informações sobre pendência de cartão"
              >
                <Info className="w-4 h-4" />
              </span>
            </CardTitle>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0cb] text-[#b8860b]">
              <Clock3 className="w-5 h-5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {waitingFunds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Em processamento (cartão)</p>
            <p className="text-xs text-gray-500">{pendingOrdersCount} pedido(s) em status pendente</p>
          </CardContent>
        </Card>

        <Card className="border-[#efd8cc] bg-gradient-to-br from-[#fff7f3] to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-3">
            <CardTitle className="text-sm font-medium text-gray-700">Presentes</CardTitle>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffe5d9] text-[#c65a3a]">
              <Gift className="w-5 h-5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeGifts}/{totalGifts}</div>
            <p className="text-xs text-gray-500 mt-1">Disponíveis / Total</p>
          </CardContent>
        </Card>

        <Card className="border-[#dae6ff] bg-gradient-to-br from-[#f5f9ff] to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-3">
            <CardTitle className="text-sm font-medium text-gray-700">Saque em processamento</CardTitle>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5efff] text-[#2f67cc]">
              <Landmark className="w-5 h-5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingTransferAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingTransferCount > 0 ? `${pendingTransferCount} saque(s) aguardando transferência` : 'Nenhum saque aguardando transferência'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-[#ead9cd]">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>Últimos Presentes Recebidos</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/pagamentos">Ver todos</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum pagamento ainda</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl bg-[#f7f2ed]">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{payment.guestName}</p>
                      <p className="text-sm text-gray-500 truncate">{payment.giftItem?.name ?? 'Presente'}</p>
                    </div>
                    <div className="text-left sm:text-right sm:ml-3 shrink-0">
                      <p className="font-semibold text-[#0f9d58]">
                        {(toNumber(payment.totalAmount) - toNumber(payment.feeAmount)).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#ead9cd]">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>Recados Recentes</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/recados">Ver todos</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum recado ainda</p>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-[#efe2d7] bg-[#fffaf7] px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{message.guestName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {message.order?.giftItem?.name ? `Presente: ${message.order.giftItem.name}` : 'Recado na lista'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {new Date(message.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#ead9cd]">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Ações Rápidas</span>
            <span className="text-sm font-normal text-gray-500">Status: {statusLabel}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#e3cdbf] hover:bg-[#fff7f1]" asChild>
              <Link href="/dashboard/presentes">
                <Gift className="w-6 h-6" />
                Adicionar Presente
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#e3cdbf] hover:bg-[#fff7f1]" asChild>
              <Link href="/dashboard/editor">
                <Calendar className="w-6 h-6" />
                Editar Página
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#e3cdbf] hover:bg-[#fff7f1]" asChild>
              <Link href={publicLink} target="_blank">
                <ExternalLink className="w-6 h-6" />
                Ver Lista Pública
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 border-[#e3cdbf] hover:bg-[#fff7f1]" asChild>
              <Link href="/dashboard/configuracoes">
                <Settings className="w-6 h-6" />
                Configurações
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar saque</DialogTitle>
            <DialogDescription>
              A taxa de transferencia e de{' '}
              {(WITHDRAW_FEE_CENTS / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
              . Deseja continuar com o saque?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWithdrawOpen(false)}
              disabled={withdrawing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white"
              onClick={requestWithdraw}
              disabled={withdrawing}
            >
              {withdrawing ? 'Solicitando...' : 'Confirmar saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


