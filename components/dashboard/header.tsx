'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Globe, LayoutDashboard, LogOut, Settings, Shield, Sparkles, X } from 'lucide-react';

type ImpersonationData = {
  isImpersonating: boolean;
  sessionUserRole?: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
  effectiveUser?: {
    name: string | null;
    email: string;
    role: string;
  };
};

type DashboardHeaderProps = {
  limitedMode?: boolean;
  sessionUserRole?: 'ADMIN' | 'CLIENT' | 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE';
  initialSiteSlug?: string;
};

type NotificationSummary = {
  unreadCount: number;
  latestEventAt: string | null;
  events: Array<{
    id: string;
    type: 'payment' | 'message' | 'rsvp';
    text: string;
    at: string;
    href: string;
  }>;
};

export default function DashboardHeader({
  limitedMode = false,
  sessionUserRole,
  initialSiteSlug = '',
}: DashboardHeaderProps) {
  const { user } = useUser();
  const { data: session } = useSession();

  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const [siteSlug, setSiteSlug] = useState(initialSiteSlug);
  const [notifications, setNotifications] = useState<NotificationSummary>({
    unreadCount: 0,
    latestEventAt: null,
    events: [],
  });
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const sessionImage = (session?.user as any)?.image as string | undefined;
  const sessionName = session?.user?.name ?? user?.name ?? 'Usuário';
  const sessionEmail = session?.user?.email ?? user?.email ?? '';
  const avatarSrc = sessionImage || user?.photo;
  const role = (session?.user as any)?.role;

  const displayName =
    role === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.name || 'Usuário'
      : sessionName;
  const displayEmail =
    role === 'ADMIN' && impersonation?.isImpersonating
      ? impersonation.effectiveUser?.email || ''
      : sessionEmail;
  const firstName = displayName.split(' ')[0];

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    fetch('/api/admin/impersonation', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setImpersonation(data))
      .catch(() => null);
  }, [role]);

  useEffect(() => {
    if (role !== 'PARTNER' && role !== 'AMBASSADOR' && role !== 'EMPLOYEE') return;
    const url = role === 'EMPLOYEE' ? '/api/employee/impersonation' : '/api/affiliate/impersonation';
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setImpersonation(data))
      .catch(() => null);
  }, [role]);

  useEffect(() => {
    if (initialSiteSlug) return;
    fetch('/api/gift-lists/my-list?view=header', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.slug) setSiteSlug(String(data.slug));
      })
      .catch(() => null);
  }, [initialSiteSlug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissedKey = `lumie:notif:dismissed:${siteSlug || 'default'}`;
    const rawDismissed = localStorage.getItem(dismissedKey);
    const parsedDismissed = rawDismissed ? JSON.parse(rawDismissed) : [];
    setDismissedNotificationIds(Array.isArray(parsedDismissed) ? parsedDismissed : []);
  }, [siteSlug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storageKey = `lumie:notif:lastSeen:${siteSlug || 'default'}`;
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const sinceRaw = localStorage.getItem(storageKey);
        const sinceDate = sinceRaw ? new Date(sinceRaw) : null;
        const sinceMark = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;
        const sinceQuery = sinceRaw ? `?since=${encodeURIComponent(sinceRaw)}` : '';
        const res = await fetch(`/api/notifications/summary${sinceQuery}`, { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;
        const incomingEvents = Array.isArray(data?.events) ? data.events : [];
        const visibleEvents = incomingEvents.filter((event: any) => !dismissedNotificationIds.includes(String(event?.id ?? '')));
        const unreadVisibleCount = visibleEvents.filter((event: any) => {
          if (!sinceMark) return true;
          const eventDate = new Date(String(event?.at ?? ''));
          return !Number.isNaN(eventDate.getTime()) && eventDate.getTime() > sinceMark.getTime();
        }).length;
        setNotifications({
          unreadCount: unreadVisibleCount,
          latestEventAt: typeof data?.latestEventAt === 'string' ? data.latestEventAt : null,
          events: visibleEvents,
        });
      } catch {
        // silencioso
      }
    };

    const initialTimer = window.setTimeout(loadNotifications, 2500);
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [siteSlug, dismissedNotificationIds]);

  function markNotificationsAsSeen() {
    if (typeof window === 'undefined') return;
    const storageKey = `lumie:notif:lastSeen:${siteSlug || 'default'}`;
    const reference = notifications.latestEventAt || new Date().toISOString();
    localStorage.setItem(storageKey, reference);
    setNotifications((prev) => ({ ...prev, unreadCount: 0 }));
  }

  function formatNotificationDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function dismissNotification(id: string) {
    if (typeof window === 'undefined') return;
    const dismissedKey = `lumie:notif:dismissed:${siteSlug || 'default'}`;
    setDismissedNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(dismissedKey, JSON.stringify(next));
      return next;
    });
    setNotifications((prev) => ({
      ...prev,
      events: prev.events.filter((event) => event.id !== id),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }

  async function stopImpersonation() {
    const route =
      role === 'ADMIN'
        ? '/api/admin/impersonation'
        : role === 'PARTNER' || role === 'AMBASSADOR'
          ? '/api/affiliate/impersonation'
          : role === 'EMPLOYEE'
            ? '/api/employee/impersonation'
          : null;

    if (!route) return;

    const res = await fetch(route, { method: 'DELETE' });
    if (!res.ok) {
      alert('Não foi possível sair do modo de acesso.');
      return;
    }

    if (role === 'ADMIN') {
      window.location.assign('/admin');
      return;
    }

    const roleToReturn =
      sessionUserRole ?? (role as 'PARTNER' | 'AMBASSADOR' | 'EMPLOYEE' | undefined);
    const backTo =
      roleToReturn === 'PARTNER' ? '/parceiro' : roleToReturn === 'AMBASSADOR' ? '/embaixador' : '/funcionario';
    window.location.assign(backTo);
  }

  return (
    <header className="bg-white border-b border-border px-4 md:px-6 py-4 space-y-3">
      {impersonation?.isImpersonating ? (
        <div className="rounded-lg border border-[#E9D8C8] bg-[#fff7f1] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs md:text-sm text-[#8E3D2C]">
            Acessando como: {impersonation.effectiveUser?.name || 'Sem nome'} ({impersonation.effectiveUser?.email}) - {impersonation.effectiveUser?.role}
          </p>
          <div className="flex items-center gap-2">
            {role === 'ADMIN' ? (
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin">Voltar ao admin</Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link
                  href={
                    (sessionUserRole ?? role) === 'PARTNER'
                      ? '/parceiro'
                      : (sessionUserRole ?? role) === 'AMBASSADOR'
                        ? '/embaixador'
                        : '/funcionario'
                  }
                >
                  Voltar ao painel
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => stopImpersonation().catch(() => null)}>
              Sair do modo de acesso
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="pl-16 md:pl-0">
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <span>Olá, {firstName}!</span>
            <Sparkles className="h-4 w-4 text-[#c65a3a]" />
          </h1>
          <p className="text-sm text-gray-500">Veja como está indo sua lista de presentes</p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu onOpenChange={(open) => open && markNotificationsAsSeen()}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 ring-1 ring-border">
                <Bell className="h-5 w-5 text-gray-700" />
                {notifications.unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#c65a3a] px-1 text-[10px] font-semibold text-white">
                    {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.events.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">Sem novidades no momento.</div>
              ) : (
                <div className="max-h-80 overflow-y-auto px-2 py-1 space-y-1">
                  {notifications.events.map((event) => (
                    <div key={event.id} className="rounded-md border border-gray-100 bg-white px-2 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={event.href || '/dashboard'}
                          onClick={() => {
                            dismissNotification(event.id);
                            markNotificationsAsSeen();
                          }}
                          className="flex-1 cursor-pointer hover:opacity-90"
                        >
                          <p className="text-sm text-gray-800 leading-snug whitespace-normal">{event.text}</p>
                          <p className="text-[11px] text-gray-500 mt-1">{formatNotificationDate(event.at)}</p>
                        </Link>
                        <button
                          type="button"
                          onClick={() => dismissNotification(event.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          aria-label="Remover notificacao"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden ring-1 ring-border">
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={sessionName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {getUserInitials(sessionName)}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={limitedMode ? '/dashboard/presentes' : '/dashboard'} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Meu Painel
                </Link>
              </DropdownMenuItem>
              {!limitedMode ? (
                <DropdownMenuItem asChild>
                  <Link href={siteSlug ? `/site/${encodeURIComponent(siteSlug)}` : '/site'} className="cursor-pointer">
                    <Globe className="w-4 h-4 mr-2" />
                    Ver Site
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {role === 'ADMIN' ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <Shield className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {!limitedMode ? (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/configuracoes" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut({ redirect: false });
                  window.location.assign('/auth/login');
                }}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
