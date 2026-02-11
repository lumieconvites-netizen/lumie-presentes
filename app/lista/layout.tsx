'use client';

import { UserProvider } from '@/contexts/user-context';

export default function PublicListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
