'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function PublicHeader() {
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-terracota-100 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-28">
            <Image src="/logo.png" alt="LUMIE" fill className="object-contain" priority />
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-terracota-800 md:flex">
          <Link href="/" className="hover:text-terracota-600">
            Inicio
          </Link>
          <Link href="/como-funciona" className="hover:text-terracota-600">
            Como Funciona
          </Link>
          <Link href="/tarifas" className="hover:text-terracota-600">
            Planos
          </Link>
          <Link href="/templates" className="hover:text-terracota-600">
            Templates
          </Link>
        </nav>

        {status === 'authenticated' ? (
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-terracota-200 text-terracota-800 hover:bg-terracota-50"
            aria-label="Voltar para o dashboard"
            title="Voltar para o dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-xl border border-terracota-200 px-4 py-2 text-sm text-terracota-800 hover:bg-terracota-50"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
