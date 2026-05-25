'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

type Step = 'register' | 'verify';

const LAST_ACTIVITY_KEY = 'lumie:last-activity-at';

function refreshSessionActivity() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function isValidCpf(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (const n of base) total += Number(n) * factor--;
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(digits.slice(0, 9), 10) === Number(digits[9]) &&
    calc(digits.slice(0, 10), 11) === Number(digits[10]);
}

function validatePassword(password: string, email: string, name: string) {
  const errors: string[] = [];
  const normalized = password.toLowerCase();
  const emailUser = email.trim().toLowerCase().split('@')[0] ?? '';
  const nameParts = name.toLowerCase().split(/\s+/).filter((part) => part.length >= 3);

  if (password.length < 8) errors.push('8 caracteres');
  if (!/[a-z]/.test(password)) errors.push('letra minúscula');
  if (!/[A-Z]/.test(password)) errors.push('letra maiúscula');
  if (!/\d/.test(password)) errors.push('número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('símbolo');
  if (['12345678', '123456789', 'senha123', 'senha1234', 'password1'].includes(normalized)) {
    errors.push('não ser comum');
  }
  if ('0123456789'.includes(password.replace(/\D/g, '')) || '9876543210'.includes(password.replace(/\D/g, ''))) {
    errors.push('sem sequência numérica');
  }
  if (emailUser.length >= 4 && normalized.includes(emailUser)) errors.push('não conter email');
  if (nameParts.some((part) => normalized.includes(part))) errors.push('não conter nome');

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTemplate = searchParams.get('template') || '';
  const inviteCodeFromUrl = searchParams.get('code') || '';
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const isPartnerMode = searchParams.get('tipo') === 'parceiro';
  const roleFromUrl = isPartnerMode ? 'PARTNER' : 'CLIENT';
  const [step, setStep] = useState<Step>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    document: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl as 'CLIENT' | 'PARTNER',
    inviteCode: inviteCodeFromUrl,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!isValidCpf(formData.document)) {
      toast.error('Digite um CPF válido');
      return;
    }

    const passwordErrors = validatePassword(formData.password, formData.email, formData.name);
    if (passwordErrors.length) {
      toast.error(`A senha deve conter: ${passwordErrors.join(', ')}`);
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
          document: formData.document,
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

      toast.success('Código enviado para seu e-mail.');
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
      toast.error('Digite o código de 6 dígitos.');
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
        callbackUrl,
      });

      if (result?.error) {
        toast.success('E-mail confirmado. Faça login para continuar.');
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else {
        refreshSessionActivity();
        toast.success('Conta confirmada com sucesso.');
        router.push(callbackUrl);
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
        throw new Error(data.error || 'Erro ao reenviar código');
      }

      toast.success('Novo código enviado.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reenviar código');
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
          <CardTitle className="text-center font-display text-2xl md:text-3xl text-terracota-700">
            {isPartnerMode ? 'Criar conta de Parceiro' : 'Criar conta na LUMIÊ'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'register'
              ? isPartnerMode
                ? 'Crie sua conta de parceiro e ganhe comissões por indicação.'
                : 'Comece a criar sua lista de presentes gratuitamente'
              : `Digite o código enviado para ${formData.email}`}
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
                <Label htmlFor="document">CPF</Label>
                <Input
                  id="document"
                  type="text"
                  inputMode="numeric"
                  placeholder="Somente números"
                  value={formData.document}
                  onChange={(e) =>
                    setFormData({ ...formData, document: e.target.value.replace(/\D/g, '').slice(0, 11) })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8, com número e símbolo"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode">
                  {isPartnerMode
                    ? 'Código do embaixador (opcional)'
                    : 'Código de convite (opcional)'}
                </Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder={isPartnerMode ? 'Ex: AMBPAR_ABC12345' : 'Ex: PAR_ABC12345'}
                  value={formData.inviteCode}
                  onChange={(e) =>
                    setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })
                  }
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-terracota-500 to-terracota-700 hover:from-terracota-600 hover:to-terracota-800 shadow-sm" disabled={isLoading}>
                {isLoading ? 'Enviando código...' : isPartnerMode ? 'Criar conta de Parceiro' : 'Criar conta'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de confirmação</Label>
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

              <Button type="submit" className="w-full bg-gradient-to-r from-terracota-500 to-terracota-700 hover:from-terracota-600 hover:to-terracota-800 shadow-sm" disabled={isLoading}>
                {isLoading ? 'Confirmando...' : 'Confirmar email'}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={isLoading}>
                Reenviar código
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-terracota-600 hover:text-terracota-700 font-medium"
            >
              Faça login
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar para o início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

