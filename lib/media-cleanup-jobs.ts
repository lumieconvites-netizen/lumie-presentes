import { Redis } from "@upstash/redis";
import { deleteAssets } from "@/lib/media-cleanup";

type MediaCleanupPayload = {
  urls: string[];
  source: "account_retention";
  userId?: string;
  userEmail?: string;
};

type MediaCleanupJob = {
  id: string;
  type: "media_cleanup_batch";
  payload: MediaCleanupPayload;
  attempts: number;
  createdAt: string;
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const QUEUE_KEY = "lumie:jobs:media-cleanup:v1";
const MAX_ATTEMPTS = 5;
const localQueue: MediaCleanupJob[] = [];

function jobId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function pushJob(job: MediaCleanupJob) {
  const serialized = JSON.stringify(job);
  if (!redis) {
    localQueue.unshift(job);
    return;
  }
  await redis.lpush(QUEUE_KEY, serialized);
}

async function popJob(): Promise<MediaCleanupJob | null> {
  if (!redis) return localQueue.pop() ?? null;
  const raw = await redis.rpop<string | null>(QUEUE_KEY);
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as MediaCleanupJob;
  } catch {
    return null;
  }
}

export async function enqueueMediaCleanupJob(payload: MediaCleanupPayload) {
  const dedupUrls = Array.from(new Set(payload.urls.filter(Boolean)));
  const job: MediaCleanupJob = {
    id: jobId(),
    type: "media_cleanup_batch",
    payload: { ...payload, urls: dedupUrls },
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await pushJob(job);
  return job.id;
}

async function processJob(job: MediaCleanupJob) {
  if (job.type === "media_cleanup_batch") {
    const result = await deleteAssets(job.payload.urls);
    return result;
  }
  return { attempted: 0, deleted: 0, failed: 0, errors: [] as string[] };
}

export async function processMediaCleanupJobs(options?: { limit?: number; dryRun?: boolean }) {
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  const dryRun = Boolean(options?.dryRun);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let requeued = 0;
  let assetsAttempted = 0;
  let assetsDeleted = 0;
  let assetsFailed = 0;
  const errors: string[] = [];

  for (let i = 0; i < limit; i += 1) {
    const job = await popJob();
    if (!job) break;

    processed += 1;
    if (dryRun) {
      succeeded += 1;
      assetsAttempted += job.payload.urls.length;
      continue;
    }

    try {
      const result = await processJob(job);
      succeeded += 1;
      assetsAttempted += result.attempted;
      assetsDeleted += result.deleted;
      assetsFailed += result.failed;
      if (result.errors.length > 0) {
        errors.push(...result.errors.slice(0, 20));
      }
    } catch (error) {
      failed += 1;
      const attempts = job.attempts + 1;
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${job.id}:${job.type}:attempt=${attempts}:${msg}`);
      if (attempts < MAX_ATTEMPTS) {
        await pushJob({ ...job, attempts });
        requeued += 1;
      }
    }
  }

  const remainingApprox = redis ? Number((await redis.llen(QUEUE_KEY)) ?? 0) : localQueue.length;
  return {
    ok: true,
    dryRun,
    limit,
    processed,
    succeeded,
    failed,
    requeued,
    assetsAttempted,
    assetsDeleted,
    assetsFailed,
    remainingApprox: Number(remainingApprox) || 0,
    errors,
  };
}
