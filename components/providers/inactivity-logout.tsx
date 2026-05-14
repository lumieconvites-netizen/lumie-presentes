'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const LAST_ACTIVITY_KEY = 'lumie:last-activity-at';

const protectedPrefixes = ['/dashboard', '/admin', '/parceiro', '/embaixador', '/funcionario'];

function isProtectedPath(pathname: string | null) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`));
}

function readLastActivity() {
  if (typeof window === 'undefined') return Date.now();
  const stored = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
}

function writeLastActivity() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function InactivityLogout() {
  const { status } = useSession();
  const pathname = usePathname();
  const signingOutRef = useRef(false);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (status !== 'authenticated') {
      signingOutRef.current = false;
      return;
    }

    writeLastActivity();

    const markActive = () => {
      const now = Date.now();
      if (now - lastWriteRef.current < 1000) return;
      lastWriteRef.current = now;
      writeLastActivity();
    };

    const logoutIfIdle = async () => {
      if (signingOutRef.current) return;
      const idleFor = Date.now() - readLastActivity();
      if (idleFor < INACTIVITY_LIMIT_MS) return;

      signingOutRef.current = true;
      if (isProtectedPath(pathname)) {
        await signOut({ callbackUrl: '/login' });
        return;
      }
      await signOut({ redirect: false });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logoutIfIdle().catch(() => null);
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'focus',
      'keydown',
      'mousedown',
      'mousemove',
      'pointerdown',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      logoutIfIdle().catch(() => null);
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActive);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname, status]);

  return null;
}
