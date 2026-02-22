import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const localSet = new Map<string, number>();

export async function claimIdempotencyKey(key: string, ttlSeconds: number): Promise<boolean> {
  const now = Date.now();

  if (!redis) {
    const existing = localSet.get(key);
    if (existing && existing > now) return false;
    localSet.set(key, now + ttlSeconds * 1000);
    return true;
  }

  const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
  return result === "OK";
}

