import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { getActingUserContext } from '@/lib/acting-user';
import AffiliateLimitedGuard from '@/components/dashboard/affiliate-limited-guard';

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

  const isAffiliateLimitedMode =
    ctx.impersonationMode === 'AFFILIATE' &&
    ctx.isImpersonating &&
    ctx.effectiveUser.role === 'CLIENT' &&
    (ctx.sessionUserRole === 'PARTNER' || ctx.sessionUserRole === 'AMBASSADOR');

  if (!isAffiliateLimitedMode && ctx.effectiveUser.role === 'PARTNER') {
    redirect('/parceiro');
  }

  if (!isAffiliateLimitedMode && ctx.effectiveUser.role === 'AMBASSADOR') {
    redirect('/embaixador');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar limitedMode={isAffiliateLimitedMode} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader limitedMode={isAffiliateLimitedMode} sessionUserRole={ctx.sessionUserRole} />
        <AffiliateLimitedGuard enabled={isAffiliateLimitedMode} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
