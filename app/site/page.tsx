'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import PublicPageView from '@/components/public/PublicPageView';

export default function PublicSitePage() {
  const { pageBlocks, gifts, messages, settings } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza ao abrir /site quando o editor está aberto em outra aba.
  useEffect(() => {
    try {
      const ch = new BroadcastChannel('lumie_preview');
      ch.postMessage({ type: 'REQUEST_SYNC' });
      ch.close();
    } catch {}
  }, []);

  if (!mounted) return null;

  return (
    <PublicPageView
      blocks={pageBlocks}
      gifts={gifts}
      messages={messages}
      settings={settings}
      theme={settings?.theme || {}}
    />
  );
}
