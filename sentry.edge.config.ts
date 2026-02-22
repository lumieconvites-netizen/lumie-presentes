import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1");

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
  debug: false,
});
