import { Redis } from "@upstash/redis";
import {
  sendPasswordResetCodeEmail,
  sendRsvpNotificationEmail,
  sendVerificationCodeEmail,
} from "@/lib/email";

type RsvpNotificationPayload = {
  to: string;
  eventTitle: string;
  guestName: string;
  status: "CONFIRMED" | "DECLINED";
};

type VerificationCodePayload = {
  to: string;
  code: string;
  name?: string;
};

type PasswordResetCodePayload = {
  to: string;
  code: string;
  name?: string;
};

type EmailJob =
  | {
      id: string;
      type: "rsvp_notification";
      payload: RsvpNotificationPayload;
      attempts: number;
      createdAt: string;
    }
  | {
      id: string;
      type: "verification_code";
      payload: VerificationCodePayload;
      attempts: number;
      createdAt: string;
    }
  | {
      id: string;
      type: "password_reset_code";
      payload: PasswordResetCodePayload;
      attempts: number;
      createdAt: string;
    };

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const QUEUE_KEY = "lumie:jobs:email:v1";
const MAX_ATTEMPTS = 5;
const localQueue: EmailJob[] = [];

function jobId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function pushJob(job: EmailJob) {
  const serialized = JSON.stringify(job);
  if (!redis) {
    localQueue.unshift(job);
    return;
  }
  await redis.lpush(QUEUE_KEY, serialized);
}

async function popJob(): Promise<EmailJob | null> {
  if (!redis) return localQueue.pop() ?? null;
  const raw = await redis.rpop<string | null>(QUEUE_KEY);
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as EmailJob;
  } catch {
    return null;
  }
}

export async function enqueueRsvpNotificationEmailJob(payload: RsvpNotificationPayload) {
  const job: EmailJob = {
    id: jobId(),
    type: "rsvp_notification",
    payload,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await pushJob(job);
  return job.id;
}

export async function enqueueVerificationCodeEmailJob(payload: VerificationCodePayload) {
  const job: EmailJob = {
    id: jobId(),
    type: "verification_code",
    payload,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await pushJob(job);
  return job.id;
}

export async function enqueuePasswordResetCodeEmailJob(payload: PasswordResetCodePayload) {
  const job: EmailJob = {
    id: jobId(),
    type: "password_reset_code",
    payload,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await pushJob(job);
  return job.id;
}

async function processJob(job: EmailJob) {
  if (job.type === "rsvp_notification") {
    await sendRsvpNotificationEmail(job.payload);
    return;
  }
  if (job.type === "verification_code") {
    await sendVerificationCodeEmail(job.payload);
    return;
  }
  if (job.type === "password_reset_code") {
    await sendPasswordResetCodeEmail(job.payload);
    return;
  }
}

export async function processEmailJobs(options?: { limit?: number; dryRun?: boolean }) {
  const limit = Math.max(1, Math.min(options?.limit ?? 30, 200));
  const dryRun = Boolean(options?.dryRun);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let requeued = 0;
  const errors: string[] = [];

  for (let i = 0; i < limit; i += 1) {
    const job = await popJob();
    if (!job) break;

    processed += 1;
    if (dryRun) {
      succeeded += 1;
      continue;
    }

    try {
      await processJob(job);
      succeeded += 1;
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
    remainingApprox: Number(remainingApprox) || 0,
    errors,
  };
}
