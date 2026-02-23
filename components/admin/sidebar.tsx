'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Blocks, CreditCard, LayoutTemplate, ShieldBan, Sparkles, ClipboardList, Gift, Menu, X } from 'lucide-react';

const items = [
  { href: '/admin', label: 'Geral', icon: Blocks },
  { href: '/admin/financeiro', label: 'Financeiro', icon: CreditCard },
  { href: '/admin/bloqueados', label: 'Bloqueados', icon: ShieldBan },
  { href: '/admin/retencao', label: 'Retenção', icon: ClipboardList },
  { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/admin/lista-presentes', label: 'Lista de presentes', icon: Gift },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed left-3 top-3 z-50 h-10 w-10 rounded-lg border border-[#e7d8cb] bg-white shadow-sm flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu do admin"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? <div className="md:hidden fixed inset-0 bg-black/35 z-40" onClick={() => setOpen(false)} /> : null}

      <aside
        className={cn(
          'border-r border-[#E9D8C8] bg-white/95 backdrop-blur-sm z-50',
          'fixed inset-y-0 left-0 w-[42vw] min-w-[190px] max-w-[260px] transition-transform md:static md:w-72 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="px-5 py-5 border-b border-[#E9D8C8]">
          <p className="text-xs uppercase tracking-wide text-[#8E3D2C]/70">Painel</p>
          <h2 className="font-display text-2xl text-[#8E3D2C] flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Admin LUMIÊ
          </h2>
        </div>

        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-gradient-to-r from-terracota-500 to-terracota-700 text-white'
                    : 'text-[#5f4a41] hover:bg-[#FAF4EF]'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
