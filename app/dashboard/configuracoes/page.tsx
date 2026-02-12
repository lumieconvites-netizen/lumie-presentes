'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, User, DollarSign, Shield } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ConfiguracoesPage() {
  const { data: session } = useSession();

  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    alert('Perfil atualizado!');
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    alert('Senha alterada (implementar backend depois)');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display mb-2">Configurações</h1>
        <p className="text-gray-500">Gerencie sua conta</p>
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
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">E-mail</label>
                <Input value={email} disabled />
              </div>

              <Button onClick={handleSaveProfile}>
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

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
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Repassar taxa ao convidado</span>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACIDADE */}
        <TabsContent value="privacidade">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Lista publicada</span>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
