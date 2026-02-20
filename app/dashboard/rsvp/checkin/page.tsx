import { CheckInConsole } from '@/components/rsvp/checkin-console';

export default function RsvpCheckInPage() {
  return <CheckInConsole overviewUrl="/api/rsvp/overview" scanUrl="/api/rsvp/checkin/scan" mode="dashboard" autoRefreshMs={5000} />;
}

