import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret =
    process.env.SENTRY_DEBUG_SECRET ||
    process.env.ACCOUNT_RETENTION_CRON_SECRET ||
    process.env.CRON_SECRET;

  if (!secret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  return token === secret;
}

function getLevel(raw: string | null): Sentry.SeverityLevel {
  const level = (raw || "").toLowerCase();
  if (level === "fatal") return "fatal";
  if (level === "error") return "error";
  if (level === "warning") return "warning";
  if (level === "log") return "log";
  if (level === "info") return "info";
  if (level === "debug") return "debug";
  return "error";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = (searchParams.get("mode") || "exception").toLowerCase();
  const level = getLevel(searchParams.get("level"));
  const label = searchParams.get("label") || "manual";
  const release = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";

  let eventId = "";
  if (mode === "message") {
    eventId = Sentry.captureMessage(`[sentry-debug] ${label}`, level);
  } else {
    const err = new Error(`[sentry-debug] ${label}`);
    err.name = "SentryDebugError";
    eventId = Sentry.captureException(err, {
      level,
      tags: {
        source: "sentry-debug-endpoint",
      },
      extra: {
        release,
      },
    });
  }

  await Sentry.flush(2000);
  return NextResponse.json({
    ok: true,
    mode,
    level,
    eventId,
    release,
  });
}
