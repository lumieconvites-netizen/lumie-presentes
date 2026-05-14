'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { InactivityLogout } from './inactivity-logout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InactivityLogout />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
    </SessionProvider>
  );
}
