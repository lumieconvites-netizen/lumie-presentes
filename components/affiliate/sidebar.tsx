'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Handshake, Shield, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AffiliateRole = 'PARTNER' | 'AMBASSADOR';

export default function AffiliateSidebar({ role }: { role: AffiliateRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const label = role === 'PARTNER' ? 'Painel Parceiro' : 'Painel Embaixador';
  const Icon = role === 'PARTNER' ? Handshake : Shield;

  const base = role === 'PARTNER' ? '/parceiro' : '/embaixador';
  const items = [
    { href: base, label: 'Visao Geral', icon: BarChart3 },
    { href: `${base}/configuracoes`, label: 'Configuracoes', icon: Settings },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed left-3 top-3 z-50 h-10 w-10 rounded-lg border border-[#e7d8cb] bg-white shadow-sm flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open ? <div className="md:hidden fixed inset-0 bg-black/35 z-40" onClick={() => setOpen(false)} /> : null}

      <aside
        className={cn(
          'bg-white border-r border-border z-50',
          'fixed inset-y-0 left-0 w-64 transition-transform md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 text-[#8E3D2C]">
            <Icon className="w-5 h-5" />
            <p className="font-medium">{label}</p>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  active ? 'bg-gradient-to-r from-terracota-500 to-terracota-700 text-white' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <ItemIcon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
