'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ALLOWED_PREFIXES = ['/dashboard/presentes', '/dashboard/editor', '/dashboard/rsvp'];

export default function AffiliateLimitedGuard({
  enabled,
  canViewBankInLimitedMode = false,
  canViewSettingsInLimitedMode = false,
}: {
  enabled: boolean;
  canViewBankInLimitedMode?: boolean;
  canViewSettingsInLimitedMode?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const allowedPrefixes = [
      ...ALLOWED_PREFIXES,
      ...(canViewBankInLimitedMode ? ['/dashboard/banco'] : []),
      ...(canViewSettingsInLimitedMode ? ['/dashboard/configuracoes'] : []),
    ];
    const isAllowed = allowedPrefixes.some((prefix) => (pathname ?? '').startsWith(prefix));
    if (!isAllowed) {
      router.replace('/dashboard/presentes');
    }
  }, [canViewBankInLimitedMode, canViewSettingsInLimitedMode, enabled, pathname, router]);

  return null;
}
