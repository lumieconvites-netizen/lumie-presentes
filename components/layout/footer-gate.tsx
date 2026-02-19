'use client';

import { usePathname } from 'next/navigation';
import { CompactFooter, Footer } from '@/components/layout/footer';

export function FooterGate() {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  const isPublishedSitePath =
    /^\/site\/[^/]+(?:\/.*)?$/.test(pathname) && !pathname.startsWith('/site/presentes');

  if (isPublishedSitePath) {
    return <CompactFooter />;
  }

  return <Footer />;
}

