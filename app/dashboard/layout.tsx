import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { getActingUserContext } from '@/lib/acting-user';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const ctx = await getActingUserContext();
  if (!ctx) {
    redirect('/login');
  }

  if (ctx.effectiveUser.role === 'PARTNER') {
    redirect('/parceiro');
  }

  if (ctx.effectiveUser.role === 'AMBASSADOR') {
    redirect('/embaixador');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
