import { CheckInConsole } from '@/components/rsvp/checkin-console';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function PublicCheckInPage({ params }: { params: { slug: string } }) {
  const slug = encodeURIComponent(decodeURIComponent(params.slug));

  return (
    <CheckInConsole
      overviewUrl={`/api/public/rsvp/checkin/${slug}/overview`}
      scanUrl={`/api/public/rsvp/checkin/${slug}/scan`}
      mode="public"
      autoRefreshMs={8000}
    />
  );
}

