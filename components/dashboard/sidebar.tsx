'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Gift,
  MessageSquare,
  CreditCard,
  Settings,
  Palette,
  Landmark,
  CalendarCheck,
  BookOpen,
  Globe2,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/presentes', label: 'Presentes', icon: Gift },
  { href: '/dashboard/editor', label: 'Editor de Página', icon: Palette },
  { href: '/dashboard/rsvp', label: 'RSVP (Confirmar Presença)', icon: CalendarCheck },
  { href: '/dashboard/recados', label: 'Recados', icon: MessageSquare },
  { href: '/dashboard/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/dashboard/banco', label: 'Conta Bancária', icon: Landmark },
  { href: '/dashboard/dominio', label: 'Domínio', icon: Globe2 },
  { href: '/dashboard/tutoriais', label: 'Tutoriais', icon: BookOpen },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings },
];

function SidebarNav({
  pathname,
  onNavigate,
  limitedMode,
  canViewBankInLimitedMode,
  canViewSettingsInLimitedMode,
  showDomainItem,
}: {
  pathname: string;
  onNavigate?: () => void;
  limitedMode?: boolean;
  canViewBankInLimitedMode?: boolean;
  canViewSettingsInLimitedMode?: boolean;
  showDomainItem?: boolean;
}) {
  const visibleItems = menuItems.filter((item) => showDomainItem || item.href !== '/dashboard/dominio');
  const limitedItems = menuItems.filter((item) =>
    ['/dashboard/presentes', '/dashboard/editor', '/dashboard/rsvp'].includes(item.href) ||
    (canViewBankInLimitedMode && item.href === '/dashboard/banco') ||
    (canViewSettingsInLimitedMode && item.href === '/dashboard/configuracoes')
  );
  const items = limitedMode ? limitedItems : visibleItems;
  return (
    <nav className="flex-1 p-4 space-y-1">
      {items.map((item) => {
        const isDashboardRoot = item.href === '/dashboard';
        const isActive = isDashboardRoot
          ? pathname === '/dashboard'
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all',
              isActive
                ? 'bg-gradient-to-r from-terracota-500 to-terracota-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardSidebar({
  limitedMode = false,
  canViewBankInLimitedMode = false,
  canViewSettingsInLimitedMode = false,
  showDomainItem = true,
}: {
  limitedMode?: boolean;
  canViewBankInLimitedMode?: boolean;
  canViewSettingsInLimitedMode?: boolean;
  showDomainItem?: boolean;
}) {
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
        aria-label="Abrir menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-black/35 z-40" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'bg-white border-r border-border flex flex-col z-50',
          'fixed inset-y-0 left-0 w-[42vw] min-w-[190px] max-w-[260px] transition-transform md:static md:w-64 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-border">
          <Link href={limitedMode ? '/dashboard/presentes' : '/dashboard'} className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="relative w-20 h-10">
              <Image src="/logo.png" alt="LUMIÊ" fill className="object-contain" />
            </div>
          </Link>
        </div>

        <SidebarNav
          pathname={pathname}
          onNavigate={() => setOpen(false)}
          limitedMode={limitedMode}
          canViewBankInLimitedMode={canViewBankInLimitedMode}
          canViewSettingsInLimitedMode={canViewSettingsInLimitedMode}
          showDomainItem={showDomainItem}
        />
      </aside>
    </>
  );
}

