'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ALLOWED_PREFIXES = ['/dashboard/presentes', '/dashboard/editor', '/dashboard/rsvp'];

export default function AffiliateLimitedGuard({
  enabled,
  canViewBankInLimitedMode = false,
}: {
  enabled: boolean;
  canViewBankInLimitedMode?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const allowedPrefixes = canViewBankInLimitedMode
      ? [...ALLOWED_PREFIXES, '/dashboard/banco']
      : ALLOWED_PREFIXES;
    const isAllowed = allowedPrefixes.some((prefix) => (pathname ?? '').startsWith(prefix));
    if (!isAllowed) {
      router.replace('/dashboard/presentes');
    }
  }, [canViewBankInLimitedMode, enabled, pathname, router]);

  return null;
}
