'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideOnTemplatePreview = /^\/templates\/[^/]+(?:\/presentes)?$/.test(pathname ?? '');

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (hideOnTemplatePreview) {
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
            <a href="/" className="relative w-16 h-8 shrink-0 pointer-events-auto">
              <Image src="/logo.png" alt="LUMIE" fill className="object-contain" />
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="/" className={linkClass('/')}>Inicio</a>
              <a href="/como-funciona" className={linkClass('/como-funciona')}>Como Funciona</a>
              <a href="/tarifas" className={linkClass('/tarifas')}>Tarifas</a>
              <a href="/templates" className={linkClass('/templates')}>Templates</a>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Entrar
            </a>

            <a
              href="/cadastro"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-terracota-500 to-terracota-700 px-5 text-sm font-medium text-white hover:from-terracota-600 hover:to-terracota-800 shadow-sm transition-colors"
            >
              Criar Conta
            </a>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <a
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-foreground border border-[#e8d8cc]"
            >
              Entrar
            </a>
            <a
              href="/cadastro"
              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-terracota-500 to-terracota-700 px-3 text-sm font-medium text-white"
            >
              Criar Conta
            </a>
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
              <a href="/" className={cn('rounded-md px-3 py-2', linkClass('/'))}>Inicio</a>
              <a href="/como-funciona" className={cn('rounded-md px-3 py-2', linkClass('/como-funciona'))}>Como Funciona</a>
              <a href="/tarifas" className={cn('rounded-md px-3 py-2', linkClass('/tarifas'))}>Tarifas</a>
              <a href="/templates" className={cn('rounded-md px-3 py-2', linkClass('/templates'))}>Templates</a>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
