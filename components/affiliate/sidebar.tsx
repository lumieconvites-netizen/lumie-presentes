'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Handshake, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type AffiliateRole = 'PARTNER' | 'AMBASSADOR';

export default function AffiliateSidebar({ role }: { role: AffiliateRole }) {
  const pathname = usePathname();
  const label = role === 'PARTNER' ? 'Painel Parceiro' : 'Painel Embaixador';
  const Icon = role === 'PARTNER' ? Handshake : Shield;

  const items = [{ href: role === 'PARTNER' ? '/parceiro' : '/embaixador', label: 'Visao Geral', icon: BarChart3 }];

  return (
    <aside className="w-64 bg-white border-r border-border min-h-screen">
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
  );
}
