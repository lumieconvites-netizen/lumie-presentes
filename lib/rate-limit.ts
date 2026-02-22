import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitWindow = `${number} s` | `${number} m` | `${number} h` | `${number} d`;

type LimitOptions = {
  key: string;
  requests: number;
  window: LimitWindow;
};

type LimitResult = {
  allowed: boolean;
  resetAt?: number;
  remaining?: number;
  limit?: number;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const localStore = new Map<string, { count: number; resetAt: number }>();

function parseWindow(window: LimitWindow): number {
  const [rawValue, unit] = window.split(" ");
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return 60_000;
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60_000;
  if (unit === "h") return value * 3_600_000;
  if (unit === "d") return value * 86_400_000;
  return 60_000;
}

function localLimit({ key, requests, window }: LimitOptions): LimitResult {
  const now = Date.now();
  const windowMs = parseWindow(window);
  const entry = localStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    localStore.set(key, next);
    return { allowed: true, resetAt: next.resetAt, remaining: requests - 1, limit: requests };
  }

  entry.count += 1;
  localStore.set(key, entry);
  const remaining = Math.max(requests - entry.count, 0);
  return { allowed: entry.count <= requests, resetAt: entry.resetAt, remaining, limit: requests };
}

export async function enforceRateLimit(options: LimitOptions): Promise<LimitResult> {
  if (!redis) return localLimit(options);

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.requests, options.window),
    prefix: "lumie:ratelimit",
    analytics: true,
  });

  const result = await ratelimit.limit(options.key);
  return {
    allowed: result.success,
    resetAt: result.reset,
    remaining: result.remaining,
    limit: result.limit,
  };
}

export function getRequestIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

