'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserRound, ArrowLeft, Minus, Plus, CheckCircle2 } from 'lucide-react';

type GuestMatch = {
  id: string;
  fullName: string;
  adultLimit: number;
  childLimit: number;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  confirmedAdults: number | null;
  confirmedChildren: number | null;
};

type ConfirmResponse = {
  guest: {
    id: string;
    fullName: string;
    status: 'CONFIRMED' | 'DECLINED';
    checkInCode: string | null;
    confirmedAdults: number | null;
    confirmedChildren: number | null;
  };
  eventTitle: string;
  status: 'CONFIRMED' | 'DECLINED';
  qrPayload: string;
  qrImageUrl: string;
  totals: {
    adults: number;
    children: number;
  };
};

type Step = 'search' | 'identity' | 'companions' | 'done';

export function ConfirmClient({
  slug,
  eventTitle,
  eventDateLabel,
  eventLocation,
  coverImageUrl,
  publicTitle,
  publicDescription,
  searchPlaceholder,
}: {
  slug: string;
  eventTitle: string;
  eventDateLabel?: string | null;
  eventLocation?: string | null;
  coverImageUrl?: string | null;
  publicTitle: string;
  publicDescription: string;
  searchPlaceholder: string;
}) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GuestMatch[]>([]);
  const [selected, setSelected] = useState<GuestMatch | null>(null);

  const [adultsCompanions, setAdultsCompanions] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfirmResponse | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/public/rsvp/${encodeURIComponent(slug)}/searcháq=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao buscar convidados.');
        setResults(Array.isArray(json?.results) ? json.results : []);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          alert(error?.message || 'Erro ao buscar convidados.');
        }
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, slug]);

  const maxAdults = selected?.adultLimit ?? 0;
  const maxChildren = selected?.childLimit ?? 0;

  const totalAdults = useMemo(() => 1 + adultsCompanions, [adultsCompanions]);
  const totalGuests = useMemo(() => totalAdults + childrenCount, [totalAdults, childrenCount]);

  function chooseGuest(guest: GuestMatch) {
    setSelected(guest);
    const initialAdultsCompanions = Math.max((guest.confirmedAdults ?? 1) - 1, 0);
    const initialChildren = Math.max(guest.confirmedChildren ?? 0, 0);
    setAdultsCompanions(Math.min(initialAdultsCompanions, guest.adultLimit));
    setChildrenCount(Math.min(initialChildren, guest.childLimit));
    setStep('identity');
  }

  async function submitConfirmation(status: 'CONFIRMED' | 'DECLINED') {
    if (!selected) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/rsvp/${encodeURIComponent(slug)}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selected.id,
          status,
          adultsCompanions,
          childrenCount,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Não foi possível confirmar sua presença.');
      setResult(json);
      setStep('done');
    } catch (error: any) {
      alert(error?.message || 'Erro ao confirmar RSVP');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f5]">
      <section className="relative overflow-hidden border-b border-[#ead9cd] bg-white">
        {coverImageUrl ? (
          <div className="h-[220px] md:h-[260px] w-full">
            <img src={coverImageUrl} alt="Capa RSVP" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-[180px] md:h-[220px] bg-gradient-to-b from-[#f8ebe2] to-[#fff]" />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display text-[#2a2235]">{eventTitle}</h1>
          {eventDateLabel ? <p className="mt-2 text-gray-600">{eventDateLabel}</p> : null}
          {eventLocation ? <p className="text-sm text-gray-500">{eventLocation}</p> : null}
        </div>
      </section>

      <div className="mx-auto w-full max-w-xl p-4 md:p-6">
        {step !== 'search' && (
          <button
            type="button"
            className="mb-3 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              if (step === 'identity') setStep('search');
              if (step === 'companions') setStep('identity');
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </button>
        )}

        {step === 'search' && (
          <div className="rounded-2xl border border-[#ead9cd] bg-white p-5 md:p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">RSVP</p>
            <h2 className="text-2xl font-display text-[#2a2235] mb-2">{publicTitle}</h2>
            <p className="text-gray-600 mb-4">{publicDescription}</p>

            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>

            <div className="mt-3 text-sm text-gray-500">
              {searching ? 'Buscando...' : query.trim().length >= 2 ? `Encontramos ${results.length} resultado(s)` : 'Digite pelo menos 2 letras'}
            </div>

            <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
              {results.map((guest) => (
                <div key={guest.id} className="rounded-xl border border-[#ead9cd] bg-[#fffdfb] px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2a2235] truncate">{guest.fullName}</p>
                    <p className="text-xs text-gray-500">
                      Limite: {guest.adultLimit} adulto(s) + {guest.childLimit} criança(s)
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#d1a11e] hover:bg-[#b78a15] text-white" onClick={() => chooseGuest(guest)}>
                    Sou eu
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="ghost" asChild>
                <Link href={`/site/${encodeURIComponent(slug)}`}>Voltar para o site</Link>
              </Button>
            </div>
          </div>
        )}

        {step === 'identity' && selected && (
          <div className="rounded-2xl border border-[#ead9cd] bg-white p-6 text-center space-y-4 shadow-sm">
            <h3 className="text-3xl font-display text-[#2a2235]">Olá, {selected.fullName.split(' ')[0]}!</h3>
            <p className="text-gray-600">É você mesmo(a)?</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setStep('search')}>
                Não sou eu
              </Button>
              <Button className="bg-[#d1a11e] hover:bg-[#b78a15] text-white" onClick={() => setStep('companions')}>
                Sim, sou eu
              </Button>
            </div>
          </div>
        )}

        {step === 'companions' && selected && (
          <div className="rounded-2xl border border-[#ead9cd] bg-white p-6 shadow-sm space-y-5">
            <div className="text-center">
              <h3 className="text-3xl font-display text-[#2a2235]">Olá, {selected.fullName.split(' ')[0]}!</h3>
              <p className="text-gray-600 mt-1">Você tem direito a {selected.adultLimit} acompanhante(s) adulto(s) e {selected.childLimit} criança(s).</p>
            </div>

            <div className="rounded-xl border border-[#f0e0d4] bg-[#fffaf7] p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Quantos acompanhantes (adultos) irão com você?</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdultsCompanions((n) => Math.max(0, n - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-semibold text-[#2a2235]">{adultsCompanions}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAdultsCompanions((n) => Math.min(maxAdults, n + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="h-px bg-[#ead9cd]" />

              <div>
                <p className="text-sm text-gray-600 mb-2">Quantas crianças irão com você?</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setChildrenCount((n) => Math.max(0, n - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-semibold text-[#2a2235]">{childrenCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setChildrenCount((n) => Math.min(maxChildren, n + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="h-px bg-[#ead9cd]" />

              <div className="text-center text-sm text-gray-600 space-y-1">
                <p>Adultos (incluindo você): <strong>{totalAdults}</strong></p>
                <p>Crianças: <strong>{childrenCount}</strong></p>
                <p className="text-base text-[#2a2235]">Total de convidados: <strong>{totalGuests}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => submitConfirmation('DECLINED')}
              >
                Não poderei comparecer
              </Button>
              <Button
                className="bg-[#c65a3a] hover:bg-[#b34f32] text-white"
                disabled={submitting}
                onClick={() => submitConfirmation('CONFIRMED')}
              >
                {submitting ? 'Confirmando...' : 'Confirmar presença'}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="rounded-2xl border border-[#ead9cd] bg-white p-6 shadow-sm space-y-4 text-center">
            {result.status === 'CONFIRMED' ? (
              <>
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-display text-[#2a2235]">Presença confirmada!</h3>
                <p className="text-gray-600">Apresente este QR Code na entrada do evento.</p>

                <div className="mx-auto max-w-[280px] rounded-xl border border-[#ead9cd] p-4 bg-[#fffaf7]">
                  <p className="font-semibold text-[#2a2235]">{result.guest.fullName}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {result.totals.adults} adulto(s)
                    {result.totals.children > 0 ? ` • ${result.totals.children} criança(s)` : ''}
                  </p>
                  <img src={result.qrImageUrl} alt="QR Code RSVP" className="w-[240px] h-[240px] rounded-lg border border-[#e7d8cb] mx-auto" />
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.qrPayload);
                        alert('Código copiado.');
                      } catch {
                        alert('Não foi possível copiar agora.');
                      }
                    }}
                  >
                    Copiar código
                  </Button>
                  <Button variant="outline" onClick={() => window.print()}>
                    Salvar no celular
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-3xl font-display text-[#2a2235]">Resposta registrada</h3>
                <p className="text-gray-600">Obrigado por avisar. Vamos sentir sua falta no evento.</p>
              </>
            )}

            <Button className="bg-[#c65a3a] hover:bg-[#b34f32] text-white" asChild>
              <Link href={`/site/${encodeURIComponent(slug)}`}>Voltar para o site</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

