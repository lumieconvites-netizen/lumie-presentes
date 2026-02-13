'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string) =>
    `hover:text-primary transition-colors ${
      isActive(href) ? 'text-primary font-medium' : 'text-foreground'
    }`;

  return (
    <nav className="bg-white border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="relative w-16 h-8 shrink-0">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" priority />
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm">
              <Link href="/" className={linkClass('/')}>
                Início
              </Link>
              <Link href="/como-funciona" className={linkClass('/como-funciona')}>
                Como Funciona
              </Link>
              <Link href="/tarifas" className={linkClass('/tarifas')}>
                Tarifas
              </Link>
              <Link href="/templates" className={linkClass('/templates')}>
                Templates
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-foreground">
              <Link href="/login">Entrar</Link>
            </Button>

            <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full">
              <Link href="/cadastro">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
