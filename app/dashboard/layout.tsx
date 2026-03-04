import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { getActingUserContext } from '@/lib/acting-user';
import AffiliateLimitedGuard from '@/components/dashboard/affiliate-limited-guard';
import { UserProviderGate } from '@/components/providers/user-provider-gate';
import { getPrimaryGiftListIdForUser } from '@/lib/primary-gift-list';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getActingUserContext();
  if (!ctx) {
    redirect('/login');
  }

  const primaryGiftListId = await getPrimaryGiftListIdForUser(ctx.effectiveUserId);
  const initialSiteSlug = primaryGiftListId
    ? (
        await prisma.giftList.findUnique({
          where: { id: primaryGiftListId },
          select: { slug: true },
        })
      )?.slug ?? ''
    : '';

  const isAffiliateLimitedMode =
    ctx.impersonationMode === 'AFFILIATE' &&
    ctx.isImpersonating &&
    ctx.effectiveUser.role === 'CLIENT' &&
    (ctx.sessionUserRole === 'PARTNER' || ctx.sessionUserRole === 'AMBASSADOR');

  const isEmployeeLimitedMode =
    ctx.impersonationMode === 'EMPLOYEE' &&
    ctx.isImpersonating &&
    ctx.effectiveUser.role === 'CLIENT' &&
    ctx.sessionUserRole === 'EMPLOYEE';

  const isLimitedMode = isAffiliateLimitedMode || isEmployeeLimitedMode;
  const canViewBankInLimitedMode = isAffiliateLimitedMode;

  if (!isLimitedMode && ctx.effectiveUser.role === 'PARTNER') {
    redirect('/parceiro');
  }

  if (!isLimitedMode && ctx.effectiveUser.role === 'AMBASSADOR') {
    redirect('/embaixador');
  }

  if (!isLimitedMode && ctx.effectiveUser.role === 'EMPLOYEE') {
    redirect('/funcionario');
  }

  return (
    <UserProviderGate>
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar limitedMode={isLimitedMode} canViewBankInLimitedMode={canViewBankInLimitedMode} />
        <div className="flex-1 min-w-0 flex flex-col">
          <DashboardHeader
            limitedMode={isLimitedMode}
            sessionUserRole={ctx.sessionUserRole}
            initialSiteSlug={initialSiteSlug}
          />
          <AffiliateLimitedGuard enabled={isLimitedMode} canViewBankInLimitedMode={canViewBankInLimitedMode} />
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </div>
    </UserProviderGate>
  );
}
