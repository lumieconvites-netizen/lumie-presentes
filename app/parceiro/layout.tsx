import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getActingUserContext } from '@/lib/acting-user';
import AffiliateSidebar from '@/components/affiliate/sidebar';
import AffiliateTopbar from '@/components/affiliate/topbar';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const ctx = await getActingUserContext();
  if (!ctx) redirect('/login');

  if (ctx.effectiveUser.role === 'CLIENT') redirect('/dashboard');
  if (ctx.effectiveUser.role === 'AMBASSADOR') redirect('/embaixador');
  if (ctx.effectiveUser.role !== 'PARTNER') redirect('/admin');

  return (
    <div className="min-h-screen bg-background flex">
      <AffiliateSidebar role="PARTNER" />
      <div className="flex-1 flex flex-col min-w-0">
        <AffiliateTopbar role="PARTNER" />
        <main className="flex-1 overflow-auto p-6 bg-[#fbf8f5]">{children}</main>
      </div>
    </div>
  );
}
