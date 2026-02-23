'use client';

import { usePathname } from 'next/navigation';
import { CompactFooter, Footer } from '@/components/layout/footer';

export function FooterGate() {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  if (pathname.startsWith('/parceiro') || pathname.startsWith('/embaixador') || pathname.startsWith('/funcionario')) {
    return null;
  }

  if (pathname.startsWith('/rsvp/checkin/')) {
    return null;
  }

  if (/^\/templates\/[^/]+(?:\/presentes)?$/.test(pathname)) {
    return null;
  }

  const isPublishedSitePath =
    /^\/site\/[^/]+(?:\/.*)?$/.test(pathname) && !pathname.startsWith('/site/presentes');

  if (isPublishedSitePath) {
    return <CompactFooter />;
  }

  return <Footer />;
}
