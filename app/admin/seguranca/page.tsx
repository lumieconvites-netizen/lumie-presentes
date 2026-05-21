'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Mail, Network, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PeriodFilter = '24h' | '7d' | '30d' | 'all';

type SecurityEvent = {
  id: string;
  type: string;
  email: string | null;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  route: string | null;
  metadata: unknown;
  createdAt: string;
};

type SecurityResponse = {
  events: SecurityEvent[];
  total: number;
  hasMore: boolean;
  summary: {
    byType: Array<{ type: string; count: number }>;
    byIp: Array<{ ip: string | null; count: number }>;
    byEmail: Array<{ email: string | null; count: number }>;
  };
};

const EVENT_TYPES = [
  'all',
  'AUTH_REGISTER_BLOCKED_EMAIL_DOMAIN',
  'AUTH_REGISTER_VERIFICATION_SENT',
  'AUTH_VERIFY_EMAIL_SUCCESS',
  'AUTH_LOGIN_BLOCKED_USER',
  'AUTH_LOGIN_WRONG_PASSWORD',
  'PREMIUM_CHECKOUT_ATTEMPT',
  'PREMIUM_CHECKOUT_REFUSED',
  'PREMIUM_CHECKOUT_REFUSED_LIMIT_BLOCKED',
  'PREMIUM_CHECKOUT_BLOCKED_EMAIL_DOMAIN',
  'PREMIUM_CHECKOUT_APPROVED',
];

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '24h': '24 horas',
  '7d': '7 dias',
  '30d': '30 dias',
  all: 'Tudo',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortEventType(type: string) {
  return type
    .replace(/^AUTH_/, '')
    .replace(/^PREMIUM_/, '')
    .replace(/_/g, ' ')
    .toLowerCase();
}

function metadataPreview(metadata: unknown) {
  if (!metadata) return '-';
  try {
    const text = JSON.stringify(metadata);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  } catch {
    return '-';
  }
}

export default function AdminSecurityPage() {
  const [period, setPeriod] = useState<PeriodFilter>('24h');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [take, setTake] = useState(100);
  const [data, setData] = useState<SecurityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      period,
      type,
      take: String(take),
    });
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }, [period, type, q, take]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/security-events?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar eventos de seguranca');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar eventos de seguranca');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(loadData, 250);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const total = data?.total ?? 0;
  const mostActiveIp = data?.summary.byIp[0];
  const mostActiveEmail = data?.summary.byEmail[0];

  return (
    <div className="space-y-5">
      <Card className="border-[#e7d8cb] bg-white">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#8e3d2c]" />
                Seguranca
              </CardTitle>
              <p className="text-sm text-gray-600">Eventos de cadastro, login e checkout para rastrear abuso.</p>
            </div>
            <Button onClick={loadData} disabled={loading} className="bg-[#8e3d2c] text-white hover:bg-[#7a3426]">
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf7] p-4">
            <p className="flex items-center gap-2 text-xs text-gray-500"><Clock className="h-4 w-4" /> Eventos</p>
            <p className="mt-2 text-2xl font-bold">{total}</p>
            <p className="text-xs text-gray-500">{PERIOD_LABELS[period]}</p>
          </div>
          <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf7] p-4">
            <p className="flex items-center gap-2 text-xs text-gray-500"><AlertTriangle className="h-4 w-4" /> Tipo mais comum</p>
            <p className="mt-2 truncate text-sm font-semibold">{data?.summary.byType[0]?.type ?? '-'}</p>
            <p className="text-xs text-gray-500">{data?.summary.byType[0]?.count ?? 0} ocorrencias</p>
          </div>
          <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf7] p-4">
            <p className="flex items-center gap-2 text-xs text-gray-500"><Network className="h-4 w-4" /> IP mais ativo</p>
            <p className="mt-2 truncate text-sm font-semibold">{mostActiveIp?.ip ?? '-'}</p>
            <p className="text-xs text-gray-500">{mostActiveIp?.count ?? 0} eventos</p>
          </div>
          <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf7] p-4">
            <p className="flex items-center gap-2 text-xs text-gray-500"><Mail className="h-4 w-4" /> Email mais ativo</p>
            <p className="mt-2 truncate text-sm font-semibold">{mostActiveEmail?.email ?? '-'}</p>
            <p className="text-xs text-gray-500">{mostActiveEmail?.count ?? 0} eventos</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb] bg-white">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 lg:grid-cols-[160px_280px_1fr_120px]">
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'Todos os tipos' : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar por email, IP, rota, usuario ou tipo..."
            />

            <Select value={String(take)} onValueChange={(value) => setTake(Number(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="300">300</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#ead8cc]">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-[#fbf4ee] text-left text-xs uppercase text-[#8e3d2c]">
                <tr>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">IP</th>
                  <th className="px-3 py-3">Rota</th>
                  <th className="px-3 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Carregando...</td></tr>
                ) : !data?.events.length ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Nenhum evento encontrado.</td></tr>
                ) : (
                  data.events.map((event) => (
                    <tr key={event.id} className="border-t border-[#f0e1d5] align-top">
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(event.createdAt)}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="max-w-[260px] whitespace-normal text-left">
                          {shortEventType(event.type)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[240px] truncate" title={event.email ?? undefined}>{event.email ?? '-'}</div>
                        <div className="max-w-[240px] truncate text-xs text-gray-500" title={event.userId ?? undefined}>{event.userId ?? ''}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{event.ip ?? '-'}</td>
                      <td className="px-3 py-3"><span className="block max-w-[220px] truncate" title={event.route ?? undefined}>{event.route ?? '-'}</span></td>
                      <td className="px-3 py-3">
                        <code className="block max-w-[360px] whitespace-normal rounded bg-[#fbf4ee] px-2 py-1 text-xs text-[#5f4a41]">
                          {metadataPreview(event.metadata)}
                        </code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
