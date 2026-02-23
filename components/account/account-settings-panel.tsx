'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type UserMe = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
};

type BankAccountForm = {
  holderName: string;
  holderDocument: string;
  bankCode: string;
  agency: string;
  agencyDigit: string;
  accountNumber: string;
  accountDigit: string;
  accountType: 'conta_corrente' | 'conta_poupanca';
};

const emptyBank: BankAccountForm = {
  holderName: '',
  holderDocument: '',
  bankCode: '',
  agency: '',
  agencyDigit: '',
  accountNumber: '',
  accountDigit: '',
  accountType: 'conta_corrente',
};

export default function AccountSettingsPanel({
  title,
  subtitle,
  showBankSection,
  profileScope = 'effective',
}: {
  title: string;
  subtitle: string;
  showBankSection: boolean;
  profileScope?: 'effective' | 'session';
}) {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bankStatus, setBankStatus] = useState<string | null>(null);

  const [me, setMe] = useState<UserMe | null>(null);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [bank, setBank] = useState<BankAccountForm>(emptyBank);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const meUrl = profileScope === 'session' ? '/api/me?scope=session' : '/api/me';
        const meRequest = fetch(meUrl, { cache: 'no-store' });
        const bankRequest = showBankSection
          ? fetch('/api/recipient/bank-account', { cache: 'no-store' })
          : Promise.resolve(null);

        const [meRes, bankRes] = await Promise.all([meRequest, bankRequest]);
        const meData = await meRes.json().catch(() => null);
        if (!meRes.ok) throw new Error(meData?.error ?? 'Erro ao carregar conta.');

        if (!cancelled) {
          setMe(meData);
          setName(meData?.name || '');
          setPhoto(meData?.image || '');
        }

        if (showBankSection && bankRes) {
          const bankData = await bankRes.json().catch(() => null);
          if (bankRes.ok && bankData?.recipient?.bankAccount) {
            const account = bankData.recipient.bankAccount as Partial<BankAccountForm>;
            if (!cancelled) {
              setBank({
                holderName: account.holderName ?? '',
                holderDocument: account.holderDocument ?? '',
                bankCode: account.bankCode ?? '',
                agency: account.agency ?? '',
                agencyDigit: account.agencyDigit ?? '',
                accountNumber: account.accountNumber ?? '',
                accountDigit: account.accountDigit ?? '',
                accountType: account.accountType === 'conta_poupanca' ? 'conta_poupanca' : 'conta_corrente',
              });
              setBankStatus(bankData?.recipient?.status ?? null);
            }
          }
        }
      } catch (error: any) {
        if (!cancelled) alert(error?.message ?? 'Erro ao carregar configuracoes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [showBankSection, profileScope]);

  async function handlePhotoUpload(file?: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem maior que 5MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'profile');
      const uploadRes = await fetch('/api/upload/avatar', { method: 'POST', body: form });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok || !uploadData?.url) throw new Error(uploadData?.error ?? 'Falha no upload');
      setPhoto(uploadData.url as string);
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao enviar foto.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);
      const profileUrl = profileScope === 'session' ? '/api/me?scope=session' : '/api/me';
      const res = await fetch(profileUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          image: photo || '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao salvar perfil.');
      setMe(data);
      alert('Perfil atualizado.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao salvar perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveBank() {
    try {
      setSavingBank(true);
      const res = await fetch('/api/recipient/bank-account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bank),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao salvar dados bancarios.');
      setBankStatus(data?.recipient?.status ?? 'pending');
      alert(data?.warning ?? data?.message ?? 'Dados bancarios salvos.');
    } catch (error: any) {
      alert(error?.message ?? 'Erro ao salvar dados bancarios.');
    } finally {
      setSavingBank(false);
    }
  }

  if (loading) return <div className="p-4 md:p-6">Carregando configuracoes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              {photo ? <img src={photo} alt="Foto de perfil" className="h-full w-full object-cover" /> : null}
            </div>
            <label className="inline-flex h-10 items-center px-4 rounded-md border cursor-pointer text-sm">
              {uploadingPhoto ? 'Enviando foto...' : 'Enviar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} disabled={uploadingPhoto} />
            </label>
            <p className="text-xs text-gray-500">JPG/PNG, at? 5MB.</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input value={me?.email || ''} readOnly />
          </div>

          <Button className="w-full sm:w-auto" onClick={() => saveProfile()} disabled={savingProfile || uploadingPhoto}>
            {savingProfile ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </CardContent>
      </Card>

      {showBankSection ? (
        <Card>
          <CardHeader>
            <CardTitle>Conta bancaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Titular</label>
              <Input value={bank.holderName} onChange={(e) => setBank((p) => ({ ...p, holderName: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">CPF/CNPJ</label>
              <Input value={bank.holderDocument} onChange={(e) => setBank((p) => ({ ...p, holderDocument: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">C?digo banco</label>
                <Input value={bank.bankCode} onChange={(e) => setBank((p) => ({ ...p, bankCode: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Agencia</label>
                <Input value={bank.agency} onChange={(e) => setBank((p) => ({ ...p, agency: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Digito agencia</label>
                <Input value={bank.agencyDigit} onChange={(e) => setBank((p) => ({ ...p, agencyDigit: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Conta</label>
                <Input value={bank.accountNumber} onChange={(e) => setBank((p) => ({ ...p, accountNumber: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Digito conta</label>
                <Input value={bank.accountDigit} onChange={(e) => setBank((p) => ({ ...p, accountDigit: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <select
                  className="w-full border rounded-md h-10 px-3 text-sm"
                  value={bank.accountType}
                  onChange={(e) =>
                    setBank((p) => ({
                      ...p,
                      accountType: e.target.value === 'conta_poupanca' ? 'conta_poupanca' : 'conta_corrente',
                    }))
                  }
                >
                  <option value="conta_corrente">Conta corrente</option>
                  <option value="conta_poupanca">Conta poupanca</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Status atual de valida??o: <b>{bankStatus ?? 'n?o enviado'}</b>
            </p>

            <Button className="w-full sm:w-auto" onClick={() => saveBank()} disabled={savingBank}>
              {savingBank ? 'Salvando...' : 'Salvar conta bancaria'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
