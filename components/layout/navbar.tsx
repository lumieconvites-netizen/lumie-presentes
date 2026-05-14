'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const sessionName = session?.user?.name || session?.user?.email || 'Usuário';
  const sessionImage = (session?.user as any)?.image as string | null | undefined;
  const initials = sessionName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
  const hideOnTemplatePreview = /^\/templates\/[^/]+(?:\/presentes)?$/.test(pathname ?? '');
  const hideOnTemplatesWhenLogged = (pathname ?? '') === '/templates' && status === 'authenticated';

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  if (hideOnTemplatePreview || hideOnTemplatesWhenLogged) {
    return null;
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : (pathname ?? '').startsWith(href);

  const linkClass = (href: string) =>
    cn(
      'pointer-events-auto hover:text-primary transition-colors',
      isActive(href) ? 'text-primary font-medium' : 'text-foreground'
    );

  return (
    <nav className="relative z-50 bg-white border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-12">
            <Link href="/" className="relative w-16 h-8 shrink-0 pointer-events-auto">
              <Image src="/logo.png" alt="LUMIE" fill className="object-contain" />
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <Link href="/" className={linkClass('/')}>Inicio</Link>
              <Link href="/como-funciona" className={linkClass('/como-funciona')}>Como Funciona</Link>
              <Link href="/tarifas" className={linkClass('/tarifas')}>Planos</Link>
              <Link href="/templates" className={linkClass('/templates')}>Templates</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {status === 'authenticated' ? (
              <Link
                href="/dashboard"
                className="pointer-events-auto inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#ead9cd] bg-white py-1 pl-1 pr-4 text-sm font-semibold text-[#4f3f38] shadow-sm transition hover:border-[#d8a18b] hover:bg-[#fff8f4] hover:text-[#8e3d2c]"
                onClick={() => setNavigating(true)}
                aria-label="Voltar para o dashboard"
                title="Voltar para o dashboard"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c65a3a] text-xs font-semibold text-white">
                  {sessionImage ? (
                    <Image src={sessionImage} alt={sessionName} width={32} height={32} className="h-8 w-8 object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                Meu painel
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setNavigating(true)}
                >
                  Entrar
                </Link>

                <Link
                  href="/auth/cadastro"
                  className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-terracota-500 to-terracota-700 px-5 text-sm font-medium text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm transition-colors"
                  onClick={() => setNavigating(true)}
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {status === 'authenticated' ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#ead9cd] bg-white py-1 pl-1 pr-3 text-xs font-semibold text-[#4f3f38]"
                onClick={() => setNavigating(true)}
                aria-label="Voltar para o dashboard"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c65a3a] text-[10px] font-semibold text-white">
                  {sessionImage ? (
                    <Image src={sessionImage} alt={sessionName} width={28} height={28} className="h-7 w-7 object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                Painel
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-foreground border border-[#e8d8cc]"
                  onClick={() => setNavigating(true)}
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/cadastro"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-terracota-500 to-terracota-700 px-3 text-sm font-medium text-white"
                  onClick={() => setNavigating(true)}
                >
                  Criar Conta
                </Link>
              </>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e8d8cc]"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menu"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="md:hidden mt-3 rounded-xl border border-[#ead9cd] bg-white p-3 shadow-sm">
            <div className="flex flex-col text-sm">
              <Link href="/" className={cn('rounded-md px-3 py-2', linkClass('/'))}>Inicio</Link>
              <Link href="/como-funciona" className={cn('rounded-md px-3 py-2', linkClass('/como-funciona'))}>Como Funciona</Link>
              <Link href="/tarifas" className={cn('rounded-md px-3 py-2', linkClass('/tarifas'))}>Planos</Link>
              <Link href="/templates" className={cn('rounded-md px-3 py-2', linkClass('/templates'))}>Templates</Link>
            </div>
          </div>
        ) : null}
      </div>

      {navigating ? (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="rounded-xl border border-[#ead9cd] bg-white px-5 py-3 text-sm font-medium text-[#4a3a33] shadow-sm">
            Carregando...
          </div>
        </div>
      ) : null}
    </nav>
  );
}
