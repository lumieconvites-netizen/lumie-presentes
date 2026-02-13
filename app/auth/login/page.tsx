'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        toast.error('Falha ao autenticar. Tente novamente.');
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

 if (result.ok) {
  toast.success('Login realizado com sucesso!');
  // ✅ hard redirect: garante que cookie foi aplicado e o server “vê” a sessão
  window.location.assign(result.url || callbackUrl);
  return;
}


      toast.error('Não foi possível entrar. Verifique seus dados.');
    } catch (err) {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-terracota-50 via-white to-gold-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="relative w-48 h-24">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" priority />
            </div>
          </div>

          <CardTitle className="text-center font-display text-3xl text-terracota-700">
            Entrar na LUMIÊ
          </CardTitle>

          <CardDescription className="text-center">
            Acesse sua conta para gerenciar suas listas
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>

                {/* ✅ evita 404; crie a rota depois, mas por agora não quebra */}
                <Link
                  href="/recuperar-senha"
                  className="text-sm text-terracota-600 hover:text-terracota-700"
                >
                  Esqueceu?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-terracota-500 hover:bg-terracota-600"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link
              href="/cadastro"
              className="text-terracota-600 hover:text-terracota-700 font-medium"
            >
              Cadastre-se gratuitamente
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voltar para o início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
