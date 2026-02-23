'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ALLOWED_PREFIXES = ['/dashboard/presentes', '/dashboard/editor', '/dashboard/rsvp'];

export default function AffiliateLimitedGuard({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const isAllowed = ALLOWED_PREFIXES.some((prefix) => (pathname ?? '').startsWith(prefix));
    if (!isAllowed) {
      router.replace('/dashboard/presentes');
    }
  }, [enabled, pathname, router]);

  return null;
}
