'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ImpersonationData = {
  isImpersonating: boolean;
  effectiveUser?: {
    name: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
};

export default function AffiliateTopbar({ role }: { role: 'PARTNER' | 'AMBASSADOR' }) {
  const { data: session } = useSession();
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  const sessionRole = (session?.user as any)?.role;
  const name = session?.user?.name || 'UsuÃ¡rio';
  const email = session?.user?.email || '';
  const sessionImage = (session?.user as any)?.image as string | undefined;

  const title = role === 'PARTNER' ? 'Ãrea do Parceiro' : 'Ãrea do Embaixador';
  const base = role === 'PARTNER' ? '/parceiro' : '/embaixador';

  const displayName =
    sessionRole === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.name || 'UsuÃ¡rio'
      : name;
  const displayEmail =
    sessionRole === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.email || ''
      : email;
  const avatarSrc =
    sessionRole === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.image || undefined
      : sessionImage;

  const getUserInitials = (value: string) =>
    value
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    if (sessionRole !== 'ADMIN') return;
    fetch('/api/admin/impersonation', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setImpersonation(data))
      .catch(() => null);
  }, [sessionRole]);

  async function stopImpersonation() {
    const res = await fetch('/api/admin/impersonation', { method: 'DELETE' });
    if (!res.ok) {
      alert('NÃ£o foi possÃ­vel sair do modo de acesso.');
      return;
    }
    window.location.assign('/admin');
  }

  return (
    <header className="bg-white border-b border-border px-4 md:px-6 py-4 space-y-3">
      {sessionRole === 'ADMIN' && impersonation?.isImpersonating ? (
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
        <div className="pl-14 md:pl-0">
          <h1 className="text-xl md:text-2xl font-display text-foreground">{title}</h1>
          <p className="text-xs md:text-sm text-gray-500">Acompanhe cÃ³digos, indicaÃ§Ãµes e ganhos em tempo real</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden ring-1 ring-border">
              {avatarSrc ? (
                <Image src={avatarSrc} alt={displayName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {getUserInitials(displayName)}
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
              <Link href={`${base}/configuracoes`} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                ConfiguraÃ§Ãµes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={base} className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Meu Painel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut({ redirect: false });
                window.location.assign('/login');
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
