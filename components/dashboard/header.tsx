'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, LayoutDashboard, LogOut, Settings, Shield, Sparkles } from 'lucide-react';

type ImpersonationData = {
  isImpersonating: boolean;
  effectiveUser?: {
    name: string | null;
    email: string;
    role: string;
  };
};

export default function DashboardHeader() {
  const { user } = useUser();
  const { data: session } = useSession();
  const router = useRouter();

  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const [siteSlug, setSiteSlug] = useState('');

  const sessionImage = (session?.user as any)?.image as string | undefined;
  const sessionName = session?.user?.name ?? user?.name ?? 'Usuário';
  const sessionEmail = session?.user?.email ?? user?.email ?? '';
  const avatarSrc = sessionImage || user?.photo;
  const role = (session?.user as any)?.role;

  const displayName =
    role === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.name || 'Usuário'
      : sessionName;
  const displayEmail =
    role === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.email || ''
      : sessionEmail;
  const firstName = displayName.split(' ')[0];

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    fetch('/api/admin/impersonation', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setImpersonation(data))
      .catch(() => null);
  }, [role]);

  useEffect(() => {
    fetch('/api/gift-lists/my-list', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.slug) setSiteSlug(String(data.slug));
      })
      .catch(() => null);
  }, []);

  async function stopImpersonation() {
    const res = await fetch('/api/admin/impersonation', { method: 'DELETE' });
    if (!res.ok) {
      alert('Não foi possível sair do modo de acesso.');
      return;
    }
    window.location.assign('/admin');
  }

  return (
    <header className="bg-white border-b border-border px-4 md:px-6 py-4 space-y-3">
      {role === 'ADMIN' && impersonation?.isImpersonating ? (
        <div className="rounded-lg border border-[#E9D8C8] bg-[#fff7f1] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs md:text-sm text-[#8E3D2C]">
            Acessando como: {impersonation.effectiveUser?.name || 'Sem nome'} ({impersonation.effectiveUser?.email}) - {impersonation.effectiveUser?.role}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin">Voltar ao admin</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => stopImpersonation().catch(() => null)}>
              Sair do modo de acesso
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="pl-16 md:pl-0">
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <span>Olá, {firstName}!</span>
            <Sparkles className="h-4 w-4 text-[#c65a3a]" />
          </h1>
          <p className="text-sm text-gray-500">Veja como está indo sua lista de presentes</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden ring-1 ring-border">
              {avatarSrc ? (
                <Image src={avatarSrc} alt={sessionName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {getUserInitials(sessionName)}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Meu Painel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={siteSlug ? `/site/${encodeURIComponent(siteSlug)}` : '/site'} className="cursor-pointer">
                <Globe className="w-4 h-4 mr-2" />
                Ver Site
              </Link>
            </DropdownMenuItem>
            {role === 'ADMIN' ? (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Shield className="w-4 h-4 mr-2" />
                  Painel Admin
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut({ redirect: false });
                router.push('/login');
                router.refresh();
              }}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
