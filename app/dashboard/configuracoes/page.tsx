'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, User, DollarSign, Shield, Copy } from 'lucide-react';
import Image from 'next/image';

export default function ConfiguracoesPage() {
  const { user, updateUser, settings, updateSettings } = useUser();
  const { data: session, status, update } = useSession();

  const sessionName = session?.user?.name ?? '';
  const sessionEmail = session?.user?.email ?? '';
  const sessionImage = (session?.user as any)?.image as string | undefined;

  const [photo, setPhoto] = useState<string | undefined>(sessionImage || user?.photo);
  const [name, setName] = useState(sessionName || user?.name || '');
  const [email, setEmail] = useState(sessionEmail || user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingFeeMode, setSavingFeeMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [giftListId, setGiftListId] = useState('');
  const [giftListSlug, setGiftListSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [savedSlug, setSavedSlug] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState('');
  const [copyingUrl, setCopyingUrl] = useState(false);

  useEffect(() => {
    if (sessionImage) setPhoto(sessionImage);
    if (sessionName) setName(sessionName);
    if (sessionEmail) setEmail(sessionEmail);
  }, [sessionImage, sessionName, sessionEmail]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (typeof data?.name === 'string' && data.name.trim()) setName(data.name);
        if (typeof data?.email === 'string' && data.email.trim()) setEmail(data.email);
        if (typeof data?.image === 'string' && data.image.trim()) setPhoto(data.image);
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/gift-lists/my-list', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (typeof data?.id === 'string') setGiftListId(data.id);
        if (typeof data?.slug === 'string') {
          setGiftListSlug(data.slug);
          setSlugInput(data.slug);
          setSavedSlug(data.slug);
          setSlugAvailable(true);
          setSlugMessage('URL atual.');
        }
        updateSettings({ feePassedToGuest: data?.feeMode === 'PASS_TO_GUEST' });
      } catch {
        // non-blocking
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = slugInput.trim();
    if (!raw) {
      setSlugAvailable(false);
      setSlugMessage('Informe uma URL para sua lista.');
      return;
    }

    if (savedSlug && raw === savedSlug) {
      setSlugChecking(false);
      setSlugAvailable(true);
      setSlugMessage('URL atual.');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSlugChecking(true);
        const res = await fetch(`/api/gift-lists/slug-availability?slug=${encodeURIComponent(raw)}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));

        const normalized = String(data?.normalizedSlug ?? '').trim();
        if (normalized && normalized !== slugInput) {
          setSlugInput(normalized);
        }

        if (!res.ok) {
          setSlugAvailable(false);
          setSlugMessage(data?.error ?? 'Não foi possível validar a URL.');
          return;
        }

        setSlugAvailable(Boolean(data?.available));
        setSlugMessage(data?.available ? 'URL disponível.' : data?.error || 'Essa URL já esta em uso.');
      } catch {
        setSlugAvailable(false);
        setSlugMessage('Não foi possível validar a URL.');
      } finally {
        setSlugChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slugInput, savedSlug]);

  const handleFeeModeToggle = async (checked: boolean) => {
    const previous = settings.feePassedToGuest;
    updateSettings({ feePassedToGuest: checked });
    setSavingFeeMode(true);

    try {
      const res = await fetch('/api/gift-lists/my-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftListId: giftListId || undefined,
          feeMode: checked ? 'PASS_TO_GUEST' : 'ABSORB',
        }),
      });

      if (!res.ok) {
        updateSettings({ feePassedToGuest: previous });
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? 'Não foi possível salvar a configuração de taxa.');
        return;
      }
    } catch {
      updateSettings({ feePassedToGuest: previous });
      alert('Erro ao salvar configuração de taxa.');
    } finally {
      setSavingFeeMode(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhoto(previewUrl);
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? 'Falha ao enviar foto.');
        setPhoto(sessionImage || user?.photo);
        return;
      }

      const saveRes = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: data.url }),
      });
      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        alert(saveJson?.error ?? 'Falha ao salvar foto no perfil.');
        setPhoto(sessionImage || user?.photo);
        return;
      }

      setPhoto(data.url);
      updateUser({ photo: data.url });
      await update();
      URL.revokeObjectURL(previewUrl);
    } catch {
      alert('Erro inesperado no upload.');
      setPhoto(sessionImage || user?.photo);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const [profileRes, slugRes] = await Promise.all([
        fetch('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }),
        fetch('/api/gift-lists/my-list', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            giftListId: giftListId || undefined,
            slug: slugInput,
          }),
        }),
      ]);

      const profileData = await profileRes.json().catch(() => ({}));
      const slugData = await slugRes.json().catch(() => ({}));

      if (!profileRes.ok) {
        alert(profileData?.error ?? 'Falha ao salvar perfil.');
        return;
      }
      if (!slugRes.ok) {
        alert(slugData?.error ?? 'Falha ao salvar URL da lista.');
        return;
      }

      if (typeof slugData?.slug === 'string') {
        setGiftListSlug(slugData.slug);
        setSlugInput(slugData.slug);
        setSavedSlug(slugData.slug);
      }

      await update();
      updateUser({ name });
      alert('Perfil atualizado com sucesso!');
    } catch {
      alert('Erro inesperado ao salvar.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    alert('Senha alterada com sucesso! (falta implementar no backend)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const publicBase = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : 'https://lumieeventos.com'),
    []
  );
  const previewSlug = slugInput.trim() || giftListSlug;
  const publicUrl = `${publicBase}/site/${previewSlug || 'seu-slug'}`;

  const handleCopyUrl = async () => {
    try {
      setCopyingUrl(true);
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      alert('Não foi possível copiar a URL agora.');
    } finally {
      setTimeout(() => setCopyingUrl(false), 900);
    }
  };

  if (status === 'loading') {
    return <div className="p-4 md:p-6">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">Configurações</h1>
        <p className="text-gray-500">Gerencie suas preferências e dados da conta</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="perfil">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="taxas">
            <DollarSign className="w-4 h-4 mr-2" />
            Taxas
          </TabsTrigger>
          <TabsTrigger value="privacidade">
            <Shield className="w-4 h-4 mr-2" />
            Privacidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  {photo ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image src={photo} alt="Foto de perfil" fill className="object-cover" sizes="96px" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-display">
                      {(name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <label
                    className={`absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 ${
                      uploading ? 'opacity-60 pointer-events-none' : ''
                    }`}
                    title={uploading ? 'Enviando...' : 'Alterar foto'}
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">Alterar foto {uploading ? '(enviando...)' : ''}</p>
                  <p className="text-sm text-gray-500">JPG, PNG ou GIF. Max 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">E-mail</label>
                <Input type="email" value={email} disabled />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Usuário (URL)</label>
                <Input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="seu-url-da-lista"
                  disabled={savingProfile}
                />
                <p className={`text-xs mt-1 ${slugAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {slugChecking ? 'Verificando disponibilidade...' : slugMessage || 'Defina a URL da sua lista.'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Seu link: {publicUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 border-[#e3cdbf] bg-white hover:bg-[#fff7f1]"
                  onClick={handleCopyUrl}
                  disabled={slugChecking || !previewSlug}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copyingUrl ? 'Copiado!' : 'Copiar URL'}
                </Button>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={!name || uploading || savingProfile || slugChecking || !slugAvailable}
                className="w-full sm:w-auto"
              >
                {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Senha Atual</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nova Senha</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confirmar Nova Senha</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <Button onClick={handleChangePassword} className="w-full sm:w-auto">Alterar Senha</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Taxa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-medium text-foreground">Repassar taxa ao convidado</h3>
                    <p className="text-sm text-gray-500">Quando ativo, o convidado paga o valor do presente + taxa do seu plano.</p>
                  </div>

                  <Switch
                    checked={settings.feePassedToGuest}
                    onCheckedChange={handleFeeModeToggle}
                    disabled={savingFeeMode}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemplo com presente de R$ 100,00:</p>

                  {settings.feePassedToGuest ? (
                    <div className="text-sm space-y-1">
                      <p>- Convidado paga: <strong className="text-primary">R$ 107,99</strong></p>
                      <p>- Você recebe: <strong className="text-green-600">R$ 100,00</strong></p>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p>- Convidado paga: <strong className="text-primary">R$ 100,00</strong></p>
                      <p>- Você recebe: <strong className="text-green-600">R$ 93,01</strong></p>
                      <p className="text-xs text-gray-500">Exemplo com taxa do plano gratuito no PIX</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacidade">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e Visibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">Recados Públicos</h3>
                  <p className="text-sm text-gray-500">Exibir recados na página pública da lista</p>
                </div>

                <Switch
                  checked={settings.messagesPublic}
                  onCheckedChange={(checked) => updateSettings({ messagesPublic: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
