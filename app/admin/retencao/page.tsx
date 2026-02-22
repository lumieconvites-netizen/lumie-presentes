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

type RetentionResponse = {
  logs: RetentionLog[];
  actions: string[];
  runSummaries: RunSummary[];
};

const dateTimeBr = (value?: string | null) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

export default function AdminRetencaoPage() {
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-6">
      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Retencao de contas - Auditoria</CardTitle>
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
              <p className="text-xs text-gray-500">Acao</p>
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
          <CardTitle>Ultimas execucoes</CardTitle>
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
                      Nenhuma execucao registrada.
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
                  <th className="p-2 text-left">Acao</th>
                  <th className="p-2 text-left">Usuario</th>
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
                    <td className="p-2">{log.dryRun ? 'Sim' : 'Nao'}</td>
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

