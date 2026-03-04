'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RetentionLog = {
  id: string;
  runId: string;
  dryRun: boolean;
  action: string;
  userId: string | null;
  userEmail: string | null;
  metadata: unknown;
  createdAt: string;
};

type RunSummary = {
  runId: string;
  total: number;
  startedAt: string | null;
  finishedAt: string | null;
};

type TrackedUser = {
  id: string;
  name: string | null;
  email: string;
  latestEvent: string;
  retentionDeadline: string;
  hardDeleteAt: string | null;
  isBlocked: boolean;
  managedByRetention: boolean;
  status: 'active' | 'eligible' | 'waiting_grace' | 'ready_to_delete';
  publishedLists: number;
  totalLists: number;
  lists: Array<{
    id: string;
    slug: string;
    title: string;
    eventDate: string | null;
    isPublished: boolean;
  }>;
};

type RetentionResponse = {
  logs: RetentionLog[];
  actions: string[];
  runSummaries: RunSummary[];
  trackedUsers: TrackedUser[];
  retentionDays: number;
  graceDays: number;
};

const dateTimeBr = (value?: string | null) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

function statusLabel(status: TrackedUser['status']) {
  if (status === 'ready_to_delete') return 'Pronto para excluir';
  if (status === 'waiting_grace') return 'Aguardando carência';
  if (status === 'eligible') return 'Elegível ao bloqueio';
  return 'Ativo';
}

function statusBadgeClass(status: TrackedUser['status']) {
  if (status === 'ready_to_delete') return 'bg-red-100 text-red-700';
  if (status === 'waiting_grace') return 'bg-amber-100 text-amber-700';
  if (status === 'eligible') return 'bg-orange-100 text-orange-700';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminRetencaoPage() {
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [runId, setRunId] = useState('');
  const [action, setAction] = useState('all');
  const [limit, setLimit] = useState('200');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (runId.trim()) params.set('runId', runId.trim());
    if (action !== 'all') params.set('action', action);
    params.set('limit', limit);
    return params.toString();
  }, [runId, action, limit]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/retencao?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar auditoria');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar auditoria');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(() => null);
  }, [query]);

  async function forceDeleteUser(userId: string) {
    const confirmed = window.confirm(
      'Isso vai excluir a conta agora e tentar limpar as mídias imediatamente. Deseja continuar?'
    );
    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      const res = await fetch('/api/admin/retencao', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao excluir conta');

      const deletedCount = Number(json?.assets?.deleted ?? 0);
      const failedCount = Number(json?.assets?.failed ?? 0);
      alert(
        failedCount > 0
          ? `Conta excluída. ${deletedCount} arquivos removidos e ${failedCount} falharam na limpeza.`
          : `Conta excluída. ${deletedCount} arquivos removidos com sucesso.`
      );
      await loadData();
    } catch (error: any) {
      alert(error?.message || 'Erro ao excluir conta');
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Painel de retenção</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-[#ead9cd] p-3 bg-white">
            <p className="text-gray-500">Regra atual</p>
            <p className="font-medium">Bloqueio após {data?.retentionDays ?? 90} dias do último evento</p>
          </div>
          <div className="rounded-lg border border-[#ead9cd] p-3 bg-white">
            <p className="text-gray-500">Carência</p>
            <p className="font-medium">Exclusão definitiva após {data?.graceDays ?? 7} dias de bloqueio</p>
          </div>
          <div className="rounded-lg border border-[#ead9cd] p-3 bg-white">
            <p className="text-gray-500">Observação</p>
            <p className="font-medium">A retenção usa a data do evento salva na lista.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Contas acompanhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left">Último evento</th>
                  <th className="p-2 text-left">Prazo 90 dias</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Listas</th>
                  <th className="p-2 text-left">Exclusão</th>
                  <th className="p-2 text-left">Ação</th>
                </tr>
              </thead>
              <tbody>
                {(data?.trackedUsers || []).map((user) => (
                  <tr key={user.id} className="border-t align-top">
                    <td className="p-2">
                      <p>{user.name || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">{user.id}</p>
                    </td>
                    <td className="p-2 whitespace-nowrap">{dateTimeBr(user.latestEvent)}</td>
                    <td className="p-2 whitespace-nowrap">{dateTimeBr(user.retentionDeadline)}</td>
                    <td className="p-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(user.status)}`}>
                        {statusLabel(user.status)}
                      </span>
                      {user.managedByRetention ? (
                        <p className="mt-1 text-xs text-gray-500">Bloqueada pela retenção</p>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <p>{user.publishedLists} publicadas / {user.totalLists} total</p>
                      <div className="mt-1 space-y-1">
                        {user.lists.slice(0, 3).map((list) => (
                          <p key={list.id} className="text-xs text-gray-500">
                            {list.title} · {list.isPublished ? 'publicada' : 'rascunho'}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{user.hardDeleteAt ? dateTimeBr(user.hardDeleteAt) : '-'}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingUserId === user.id}
                        onClick={() => forceDeleteUser(user.id)}
                      >
                        {deletingUserId === user.id ? 'Excluindo...' : 'Excluir agora'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {(data?.trackedUsers || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={7}>
                      Nenhuma conta com data de evento definida.
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
          <CardTitle>Retenção de contas - Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Run ID</p>
              <input
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="Cole um runId para filtrar"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Ação</p>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Todas</option>
                {(data?.actions || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Limite de linhas</p>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRunId('');
                  setAction('all');
                  setLimit('200');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Últimas execuções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Run ID</th>
                  <th className="p-2 text-left">Itens</th>
                  <th className="p-2 text-left">Iniciado em</th>
                  <th className="p-2 text-left">Finalizado em</th>
                </tr>
              </thead>
              <tbody>
                {(data?.runSummaries || []).map((row) => (
                  <tr key={row.runId} className="border-t">
                    <td className="p-2 font-mono text-xs">{row.runId}</td>
                    <td className="p-2">{row.total}</td>
                    <td className="p-2">{dateTimeBr(row.startedAt)}</td>
                    <td className="p-2">{dateTimeBr(row.finishedAt)}</td>
                  </tr>
                ))}
                {(data?.runSummaries || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={4}>
                      Nenhuma execução registrada.
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
          <CardTitle>Eventos de auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-[#faf3ee]">
                <tr>
                  <th className="p-2 text-left">Quando</th>
                  <th className="p-2 text-left">Run ID</th>
                  <th className="p-2 text-left">Ação</th>
                  <th className="p-2 text-left">Usuário</th>
                  <th className="p-2 text-left">Dry run</th>
                  <th className="p-2 text-left">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {(data?.logs || []).map((log) => (
                  <tr key={log.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">{dateTimeBr(log.createdAt)}</td>
                    <td className="p-2 font-mono text-xs">{log.runId}</td>
                    <td className="p-2">{log.action}</td>
                    <td className="p-2">
                      <p>{log.userEmail || '-'}</p>
                      <p className="text-xs text-gray-500">{log.userId || '-'}</p>
                    </td>
                    <td className="p-2">{log.dryRun ? 'Sim' : 'Não'}</td>
                    <td className="p-2">
                      <pre className="text-xs whitespace-pre-wrap break-all max-w-[440px]">
                        {log.metadata ? JSON.stringify(log.metadata, null, 2) : '-'}
                      </pre>
                    </td>
                  </tr>
                ))}
                {(data?.logs || []).length === 0 ? (
                  <tr>
                    <td className="p-3 text-gray-500 text-sm" colSpan={6}>
                      Nenhum log encontrado para os filtros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {loading ? <p className="text-sm text-gray-500 mt-3">Atualizando...</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
