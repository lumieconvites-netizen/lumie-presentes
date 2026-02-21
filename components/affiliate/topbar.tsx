'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function AffiliateTopbar({ role }: { role: 'PARTNER' | 'AMBASSADOR' }) {
  const { data: session } = useSession();
  const name = session?.user?.name || 'Usuario';
  const title = role === 'PARTNER' ? 'Area do Parceiro' : 'Area do Embaixador';

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-display text-foreground">{title}</h1>
        <p className="text-sm text-gray-500">Acompanhe codigos, indicacoes e ganhos em tempo real</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden md:block">{name}</span>
        <Button variant="outline" asChild>
          <Link href="/">Inicio</Link>
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.assign('/login');
          }}
        >
          Sair
        </Button>
      </div>
    </header>
  );
}

