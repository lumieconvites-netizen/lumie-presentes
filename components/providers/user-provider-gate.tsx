'use client';

import { UserProvider } from '@/contexts/user-context';

export function UserProviderGate({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
