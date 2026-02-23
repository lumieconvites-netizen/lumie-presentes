'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserRoundX, Clock3, QrCode, Settings } from 'lucide-react';

type OverviewResponse = {
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

export default function DashboardRsvpPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(options?: { silent?: boolean }) {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/rsvp/overview', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar RSVP');
      setData(json);
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar RSVP');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      load({ silent: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="p-4 md:p-6">Carregando RSVP...</div>;
  }

  if (!data) {
    return <div className="p-4 md:p-6">N?o foi poss?vel carregar o RSVP.</div>;
  }

  const { metrics } = data;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#fbf8f5] min-h-screen">
      <Card className="border-[#e7d8cb] bg-gradient-to-r from-[#fff7f1] to-[#fffdf9]">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display text-foreground">RSVP</h1>
            <p className="text-gray-600 mt-1">Controle de convidados, confirmações e check-in</p>
            <p className="text-sm text-gray-500 mt-1">Evento: {data.list.title}</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!data.settings.enabled ? (
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
            <CardTitle className="text-sm text-gray-600">N?o comparecem</CardTitle>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status do RSVP</CardTitle>
          <Badge variant={data.settings.enabled ? 'default' : 'secondary'}>
            {data.settings.enabled ? 'Ativo' : 'Inativo'}
          </Badge>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>URL de confirmação: <span className="font-medium text-gray-900">{data.publicRsvpUrl}</span></p>
          <p>URL do check-in p?blico: <span className="font-medium text-gray-900">{data.publicCheckInUrl || 'N?o dispon?vel'}</span></p>
          <p>Email de notificações: <span className="font-medium text-gray-900">{data.settings.notificationEmail || 'N?o configurado'}</span></p>
        </CardContent>
      </Card>
    </div>
  );
}

