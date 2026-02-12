'use client';

import { useState, useEffect } from 'react';
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
  const { data: session, update } = useSession();

  // mostra sempre o que está no banco/session primeiro
  const [photo, setPhoto] = useState<string | undefined>(
    (session?.user as any)?.image || user?.photo
  );

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // quando session mudar (ex: depois do upload), reflete aqui
  useEffect(() => {
    const img = (session?.user as any)?.image;
    if (img) setPhoto(img);
  }, [session]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview enquanto envia
    const previewUrl = URL.createObjectURL(file);
    setPhoto(previewUrl);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data?.error ?? 'Falha ao enviar foto.');
        // volta pro que estava antes
        setPhoto((session?.user as any)?.image || user?.photo);
        return;
      }

      // URL pública (Supabase) salva no banco via route.ts
      setPhoto(data.url);

      // atualiza contexto (se você ainda usa ele em algum lugar)
      updateUser({ photo: data.url });

      // recarrega a session do NextAuth para refletir a imagem persistida
      await update();
    } catch (err) {
      console.error(err);
      alert('Erro inesperado no upload.');
      setPhoto((session?.user as any)?.image || user?.photo);
    } finally {
      // permite re-enviar o mesmo arquivo
      e.target.value = '';
    }
  };

  const handleSaveProfile = () => {
    updateUser({ name, email });
    alert('Perfil atualizado com sucesso!');
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    alert('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
                      <Image src={photo} alt="Foto de perfil" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-display">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Alterar foto</p>
                  <p className="text-sm text-gray-500">JPG, PNG ou GIF. Máx 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* resto do arquivo igual ao seu... */}
          {/* ... */}
        </TabsContent>

        {/* resto igual */}
      </Tabs>
    </div>
  );
}
