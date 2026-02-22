'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

type ImpersonationData = {
  isImpersonating: boolean;
  effectiveUser?: {
    name: string | null;
    email: string;
    role: string;
  };
};

export default function AffiliateTopbar({ role }: { role: 'PARTNER' | 'AMBASSADOR' }) {
  const { data: session } = useSession();
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const sessionRole = (session?.user as any)?.role;
  const name = session?.user?.name || 'Usuario';
  const title = role === 'PARTNER' ? 'Area do Parceiro' : 'Area do Embaixador';
  const base = role === 'PARTNER' ? '/parceiro' : '/embaixador';
  const displayName =
    sessionRole === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.name || 'Usuario'
      : name;

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
      alert('Nao foi possivel sair do modo acesso.');
      return;
    }
    window.location.assign('/admin');
  }

  return (
    <header className="bg-white border-b border-border px-6 py-4 space-y-3">
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
              Sair do modo acesso
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">{title}</h1>
          <p className="text-sm text-gray-500">Acompanhe codigos, indicacoes e ganhos em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden md:block">{displayName}</span>
          <Button variant="outline" asChild>
            <Link href={`${base}/configuracoes`}>Configuracoes</Link>
          </Button>
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
      </div>
    </header>
  );
}

