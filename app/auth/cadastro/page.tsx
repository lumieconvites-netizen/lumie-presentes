'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

type Step = 'register' | 'verify';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTemplate = searchParams.get('template') || '';
  const inviteCodeFromUrl = searchParams.get('code') || '';
  const roleFromUrl = searchParams.get('tipo') === 'parceiro' ? 'PARTNER' : 'CLIENT';
  const [step, setStep] = useState<Step>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl as 'CLIENT' | 'PARTNER',
    inviteCode: inviteCodeFromUrl,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          templateSlug: selectedTemplate || undefined,
          role: formData.role,
          inviteCode: formData.inviteCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar');
      }

      toast.success('Codigo enviado para seu email.');
      setStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast.error('Digite o codigo de 6 digitos.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao confirmar email');
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.success('Email confirmado. Faca login para continuar.');
        router.push('/login');
      } else {
        toast.success('Conta confirmada com sucesso.');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reenviar codigo');
      }

      toast.success('Novo codigo enviado.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reenviar codigo');
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
              <Image src="/logo.png" alt="LUMIE" fill className="object-contain" priority />
            </div>
          </div>
          <CardTitle className="text-center font-display text-3xl text-terracota-700">Criar conta na LUMIE</CardTitle>
          <CardDescription className="text-center">
            {step === 'register'
              ? 'Comece a criar sua lista de presentes gratuitamente'
              : `Digite o codigo enviado para ${formData.email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de conta</Label>
                <select
                  id="role"
                  className="w-full border rounded-md h-10 px-3 text-sm"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'CLIENT' | 'PARTNER' })
                  }
                  disabled={isLoading}
                >
                  <option value="CLIENT">Cliente</option>
                  <option value="PARTNER">Parceiro</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode">Codigo de convite (opcional)</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Ex: PAR_ABC12345"
                  value={formData.inviteCode}
                  onChange={(e) =>
                    setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-terracota-500 hover:bg-terracota-600" disabled={isLoading}>
                {isLoading ? 'Enviando codigo...' : 'Criar conta'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo de confirmacao</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-terracota-500 hover:bg-terracota-600" disabled={isLoading}>
                {isLoading ? 'Confirmando...' : 'Confirmar email'}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={isLoading}>
                Reenviar codigo
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Ja tem uma conta? </span>
            <Link href="/login" className="text-terracota-600 hover:text-terracota-700 font-medium">
              Faca login
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar para o inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
