'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : (pathname ?? '').startsWith(href);

  const linkClass = (href: string) =>
    cn(
      'pointer-events-auto hover:text-primary transition-colors',
      isActive(href) ? 'text-primary font-medium' : 'text-foreground'
    );

  return (
    <nav className="relative z-50 bg-white border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href="/" className="relative w-16 h-8 shrink-0 pointer-events-auto">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" />
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="/" className={linkClass('/')}>Início</a>
              <a href="/como-funciona" className={linkClass('/como-funciona')}>Como Funciona</a>
              <a href="/tarifas" className={linkClass('/tarifas')}>Tarifas</a>
              <a href="/templates" className={linkClass('/templates')}>Templates</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Entrar
            </a>

            <a
              href="/cadastro"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Criar Conta
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
