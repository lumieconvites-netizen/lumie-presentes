'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, User, DollarSign, Shield } from 'lucide-react';
import Image from 'next/image';

export default function ConfiguracoesPage() {
  const { user, updateUser, settings, updateSettings } = useUser();
  const { data: session, status, update } = useSession();

  // Fonte de verdade: session
  const sessionName = session?.user?.name ?? '';
  const sessionEmail = session?.user?.email ?? '';
  const sessionImage = (session?.user as any)?.image as string | undefined;

  // Estados do form
  const [photo, setPhoto] = useState<string | undefined>(sessionImage || user?.photo);
  const [name, setName] = useState(sessionName || user?.name || '');
  const [email, setEmail] = useState(sessionEmail || user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);

  // Sempre que session atualizar, sincroniza a UI
  useEffect(() => {
    if (sessionImage) setPhoto(sessionImage);
    if (sessionName) setName(sessionName);
    if (sessionEmail) setEmail(sessionEmail);
  }, [sessionImage, sessionName, sessionEmail]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview imediato (local)
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
        console.error('upload error:', data);
        alert(data?.error ?? 'Falha ao enviar foto.');
        setPhoto(sessionImage || user?.photo);
        return;
      }

      // URL pública do Supabase (persistida no banco)
      setPhoto(data.url);

      // mantém compat com seu context (se algum lugar usa user.photo)
      updateUser({ photo: data.url });

      // MUITO IMPORTANTE: força NextAuth buscar novamente a session (callbacks)
      await update();

      // opcional: limpa o blob antigo do preview
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error(err);
      alert('Erro inesperado no upload.');
      setPhoto(sessionImage || user?.photo);
    } finally {
      setUploading(false);
      // permite reenviar o mesmo arquivo
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Salva no banco (e session vai refletir depois do update())
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Falha ao salvar perfil.');
        return;
      }

      // atualiza a session com o novo nome
      await update();

      // mantém compat com seu context
      updateUser({ name });

      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar.');
    }
  };

  const handleChangePassword = () => {
    // Aqui você ainda não implementou backend de senha,
    // então por enquanto mantemos o comportamento atual:
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    alert('Senha alterada com sucesso! (falta implementar no backend)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Evita render esquisito enquanto session carrega
  if (status === 'loading') {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-foreground mb-2">Configurações</h1>
        <p className="text-gray-500">Gerencie suas preferências e dados da conta</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
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

        {/* PERFIL */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {photo ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={photo}
                        alt="Foto de perfil"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
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
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-1">
                    Alterar foto {uploading ? '(enviando...)' : ''}
                  </p>
                  <p className="text-sm text-gray-500">JPG, PNG ou GIF. Máx 5MB.</p>
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
                <Input value={user?.username || ''} disabled />
                <p className="text-xs text-gray-500 mt-1">
                  Seu link: lumie.com/lista/{user?.username}
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={!name || uploading}>
                Salvar Alterações
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
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nova Senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button onClick={handleChangePassword}>
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAXAS */}
        <TabsContent value="taxas">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Taxa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-foreground">Repassar taxa ao convidado</h3>
                    <p className="text-sm text-gray-500">
                      Quando ativo, o convidado paga o valor do presente + 7,99%
                    </p>
                  </div>

                  <Switch
                    checked={settings.feePassedToGuest}
                    onCheckedChange={(checked) => updateSettings({ feePassedToGuest: checked })}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemplo com presente de R$ 100,00:</p>

                  {settings.feePassedToGuest ? (
                    <div className="text-sm space-y-1">
                      <p>• Convidado paga: <strong className="text-primary">R$ 107,99</strong></p>
                      <p>• Você recebe: <strong className="text-green-600">R$ 100,00</strong></p>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p>• Convidado paga: <strong className="text-primary">R$ 100,00</strong></p>
                      <p>• Você recebe: <strong className="text-green-600">R$ 92,01</strong></p>
                      <p className="text-xs text-gray-500">Taxa de R$ 7,99 descontada</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACIDADE */}
        <TabsContent value="privacidade">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e Visibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Lista Publicada</h3>
                  <p className="text-sm text-gray-500">
                    Quando ativa, sua lista fica visível para os convidados
                  </p>
                </div>

                <Switch
                  checked={settings.published}
                  onCheckedChange={(checked) => updateSettings({ published: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Recados Públicos</h3>
                  <p className="text-sm text-gray-500">
                    Exibir recados na página pública da lista
                  </p>
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
