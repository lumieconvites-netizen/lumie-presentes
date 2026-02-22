import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDsnInfo(rawDsn: string) {
  if (!rawDsn) return null;
  try {
    const u = new URL(rawDsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    return {
      host: u.host,
      projectId,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
  const maskedDsn = dsn ? `${dsn.slice(0, 24)}...` : null;
  const dsnInfo = parseDsnInfo(dsn);

  const eventId = Sentry.captureException(new Error("Sentry debug error from /api/sentry-debug"));
  Sentry.captureMessage("Sentry debug message from /api/sentry-debug", "warning");
  const flushed = await Sentry.flush(10000);

  return NextResponse.json({
    ok: true,
    hasSentryDsn: Boolean(dsn),
    maskedDsn,
    dsnInfo,
    env: {
      nodeEnv: process.env.NODE_ENV || null,
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelRegion: process.env.VERCEL_REGION || null,
      sentryEnv: process.env.SENTRY_ENVIRONMENT || null,
    },
    eventId,
    flushed,
    message: "Evento de debug enviado ao Sentry.",
  });
}
