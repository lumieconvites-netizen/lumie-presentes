'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Blocks, CreditCard, LayoutTemplate, ShieldBan, Sparkles, ClipboardList, Gift } from 'lucide-react';

const items = [
  { href: '/admin', label: 'Geral', icon: Blocks },
  { href: '/admin/financeiro', label: 'Financeiro', icon: CreditCard },
  { href: '/admin/bloqueados', label: 'Bloqueados', icon: ShieldBan },
  { href: '/admin/retencao', label: 'Retencao', icon: ClipboardList },
  { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/admin/lista-presentes', label: 'Lista de presentes', icon: Gift },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-[#E9D8C8] bg-white/90 backdrop-blur-sm">
      <div className="px-5 py-5 border-b border-[#E9D8C8]">
        <p className="text-xs uppercase tracking-wide text-[#8E3D2C]/70">Painel</p>
        <h2 className="font-display text-2xl text-[#8E3D2C] flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Admin LUMIE
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
  );
}
