'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

function initials(name?: string | null) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? 'U';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export default function PublicHeader() {
  // ✅ AQUI É O “DENTRO DO COMPONENTE”
  const { data: session, status } = useSession();

  // dropdown
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const name = session?.user?.name ?? 'Minha conta';
  const image = (session?.user as any)?.image as string | undefined;

  return (
<header className="sticky top-0 z-50 bg-white border-b border-terracota-100">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-28 h-10">
            <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" priority />
          </div>
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-terracota-800">
          <Link href="/" className="hover:text-terracota-600">Início</Link>
          <Link href="/como-funciona" className="hover:text-terracota-600">Como Funciona</Link>
          <Link href="/tarifas" className="hover:text-terracota-600">Tarifas</Link>
          <Link href="/templates" className="hover:text-terracota-600">Templates</Link>
        </nav>

        {/* Direita: Entrar OU Avatar */}
        {status !== 'authenticated' ? (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm border border-terracota-200 text-terracota-800 hover:bg-terracota-50"
          >
            Entrar
          </Link>
        ) : (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-terracota-200 px-3 py-1.5 hover:bg-terracota-50"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-terracota-200 text-terracota-900 flex items-center justify-center text-xs font-semibold">
                  {initials(name)}
                </div>
              )}
              <span className="hidden sm:block text-sm text-terracota-900">{name}</span>
              <span className="text-terracota-700 text-xs">▾</span>
            </button>

            {open && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-terracota-100 bg-white shadow-lg overflow-hidden z-50">
           <div className="px-4 py-3 text-xs text-terracota-500">
           Conta
          </div>

          <Link
           href="/dashboard"
           className="block px-4 py-2 text-sm text-terracota-900 hover:bg-terracota-50"
           onClick={() => setOpen(false)}
           >
           Meu painel
           </Link>

           <Link
           href="/dashboard/configuracoes"
           className="block px-4 py-2 text-sm text-terracota-900 hover:bg-terracota-50"
           onClick={() => setOpen(false)}
           >
           Configurações
           </Link>

           <div className="border-t border-terracota-100 my-1" />

           <button
           className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
           onClick={() => signOut({ callbackUrl: '/' })}
           >
            Sair
           </button>
           </div>
          )}
          </div>
        )}
      </div>
    </header>
  );
}
