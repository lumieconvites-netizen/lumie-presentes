'use client';

import Link from 'next/link';
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
            <Link href="/" className="relative w-16 h-8 shrink-0">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" />
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <Link href="/" className={linkClass('/')}>Início</Link>
              <Link href="/como-funciona" className={linkClass('/como-funciona')}>Como Funciona</Link>
              <Link href="/tarifas" className={linkClass('/tarifas')}>Tarifas</Link>
              <Link href="/templates" className={linkClass('/templates')}>Templates</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
