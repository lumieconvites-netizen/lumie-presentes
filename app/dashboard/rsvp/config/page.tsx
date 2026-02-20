'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Plus, QrCode, Trash2, UserCheck, UploadCloud, FileUp } from 'lucide-react';

type RsvpGuest = {
  id: string;
  fullName: string;
  notes: string | null;
  adultLimit: number;
  childLimit: number;
  confirmedAdults: number | null;
  confirmedChildren: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  qrToken: string;
  confirmedAt: string | null;
  checkedInAt: string | null;
  checkInCode: string | null;
  createdAt: string;
};

type Overview = {
  list: { slug: string; title: string };
  settings: {
    enabled: boolean;
    notificationEmail: string | null;
    eventTitle: string | null;
    eventDateLabel: string | null;
    eventLocation: string | null;
    coverImageUrl: string | null;
    publicTitle: string | null;
    publicDescription: string | null;
    searchPlaceholder: string | null;
    checkInEnabled: boolean;
    checkInSlug: string | null;
  };
  guests: RsvpGuest[];
  publicCheckInUrl?: string;
};

type GuestInput = {
  fullName: string;
  adultLimit?: number;
  childLimit?: number;
};

const statusLabels: Record<RsvpGuest['status'], string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  DECLINED: 'Não vai',
};

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseNonNegativeInt(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && char === delimiter) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function decodeCsvContent(file: File, arrayBuffer: ArrayBuffer) {
  const preferred = file.type.toLowerCase();
  const utf8 = new TextDecoder('utf-8').decode(arrayBuffer);
  const hasReplacement = utf8.includes('\uFFFD');

  if (preferred.includes('windows-1252') || preferred.includes('iso-8859-1') || hasReplacement) {
    return new TextDecoder('windows-1252').decode(arrayBuffer);
  }

  return utf8;
}

function parseCsvGuests(raw: string): GuestInput[] {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const first = lines[0];
  const delimiter = first.split(';').length >= first.split(',').length ? ';' : ',';
  const firstCols = parseCsvLine(first, delimiter);
  const firstHeaders = firstCols.map((c) => normalizeHeader(c));

  const hasHeader = firstHeaders.some((c) =>
    [
      'nome',
      'name',
      'convidado',
      'fullname',
      'adultos',
      'adultoslimit',
      'acompanhantes',
      'criancas',
      'criancaslimit',
      'children',
      'filhos',
    ].includes(c)
  );

  const findHeaderIndex = (...keys: string[]) => {
    for (let i = 0; i < firstHeaders.length; i += 1) {
      if (keys.includes(firstHeaders[i])) return i;
    }
    return -1;
  };

  const nameIndex = hasHeader ? findHeaderIndex('nome', 'name', 'convidado', 'fullname') : 0;
  const adultIndex = hasHeader ? findHeaderIndex('adultos', 'adultoslimit', 'acompanhantes') : 1;
  const childIndex = hasHeader ? findHeaderIndex('criancas', 'criancaslimit', 'children', 'filhos') : 2;

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => parseCsvLine(line, delimiter))
    .map((cols) => {
      const fullName = (cols[nameIndex] || '').trim();
      return {
        fullName,
        adultLimit: adultIndex >= 0 ? parseNonNegativeInt(cols[adultIndex]) : 0,
        childLimit: childIndex >= 0 ? parseNonNegativeInt(cols[childIndex]) : 0,
      };
    })
    .filter((g) => g.fullName.length >= 2);
}

export default function RsvpConfigPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [data, setData] = useState<Overview | null>(null);
  const [openQr, setOpenQr] = useState(false);
  const [qrGuest, setQrGuest] = useState<RsvpGuest | null>(null);
  const [openImportPreview, setOpenImportPreview] = useState(false);

  const [settings, setSettings] = useState({
    enabled: false,
    notificationEmail: '',
    eventTitle: '',
    eventDateLabel: '',
    eventLocation: '',
    coverImageUrl: '',
    publicTitle: '',
    publicDescription: '',
    searchPlaceholder: '',
    checkInEnabled: true,
    checkInSlug: '',
  });

  const [guestForm, setGuestForm] = useState({
    fullName: '',
    notes: '',
    adultLimit: 0,
    childLimit: 0,
  });

  const [importText, setImportText] = useState('');
  const [importGuestsPreview, setImportGuestsPreview] = useState<GuestInput[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const qrPayload = useMemo(() => {
    if (!qrGuest || !data || typeof window === 'undefined') return '';
    return `${window.location.origin}/site/${encodeURIComponent(data.list.slug)}/confirmar-presenca?token=${encodeURIComponent(qrGuest.qrToken)}`;
  }, [qrGuest, data]);

  const qrUrl = useMemo(() => {
    if (!qrPayload) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}`;
  }, [qrPayload]);
  const previewCheckInUrl = useMemo(() => {
    const suffix = encodeURIComponent(settings.checkInSlug || data?.list.slug || '');
    if (!suffix) return '';
    if (typeof window === 'undefined') {
      return data?.publicCheckInUrl || '';
    }
    return `${window.location.origin}/rsvp/checkin/${suffix}`;
  }, [data?.list.slug, data?.publicCheckInUrl, settings.checkInSlug]);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp/overview', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao carregar RSVP');
      setData(json);
      setSettings({
        enabled: !!json.settings.enabled,
        notificationEmail: json.settings.notificationEmail || '',
        eventTitle: json.settings.eventTitle || json.list.title || '',
        eventDateLabel: json.settings.eventDateLabel || '',
        eventLocation: json.settings.eventLocation || '',
        coverImageUrl: json.settings.coverImageUrl || '',
        publicTitle: json.settings.publicTitle || 'Confirmar Presença',
        publicDescription: json.settings.publicDescription || 'Confirme sua presença no evento.',
        searchPlaceholder:
          json.settings.searchPlaceholder === 'Digite seu nome completo'
            ? 'Ex: Isabella'
            : json.settings.searchPlaceholder || 'Ex: Isabella',
        checkInEnabled: json.settings.checkInEnabled !== false,
        checkInSlug: json.settings.checkInSlug || json.list.slug,
      });
    } catch (error: any) {
      alert(error?.message || 'Erro ao carregar RSVP');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function saveSettings(e?: FormEvent) {
    e?.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/rsvp/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao salvar configurações');
      await loadOverview();
      alert('Configurações de RSVP salvas com sucesso.');
    } catch (error: any) {
      alert(error?.message || 'Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  }

  async function uploadCoverImage(file?: File | null) {
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'rsvp');

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha no upload da imagem.');

      setSettings((prev) => ({ ...prev, coverImageUrl: json.url }));
    } catch (error: any) {
      alert(error?.message || 'Falha no upload da imagem.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function addGuest(e: FormEvent) {
    e.preventDefault();
    setAddingGuest(true);
    try {
      const res = await fetch('/api/rsvp/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao adicionar convidado');

      setGuestForm({ fullName: '', notes: '', adultLimit: 0, childLimit: 0 });
      await loadOverview();
    } catch (error: any) {
      alert(error?.message || 'Erro ao adicionar convidado');
    } finally {
      setAddingGuest(false);
    }
  }

  async function importGuests(guestsPayload?: GuestInput[]) {
    const guests = guestsPayload || importGuestsPreview;
    if (!guests.length) return;

    setImporting(true);
    try {
      const res = await fetch('/api/rsvp/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao importar convidados');

      alert(`${json.created || 0} convidado(s) importado(s).`);
      setImportText('');
      setImportGuestsPreview([]);
      setOpenImportPreview(false);
      await loadOverview();
    } catch (error: any) {
      alert(error?.message || 'Erro ao importar convidados');
    } finally {
      setImporting(false);
    }
  }

  function importFromQuickText() {
    if (!importText.trim()) return;
    const guests = parseCsvGuests(importText.replace(/;/g, ';'));
    if (!guests.length) {
      alert('Não foi possível ler convidados no texto informado.');
      return;
    }
    setImportGuestsPreview(guests);
    setOpenImportPreview(true);
  }

  async function handleCsvFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const text = decodeCsvContent(file, buffer);
      const guests = parseCsvGuests(text);
      if (!guests.length) {
        alert('CSV sem convidados válidos. Use colunas: nome,adultos,criancas');
        return;
      }
      setImportGuestsPreview(guests);
      setOpenImportPreview(true);
    } catch {
      alert('Não foi possível ler o arquivo CSV.');
    } finally {
      e.target.value = '';
    }
  }

  async function deleteGuest(id: string) {
    if (!confirm('Excluir este convidado?')) return;

    try {
      const res = await fetch(`/api/rsvp/guests/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao excluir convidado');
      await loadOverview();
    } catch (error: any) {
      alert(error?.message || 'Erro ao excluir convidado');
    }
  }

  async function toggleCheckIn(id: string, nextState: boolean) {
    try {
      const res = await fetch(`/api/rsvp/guests/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn: nextState }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao atualizar check-in');
      await loadOverview();
    } catch (error: any) {
      alert(error?.message || 'Erro ao atualizar check-in');
    }
  }

  if (loading) {
    return <div className="p-6">Carregando configuração de RSVP...</div>;
  }

  if (!data) {
    return <div className="p-6">Não foi possível carregar o RSVP.</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-[#fbf8f5] min-h-screen">
      <Card className="border-[#e7d8cb]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuração do RSVP</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/site/${encodeURIComponent(data.list.slug)}/confirmar-presenca`} target="_blank" rel="noopener noreferrer">
                Ver RSVP
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/rsvp/guests/export" target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" /> Exportar lista
              </a>
            </Button>
            <Button className="bg-[#c65a3a] hover:bg-[#b55033] text-white" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? 'Salvando...' : 'Salvar configurações'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={saveSettings}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ativar RSVP</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                  className="h-4 w-4 accent-[#c65a3a]"
                />
                <span className="text-sm text-gray-600">Permitir confirmação de presença na página pública</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Permitir check-in</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.checkInEnabled}
                  onChange={(e) => setSettings((s) => ({ ...s, checkInEnabled: e.target.checked }))}
                  className="h-4 w-4 accent-[#c65a3a]"
                />
                <span className="text-sm text-gray-600">Controlar entrada dos convidados no evento</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug da pagina publica de check-in</label>
              <Input
                value={settings.checkInSlug}
                onChange={(e) => setSettings((s) => ({ ...s, checkInSlug: e.target.value }))}
                placeholder="ex: portaria-casamento-isabella"
              />
              <p className="text-xs text-gray-500">
                Link: {previewCheckInUrl}
              </p>
              {previewCheckInUrl ? (
                <a href={previewCheckInUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8e3d2c] underline">
                  Abrir pagina publica de check-in
                </a>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título do evento</label>
              <Input value={settings.eventTitle} onChange={(e) => setSettings((s) => ({ ...s, eventTitle: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail de notificações</label>
              <Input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings((s) => ({ ...s, notificationEmail: e.target.value }))}
                placeholder="email@dominio.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data/hora (texto livre)</label>
              <Input
                value={settings.eventDateLabel}
                onChange={(e) => setSettings((s) => ({ ...s, eventDateLabel: e.target.value }))}
                placeholder="Ex.: 22 de novembro de 2026 às 20h"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Local</label>
              <Input
                value={settings.eventLocation}
                onChange={(e) => setSettings((s) => ({ ...s, eventLocation: e.target.value }))}
                placeholder="Ex.: Espaço LUMIÊ, São Paulo - SP"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Imagem de capa da página RSVP</label>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  value={settings.coverImageUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, coverImageUrl: e.target.value }))}
                  placeholder="https://..."
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadCoverImage(e.target.files?.[0] || null)}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingCover}>
                  <UploadCloud className="w-4 h-4 mr-2" /> {uploadingCover ? 'Enviando...' : 'Enviar foto'}
                </Button>
              </div>
              {settings.coverImageUrl ? (
                <img src={settings.coverImageUrl} alt="Preview capa RSVP" className="mt-2 h-36 w-full object-cover rounded-xl border border-[#e7d8cb]" />
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título da página pública</label>
              <Input
                value={settings.publicTitle}
                onChange={(e) => setSettings((s) => ({ ...s, publicTitle: e.target.value }))}
                placeholder="Confirmar Presença"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Texto da busca</label>
              <Input
                value={settings.searchPlaceholder}
                onChange={(e) => setSettings((s) => ({ ...s, searchPlaceholder: e.target.value }))}
                placeholder="Ex: Isabella"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição da página pública</label>
              <Textarea
                rows={3}
                value={settings.publicDescription}
                onChange={(e) => setSettings((s) => ({ ...s, publicDescription: e.target.value }))}
                placeholder="Confirme sua presença no evento."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Adicionar convidado</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-6 gap-3" onSubmit={addGuest}>
            <Input
              placeholder="Nome completo"
              value={guestForm.fullName}
              onChange={(e) => setGuestForm((s) => ({ ...s, fullName: e.target.value }))}
              required
              className="md:col-span-4"
            />
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Adultos</label>
              <Input
                type="number"
                min={0}
                max={20}
                placeholder="0"
                value={guestForm.adultLimit}
                onChange={(e) => setGuestForm((s) => ({ ...s, adultLimit: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Crianças</label>
              <Input
                type="number"
                min={0}
                max={20}
                placeholder="0"
                value={guestForm.childLimit}
                onChange={(e) => setGuestForm((s) => ({ ...s, childLimit: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Observação (opcional)"
                value={guestForm.notes}
                onChange={(e) => setGuestForm((s) => ({ ...s, notes: e.target.value }))}
              />
              <Button type="submit" className="bg-[#8e3d2c] hover:bg-[#7a3326] text-white" disabled={addingGuest}>
                <Plus className="w-4 h-4 mr-2" />
                {addingGuest ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            <label className="text-sm font-medium block">Importar convidados por CSV</label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => document.getElementById('rsvp-csv-input')?.click()}>
                <FileUp className="w-4 h-4 mr-2" /> Selecionar CSV
              </Button>
              <input id="rsvp-csv-input" type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFileChange} />
              <span className="text-xs text-gray-500 self-center">Colunas: nome,adultos,criancas</span>
            </div>

            <label className="text-sm font-medium block">Importação rápida (1 linha por convidado)</label>
            <Textarea
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Maria Silva;2;1"
            />
            <div>
              <Button variant="outline" onClick={importFromQuickText} disabled={!importText.trim()}>
                Revisar importação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e7d8cb]">
        <CardHeader>
          <CardTitle>Lista de convidados ({data.guests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.guests.length === 0 ? (
            <p className="text-gray-600">Nenhum convidado cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {data.guests.map((guest) => (
                <div key={guest.id} className="rounded-xl border border-[#e7d8cb] bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{guest.fullName}</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {statusLabels[guest.status]}</p>
                    <p className="text-xs text-gray-500">Limites: {guest.adultLimit} adulto(s), {guest.childLimit} criança(s)</p>
                    <p className="text-xs text-gray-500">Confirmados: {guest.confirmedAdults ?? 0} adulto(s), {guest.confirmedChildren ?? 0} criança(s)</p>
                    {guest.checkInCode && <p className="text-xs text-gray-500">Código check-in: {guest.checkInCode}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setQrGuest(guest); setOpenQr(true); }}>
                      <QrCode className="w-4 h-4 mr-1" /> QR
                    </Button>

                    <Button
                      variant={guest.checkedInAt ? 'default' : 'outline'}
                      size="sm"
                      className={guest.checkedInAt ? 'bg-[#1f8a4c] hover:bg-[#186f3c] text-white' : ''}
                      onClick={() => toggleCheckIn(guest.id, !guest.checkedInAt)}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      {guest.checkedInAt ? 'Check-in OK' : 'Marcar check-in'}
                    </Button>

                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteGuest(guest.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openImportPreview} onOpenChange={setOpenImportPreview}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar importação de convidados</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">{importGuestsPreview.length} convidado(s) pronto(s) para importar.</p>
            <div className="max-h-72 overflow-auto border border-[#e7d8cb] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#f8efe8] text-left">
                  <tr>
                    <th className="p-2">Nome</th>
                    <th className="p-2">Adultos</th>
                    <th className="p-2">Crianças</th>
                  </tr>
                </thead>
                <tbody>
                  {importGuestsPreview.slice(0, 80).map((guest, idx) => (
                    <tr key={`${guest.fullName}-${idx}`} className="border-t border-[#f1e3d6]">
                      <td className="p-2">{guest.fullName}</td>
                      <td className="p-2">{guest.adultLimit || 0}</td>
                      <td className="p-2">{guest.childLimit || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenImportPreview(false)}>
                Cancelar
              </Button>
              <Button className="bg-[#c65a3a] hover:bg-[#b34f32] text-white" onClick={() => importGuests()} disabled={importing}>
                {importing ? 'Importando...' : `Importar ${importGuestsPreview.length} convidado(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openQr} onOpenChange={setOpenQr}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do convidado</DialogTitle>
          </DialogHeader>

          {qrGuest && (
            <div className="text-center space-y-3">
              <p className="font-medium">{qrGuest.fullName}</p>
              {qrUrl ? <img src={qrUrl} alt="QR do convidado" className="mx-auto rounded-xl border border-[#e7d8cb]" /> : null}
              <p className="text-xs text-gray-500 break-all">{qrPayload}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


