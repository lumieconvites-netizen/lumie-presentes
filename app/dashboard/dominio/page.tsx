'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink, Globe2, Loader2, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type DomainStatus = {
  id: string;
  domain: string;
  status: 'SELECTED' | 'PURCHASE_PENDING' | 'ACTIVE' | 'EXPIRED' | 'FAILED';
  availabilityCheckedAt: string | null;
  registeredAt: string | null;
  expiresAt: string | null;
  lastError: string | null;
  createdAt: string;
};

type Suggestion = {
  domain: string;
  available: boolean | null;
  error?: string;
};

type DomainState = {
  plan: 'FREE' | 'PREMIUM';
  enabled: boolean;
  customDomain: DomainStatus | null;
  entitlement: {
    hasAvailableSlot: boolean;
    hasReservedSlot: boolean;
    activeCount: number;
    active: {
      id: string;
      status: 'AVAILABLE' | 'RESERVED' | 'CONSUMED' | 'EXPIRED' | 'RELEASED';
      expiresAt: string | null;
      reservedAt: string | null;
      customDomain: {
        id: string;
        domain: string;
        status: DomainStatus['status'];
        expiresAt: string | null;
      } | null;
    } | null;
  } | null;
  supportedTlds: string[];
  vercelConfigured: boolean;
};

function statusLabel(status: DomainStatus['status']) {
  if (status === 'ACTIVE') return 'Ativo';
  if (status === 'PURCHASE_PENDING') return 'Reservado para registro';
  if (status === 'EXPIRED') return 'Expirado';
  if (status === 'FAILED') return 'Falhou';
  return 'Selecionado';
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export default function CustomDomainPage() {
  const [state, setState] = useState<DomainState | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [savingDomain, setSavingDomain] = useState<string | null>(null);
  const [copyingDomainUrl, setCopyingDomainUrl] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/domains/custom', { cache: 'no-store' });
      const data = await parseJsonSafe(response);
      if (!response.ok) throw new Error(data?.error || 'Erro ao carregar domínio');
      setState(data);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar domínio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function searchDomains() {
    setSearching(true);
    setSuggestions([]);
    try {
      const response = await fetch('/api/domains/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query }),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok) throw new Error(data?.error || 'Erro ao buscar domínios');
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      alert(error?.message || 'Erro ao buscar domínios');
    } finally {
      setSearching(false);
    }
  }

  async function selectDomain(domain: string) {
    setSavingDomain(domain);
    try {
      const response = await fetch('/api/domains/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select', domain }),
      });
      const data = await parseJsonSafe(response);
      if (!response.ok) throw new Error(data?.error || 'Erro ao selecionar domínio');
      await load();
    } catch (error: any) {
      alert(error?.message || 'Erro ao selecionar domínio');
    } finally {
      setSavingDomain(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabled = Boolean(state?.enabled);
  const configured = Boolean(state?.vercelConfigured);
  const activeDomain = state?.customDomain?.status === 'ACTIVE' ? state.customDomain.domain : null;
  const activeDomainUrl = activeDomain ? `https://${activeDomain}` : null;

  async function copyActiveDomainUrl() {
    if (!activeDomainUrl) return;
    try {
      setCopyingDomainUrl(true);
      await navigator.clipboard.writeText(activeDomainUrl);
    } catch {
      alert('Não foi possível copiar o link agora.');
    } finally {
      setTimeout(() => setCopyingDomainUrl(false), 900);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Domínio personalizado</h1>
          <p className="mt-1 text-sm text-gray-600">Escolha um endereço exclusivo para sua lista premium.</p>
        </div>
        <Badge variant={enabled ? 'default' : 'outline'}>{enabled ? 'Premium' : 'Gratuito'}</Badge>
      </div>

      {!enabled ? (
        <Card className="border-[#ead8cc]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-[#8E3D2C]" />
              Disponível no plano Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>O domínio próprio fica liberado para clientes Premium. A URL gratuita da Lumie continua funcionando normalmente.</p>
            <p>Quando o plano for ativado, você poderá buscar domínios .com, .site e .net por aqui.</p>
            <Button asChild className="bg-[#8E3D2C] text-white hover:bg-[#753124]">
              <Link href="/tarifas">Ver diferenças</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {!activeDomain ? (
            <Card className="border-[#ead8cc] bg-[#fffdf9]">
              <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#3c2b24]">1 domínio incluído no seu Lumie Exclusive</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {state?.entitlement?.hasReservedSlot
                      ? 'Seu direito ao domínio já está reservado. O próximo passo será conectar a compra automática com o registrador.'
                      : state?.entitlement?.hasAvailableSlot
                        ? 'Seu plano já liberou 1 domínio para reservar. Escolha uma opção disponível abaixo.'
                        : 'No momento, não encontramos um direito de domínio disponível para esta conta.'}
                  </p>
                </div>
                <Badge variant="outline">
                  {state?.entitlement?.hasReservedSlot
                    ? 'Direito reservado'
                    : state?.entitlement?.hasAvailableSlot
                      ? '1 disponível'
                      : 'Indisponível'}
                </Badge>
              </CardContent>
            </Card>
          ) : null}

          {state?.customDomain ? (
            <Card className="border-[#d9eadf] bg-[#fbfffc]">
              <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-[#26352b]">{state.customDomain.domain}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Status: {statusLabel(state.customDomain.status)}</p>
                  {state.customDomain.lastError ? <p className="mt-1 text-xs text-amber-700">{state.customDomain.lastError}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {activeDomainUrl ? (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={copyActiveDomainUrl}>
                        <Copy className="mr-2 h-4 w-4" />
                        {copyingDomainUrl ? 'Copiado!' : 'Copiar site'}
                      </Button>
                      <Button asChild type="button" size="sm" className="bg-[#8E3D2C] text-white hover:bg-[#753124]">
                        <Link href={activeDomainUrl} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir site
                        </Link>
                      </Button>
                    </>
                  ) : null}
                  <Badge variant="outline">{statusLabel(state.customDomain.status)}</Badge>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Buscar domínio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="isabella15"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !searching) searchDomains();
                  }}
                />
                <Button type="button" onClick={searchDomains} disabled={searching}>
                  {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Buscar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {(state?.supportedTlds || ['com', 'site', 'net']).map((tld) => (
                  <span key={tld} className="rounded-full border px-2 py-1">.{tld}</span>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Digite apenas o nome desejado e teste com .com, .site ou .net. Exemplo: isabella15.
              </p>

              {!configured ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Busca real na Vercel ainda precisa do token da API configurado.
                </div>
              ) : null}

              {suggestions.length ? (
                <div className="divide-y rounded-lg border">
                  {suggestions.map((item) => (
                    <div
                      key={item.domain}
                      className={cn(
                        'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
                        item.available === true && 'bg-green-50/70',
                        item.available === false && 'bg-red-50/70'
                      )}
                    >
                      <div>
                        <p className="font-medium">{item.domain}</p>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            item.available === true && 'text-green-700',
                            item.available === false && 'text-red-700',
                            item.available === null && 'text-gray-500'
                          )}
                        >
                          {item.available === true ? 'Disponível' : item.available === false ? 'Indisponível' : item.error || 'Não verificado'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={item.available ? 'default' : 'outline'}
                        disabled={!item.available || savingDomain === item.domain}
                        onClick={() => selectDomain(item.domain)}
                      >
                        {savingDomain === item.domain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Escolher
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
