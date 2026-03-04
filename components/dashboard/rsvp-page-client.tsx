'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserRoundX, Clock3, QrCode, Settings } from 'lucide-react';

export type OverviewResponse = {
  list: { id: string; slug: string; title: string; isPublished: boolean };
  settings: { enabled: boolean; notificationEmail?: string | null };
  metrics: {
    totalGuests: number;
    confirmed: number;
    pending: number;
    declined: number;
    checkedIn: number;
  };
  publicRsvpUrl: string;
  publicCheckInUrl?: string;
};

type Guest = {
  id: string;
  fullName: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  checkedInAt: string | null;
  checkInCode: string | null;
};

type DashboardGuestFilter = 'all' | 'confirmed' | 'pending' | 'declined' | 'confirmedCheckedIn';

export default function DashboardRsvpPageClient({ initialData }: { initialData: OverviewResponse | null }) {
  const [data, setData] = useState<OverviewResponse | null>(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [guestFilter, setGuestFilter] = useState<DashboardGuestFilter>('all');
  const [visibleCount, setVisibleCount] = useState(5);

  async function load(options?: { silent?: boolean }) {
    const silent = options?.silent === true;
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/rsvp/overview?view=dashboard', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar RSVP');
      setData(json);
    } catch (error: any) {
      if (!silent) {
        alert(error?.message || 'Erro ao carregar RSVP');
      }
    } finally {
      if (!silent) setRefreshing(false);
    }
  }

  async function loadGuests(options?: { silent?: boolean }) {
    const silent = options?.silent === true;
    if (!silent) setGuestsLoading(true);
    try {
      const res = await fetch('/api/rsvp/guests?view=checkin&limit=500', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar convidados');
      setGuests(Array.isArray(json) ? json : []);
    } catch (error) {
      if (!silent) {
        console.error('Falha ao carregar convidados no dashboard RSVP:', error);
      }
    } finally {
      if (!silent) setGuestsLoading(false);
    }
  }

  useEffect(() => {
    loadGuests();
    const timer = window.setInterval(() => {
      load({ silent: true });
      loadGuests({ silent: true });
    }, 12000);
    return () => window.clearInterval(timer);
  }, []);

  const metrics = data?.metrics ?? {
    totalGuests: 0,
    confirmed: 0,
    pending: 0,
    declined: 0,
    checkedIn: 0,
  };

  const filteredGuests = useMemo(() => {
    switch (guestFilter) {
      case 'confirmed':
        return guests.filter((guest) => guest.status === 'CONFIRMED');
      case 'pending':
        return guests.filter((guest) => guest.status === 'PENDING');
      case 'declined':
        return guests.filter((guest) => guest.status === 'DECLINED');
      case 'confirmedCheckedIn':
        return guests.filter((guest) => guest.status === 'CONFIRMED' && !!guest.checkedInAt);
      case 'all':
      default:
        return guests;
    }
  }, [guestFilter, guests]);

  const visibleGuests = useMemo(() => filteredGuests.slice(0, visibleCount), [filteredGuests, visibleCount]);
  const canShowMore = visibleCount < filteredGuests.length;
  const canShowLess = visibleCount > 5;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#fbf8f5] min-h-screen">
      <Card className="border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9]">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-foreground">RSVP</h1>
            <p className="text-gray-600 mt-1">Controle de convidados, confirmações e check-in</p>
            <p className="text-sm text-gray-500 mt-1">Evento: {data?.list?.title ?? 'Carregando...'}</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!data?.settings?.enabled ? (
              <Button asChild className="bg-[#c65a3a] hover:bg-[#b34f32] text-white w-full sm:w-auto">
                <Link href="/dashboard/rsvp/config">Criar RSVP</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/rsvp/checkin">
                    <QrCode className="w-4 h-4 mr-2" />
                    Ver check-in
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/rsvp/config?status=confirmed">Ver confirmados</Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/rsvp/config?status=pending">Ver pendentes</Link>
                </Button>
                <Button asChild className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white w-full sm:w-auto">
                  <Link href="/dashboard/rsvp/config">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar RSVP
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-[#dfe8e3]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total de convidados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#25364b] flex items-center gap-2"><Users className="w-5 h-5" /> {metrics.totalGuests}</p>
          </CardContent>
        </Card>

        <Card className="border-[#d6ead8]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1f8a4c]">{metrics.confirmed}</p>
          </CardContent>
        </Card>

        <Card className="border-[#f2e3c5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#8e6c1d] flex items-center gap-2"><Clock3 className="w-5 h-5" /> {metrics.pending}</p>
          </CardContent>
        </Card>

        <Card className="border-[#f1d6d6]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Não comparecem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#ab3f3f] flex items-center gap-2"><UserRoundX className="w-5 h-5" /> {metrics.declined}</p>
          </CardContent>
        </Card>

        <Card className="border-[#d7e0f5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#2d5ab7] flex items-center gap-2"><UserCheck className="w-5 h-5" /> {metrics.checkedIn}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Lista de convidados ({visibleGuests.length}/{filteredGuests.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max flex-nowrap gap-2">
            <Button size="sm" className="whitespace-nowrap" variant={guestFilter === 'all' ? 'default' : 'outline'} onClick={() => { setGuestFilter('all'); setVisibleCount(5); }}>
              Todos
            </Button>
            <Button size="sm" className="whitespace-nowrap" variant={guestFilter === 'confirmed' ? 'default' : 'outline'} onClick={() => { setGuestFilter('confirmed'); setVisibleCount(5); }}>
              Confirmados
            </Button>
            <Button size="sm" className="whitespace-nowrap" variant={guestFilter === 'pending' ? 'default' : 'outline'} onClick={() => { setGuestFilter('pending'); setVisibleCount(5); }}>
              Pendentes
            </Button>
            <Button size="sm" className="whitespace-nowrap" variant={guestFilter === 'declined' ? 'default' : 'outline'} onClick={() => { setGuestFilter('declined'); setVisibleCount(5); }}>
              Nao comparecem
            </Button>
            <Button
              size="sm"
              className="whitespace-nowrap"
              variant={guestFilter === 'confirmedCheckedIn' ? 'default' : 'outline'}
              onClick={() => { setGuestFilter('confirmedCheckedIn'); setVisibleCount(5); }}
            >
              Confirmados com check-in
            </Button>
            </div>
          </div>

          {guestsLoading ? <p className="text-sm text-gray-500">Carregando convidados...</p> : null}

          {visibleGuests.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum convidado neste filtro.</p>
          ) : (
            <div className="space-y-2">
              {visibleGuests.map((guest) => (
                <div key={guest.id} className="rounded-xl border border-[#e7d8cb] bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{guest.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {guest.status === 'CONFIRMED'
                        ? 'Confirmado'
                        : guest.status === 'DECLINED'
                          ? 'Nao comparece'
                          : 'Pendente'}
                      {guest.checkedInAt ? ' • Check-in OK' : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild>
                    <Link href="/dashboard/rsvp/config">Gerenciar</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {canShowMore ? (
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setVisibleCount((prev) => Math.min(prev + 5, filteredGuests.length))}>
                Ver mais
              </Button>
            ) : null}
            {canShowLess ? (
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setVisibleCount((prev) => Math.max(prev - 5, 5))}>
                Ver menos
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Status do RSVP</CardTitle>
          <Badge variant={data?.settings?.enabled ? 'default' : 'secondary'}>
            {data?.settings?.enabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>URL de confirmação: <span className="font-medium text-gray-900 break-all">{data?.publicRsvpUrl ?? '-'}</span></p>
          <p>URL do check-in público: <span className="font-medium text-gray-900 break-all">{data?.publicCheckInUrl || 'Não disponível'}</span></p>
          <p>Email de notificações: <span className="font-medium text-gray-900">{data?.settings?.notificationEmail || 'Não configurado'}</span></p>
          {refreshing ? <p className="text-xs text-gray-500">Atualizando dados...</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

