'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, List, QrCode, RefreshCw, UserCheck, Users, Clock3 } from 'lucide-react';

type Guest = {
  id: string;
  fullName: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  checkedInAt: string | null;
  confirmedAdults: number | null;
  confirmedChildren: number | null;
  checkInCode: string | null;
};

type OverviewResponse = {
  list: { id: string; slug: string; title: string };
  guests: Guest[];
  settings: { checkInEnabled: boolean };
  publicRsvpUrl?: string;
};

type CheckInConsoleProps = {
  overviewUrl: string;
  scanUrl: string;
  mode?: 'dashboard' | 'public';
  autoRefreshMs?: number;
};

export function CheckInConsole({
  overviewUrl,
  scanUrl,
  mode = 'dashboard',
  autoRefreshMs = 5000,
}: CheckInConsoleProps) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scanner' | 'lista'>('scanner');
  const [manualCode, setManualCode] = useState('');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'warn' | 'error'; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scannerActiveRef = useRef(false);
  const lastReadAtRef = useRef(0);
  const detectorRef = useRef<any>(null);
  const usingBarcodeDetectorRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const pushFeedback = useCallback((next: { type: 'ok' | 'warn' | 'error'; text: string }) => {
    setFeedback(next);
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) setLoading(true);

      try {
        const res = await fetch(overviewUrl, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Erro ao carregar check-in');
        setData(json);
      } catch (error: any) {
        pushFeedback({ type: 'error', text: error?.message || 'Erro ao carregar check-in.' });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [overviewUrl, pushFeedback]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs < 1000) return;

    const timer = window.setInterval(() => {
      load({ silent: true });
    }, autoRefreshMs);

    return () => window.clearInterval(timer);
  }, [autoRefreshMs, load]);

  const stopScanner = useCallback(() => {
    scannerActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  }, []);

  useEffect(() => {
    const detectorCtor = (window as any)?.BarcodeDetector;
    if (detectorCtor) {
      try {
        detectorRef.current = new detectorCtor({ formats: ['qr_code'] });
        usingBarcodeDetectorRef.current = true;
      } catch {
        detectorRef.current = null;
        usingBarcodeDetectorRef.current = false;
      }
    }

    const mediaSupported = !!navigator?.mediaDevices?.getUserMedia;
    setScannerSupported(mediaSupported);

    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      stopScanner();
    };
  }, [stopScanner]);

  const processScan = useCallback(
    async (value: string) => {
      const payload = value.trim();
      if (!payload || processing) return;

      setProcessing(true);
      try {
        const res = await fetch(scanUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: payload }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Falha no check-in');

        if (json?.alreadyCheckedIn) {
          pushFeedback({ type: 'warn', text: `${json.guest?.fullName || 'Convidado'} ja tinha check-in.` });
        } else {
          pushFeedback({ type: 'ok', text: `Check-in confirmado: ${json.guest?.fullName || 'Convidado'}.` });
        }

        await load({ silent: true });
      } catch (error: any) {
        pushFeedback({ type: 'error', text: error?.message || 'Falha no check-in.' });
      } finally {
        setProcessing(false);
      }
    },
    [load, processing, pushFeedback, scanUrl]
  );

  const scanLoopBarcodeDetector = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || !scannerActiveRef.current) return;

    try {
      const now = Date.now();
      if (now - lastReadAtRef.current > 1000) {
        const codes = await detector.detect(video);
        const rawValue = codes?.[0]?.rawValue;
        if (rawValue) {
          lastReadAtRef.current = now;
          await processScan(String(rawValue));
        }
      }
    } catch {
      // keep scanning
    } finally {
      if (scannerActiveRef.current) {
        rafRef.current = requestAnimationFrame(scanLoopBarcodeDetector);
      }
    }
  }, [processScan]);

  const scanLoopJsQr = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !scannerActiveRef.current) return;

    try {
      const now = Date.now();
      if (now - lastReadAtRef.current > 700 && video.videoWidth > 0 && video.videoHeight > 0) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (decoded?.data) {
            lastReadAtRef.current = now;
            await processScan(decoded.data);
          }
        }
      }
    } catch {
      // keep scanning
    } finally {
      if (scannerActiveRef.current) {
        rafRef.current = requestAnimationFrame(scanLoopJsQr);
      }
    }
  }, [processScan]);

  const startScanner = useCallback(async () => {
    if (!scannerSupported || !videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      scannerActiveRef.current = true;
      setScannerActive(true);
      lastReadAtRef.current = 0;

      if (usingBarcodeDetectorRef.current && detectorRef.current) {
        rafRef.current = requestAnimationFrame(scanLoopBarcodeDetector);
      } else {
        rafRef.current = requestAnimationFrame(scanLoopJsQr);
      }
    } catch {
      pushFeedback({ type: 'error', text: 'Nao foi possivel acessar a camera.' });
      stopScanner();
    }
  }, [pushFeedback, scanLoopBarcodeDetector, scanLoopJsQr, scannerSupported, stopScanner]);

  useEffect(() => {
    if (activeTab !== 'scanner') return;
    if (!scannerSupported) return;
    if (!data?.settings.checkInEnabled) return;
    if (scannerActive) return;

    startScanner();
  }, [activeTab, data?.settings.checkInEnabled, scannerActive, scannerSupported, startScanner]);

  useEffect(() => {
    if (!scannerActive) return;

    const watcher = window.setInterval(() => {
      const stream = streamRef.current;
      const video = videoRef.current;
      const hasActiveTrack = !!stream?.getVideoTracks().some((track) => track.readyState === 'live');
      const videoReady = !!video && video.readyState >= 2;

      if (!hasActiveTrack || !videoReady) {
        stopScanner();
        setTimeout(() => {
          if (activeTab === 'scanner' && data?.settings.checkInEnabled) {
            startScanner();
          }
        }, 250);
      }
    }, 1500);

    return () => window.clearInterval(watcher);
  }, [activeTab, data?.settings.checkInEnabled, scannerActive, startScanner, stopScanner]);

  const stats = useMemo(() => {
    const guests = data?.guests || [];
    const expected = guests.filter((g) => g.status === 'CONFIRMED').length;
    const checkedIn = guests.filter((g) => !!g.checkedInAt).length;
    const remaining = Math.max(expected - checkedIn, 0);
    return { expected, checkedIn, remaining };
  }, [data?.guests]);

  const filteredGuests = useMemo(() => {
    const guests = data?.guests || [];
    const query = search.trim().toLowerCase();
    if (!query) return guests;
    return guests.filter(
      (g) => g.fullName.toLowerCase().includes(query) || (g.checkInCode || '').toLowerCase().includes(query)
    );
  }, [data?.guests, search]);

  if (loading) {
    return <div className="p-4 md:p-6">Carregando check-in...</div>;
  }

  if (!data) {
    return <div className="p-4 md:p-6">Nao foi possivel carregar o check-in.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#fbf8f5] min-h-screen">
      <Card className="border-[#e7d8cb]">
        <CardContent className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display">Check-in</h1>
            <p className="text-gray-600 mt-1">Escaneie o QR Code na entrada do evento</p>
            <p className="text-sm text-gray-500 mt-1">Evento: {data.list.title}</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {mode === 'dashboard' ? (
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/rsvp">Voltar para RSVP</Link>
              </Button>
            ) : null}

            {data.publicRsvpUrl ? (
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <a href={data.publicRsvpUrl} target="_blank" rel="noopener noreferrer">
                  Ver RSVP
                </a>
              </Button>
            ) : null}

            <Button variant="outline" className="w-full sm:w-auto" onClick={() => load()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-[#f7eac8] text-[#7a5b00]">
          Modo: Scanner QR
        </Badge>
        {!data.settings.checkInEnabled && (
          <Badge variant="secondary" className="bg-[#fce7e7] text-[#9d2a2a]">
            Check-in desativado na configuracao do RSVP
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#e7d8cb]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Esperados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {stats.expected}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#d6ead8]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-[#1f8a4c] flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {stats.checkedIn}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[#f2e3c5]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-[#8e6c1d] flex items-center gap-2">
              <Clock3 className="w-5 h-5" />
              {stats.remaining}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#e7d8cb]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Modo de leitura</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant={activeTab === 'scanner' ? 'default' : 'outline'}
              className={`${activeTab === 'scanner' ? 'bg-[#8e3d2c] text-white hover:bg-[#7a3426]' : ''} w-full sm:w-auto`}
              onClick={() => setActiveTab('scanner')}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scanner
            </Button>
            <Button
              variant={activeTab === 'lista' ? 'default' : 'outline'}
              className={`${activeTab === 'lista' ? 'bg-[#8e3d2c] text-white hover:bg-[#7a3426]' : ''} w-full sm:w-auto`}
              onClick={() => setActiveTab('lista')}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {feedback && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                feedback.type === 'ok'
                  ? 'border-[#bde5c8] bg-[#f2fff6] text-[#1f8a4c]'
                  : feedback.type === 'warn'
                    ? 'border-[#f2e3c5] bg-[#fffaf0] text-[#8e6c1d]'
                    : 'border-[#f4cccc] bg-[#fff4f4] text-[#b94a48]'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {activeTab === 'scanner' ? (
            <div className="space-y-3">
              <div className="mx-auto w-full max-w-md rounded-xl border border-[#e7d8cb] bg-[#f6f3f0] aspect-square overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className={`w-full h-full object-cover ${scannerActive ? 'block' : 'hidden'}`} playsInline muted />
                {!scannerActive && (
                  <div className="text-center text-gray-500 p-6">
                    <Camera className="w-10 h-10 mx-auto mb-3" />
                    <p>Clique em iniciar para abrir a camera.</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex flex-wrap gap-2 justify-center">
                {!scannerActive ? (
                  <Button
                    onClick={startScanner}
                    disabled={!scannerSupported || !data.settings.checkInEnabled}
                    className="bg-[#c65a3a] hover:bg-[#b34f32] text-white w-full sm:w-auto"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar scanner
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full sm:w-auto" onClick={stopScanner}>
                    Parar scanner
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t border-[#efe3da]">
                <p className="text-sm font-medium mb-2">Entrada manual (QR/token/codigo)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Cole o conteudo do QR ou digite o codigo"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button
                    onClick={async () => {
                      await processScan(manualCode);
                      setManualCode('');
                    }}
                    disabled={!manualCode.trim() || processing || !data.settings.checkInEnabled}
                    className="bg-[#8e3d2c] hover:bg-[#7a3426] text-white w-full sm:w-auto"
                  >
                    Confirmar check-in
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Buscar por nome ou codigo de check-in"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="rounded-xl border border-[#e7d8cb] bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{guest.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {guest.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : guest.status === 'DECLINED'
                            ? 'Nao vai'
                            : 'Pendente'}
                        {guest.checkInCode ? ` • Codigo: ${guest.checkInCode}` : ''}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={guest.checkedInAt ? 'outline' : 'default'}
                      className={`${guest.checkedInAt ? '' : 'bg-[#1f8a4c] hover:bg-[#166a38] text-white'} w-full sm:w-auto`}
                      onClick={() => processScan(guest.checkInCode || '')}
                      disabled={!guest.checkInCode || processing || !data.settings.checkInEnabled}
                    >
                      {guest.checkedInAt ? 'Check-in OK' : 'Marcar check-in'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

