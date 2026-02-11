'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Gift,
  MessageSquare,
  CreditCard,
  Settings,
  Palette,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/presentes', label: 'Presentes', icon: Gift },
  { href: '/dashboard/editor', label: 'Editor de Página', icon: Palette },
  { href: '/dashboard/recados', label: 'Recados', icon: MessageSquare },
  { href: '/dashboard/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-20 h-10">
            <Image
              src="/logo.png"
              alt="LUMIÊ"
              fill
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/dashboard/preview"
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver Minha Lista
        </Link>
      </div>
    </aside>
  );
}
