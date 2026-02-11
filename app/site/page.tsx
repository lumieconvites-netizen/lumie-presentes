'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/user-context';
import PublicPageView from '@/components/public/PublicPageView';

export default function PublicSitePage() {
  const { pageBlocks, gifts, messages, settings } = useUser();

  const [mounted, setMounted] = useState(false);

  // 1️⃣ Sempre declarar hooks primeiro
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2️⃣ Sync ao abrir /site (editor aberto em outra aba)
  useEffect(() => {
    try {
      const ch = new BroadcastChannel('lumie_preview');
      ch.postMessage({ type: 'REQUEST_SYNC' });
      ch.close();
    } catch {}
  }, []);

  // 3️⃣ Só depois pode fazer return condicional
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
