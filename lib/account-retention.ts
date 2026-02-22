import { UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { enqueueMediaCleanupJob } from "@/lib/media-cleanup-jobs";
import { AssetDeleteResult, deleteAssets } from "@/lib/media-cleanup";

const RETENTION_MARKER = "[AUTO_RETENTION_PENDING_DELETE]";

type RetentionRunOptions = {
  dryRun?: boolean;
  now?: Date;
};

type RetentionAuditEntry = {
  runId: string;
  dryRun: boolean;
  action: string;
  userId?: string;
  userEmail?: string;
  metadata?: unknown;
};

function toInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function addDays(base: Date, days: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toJsonCompatible(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function extractUrlsFromJson(value: unknown, output: Set<string>) {
  if (!value) return;

  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      output.add(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) extractUrlsFromJson(item, output);
    return;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      extractUrlsFromJson(nested, output);
    }
  }
}

async function writeRetentionAuditLog(entries: RetentionAuditEntry[]) {
  if (entries.length === 0) return { inserted: 0, failed: false as const };

  try {
    const result = await prisma.accountRetentionAuditLog.createMany({
      data: entries.map((entry) => ({
        runId: entry.runId,
        dryRun: entry.dryRun,
        action: entry.action,
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        metadata: typeof entry.metadata === "undefined" ? null : toJsonCompatible(entry.metadata),
      })),
    });
    return { inserted: result.count, failed: false as const };
  } catch (error) {
    console.error("[account-retention] failed to persist audit log:", error);
    return { inserted: 0, failed: true as const };
  }
}

export async function runAccountRetentionJob(options: RetentionRunOptions = {}) {
  const dryRun = Boolean(options.dryRun);
  const now = options.now ?? new Date();
  const runId = randomUUID();
  const retentionDays = toInt(process.env.ACCOUNT_RETENTION_DAYS_AFTER_EVENT, 90);
  const graceDays = toInt(process.env.ACCOUNT_RETENTION_GRACE_DAYS, 7);
  const auditEntries: RetentionAuditEntry[] = [];

  const users = await prisma.user.findMany({
    where: { role: UserRole.CLIENT },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isBlocked: true,
      blockReason: true,
      blockedAt: true,
      giftLists: {
        select: {
          id: true,
          slug: true,
          eventDate: true,
          isPublished: true,
          pageLayout: { select: { blocks: true } },
          gifts: { select: { imageUrl: true } },
          messages: { select: { photoUrls: true } },
          rsvpSettings: { select: { coverImageUrl: true } },
        },
      },
    },
  });

  let checked = 0;
  let eligible = 0;
  let blockedNow = 0;
  let deletedNow = 0;
  let unpublishedLists = 0;
  const details: Array<Record<string, unknown>> = [];

  for (const user of users) {
    checked += 1;

    const eventDates = user.giftLists
      .map((list) => list.eventDate)
      .filter((value): value is Date => value instanceof Date);
    if (eventDates.length === 0) continue;

    const latestEvent = eventDates.reduce((max, current) => (current > max ? current : max));
    const retentionDeadline = addDays(latestEvent, retentionDays);
    if (now < retentionDeadline) continue;

    eligible += 1;
    const isManagedByRetention = Boolean(user.blockReason?.startsWith(RETENTION_MARKER));

    // First phase: unpublish and block account.
    if (!isManagedByRetention) {
      const toUnpublish = user.giftLists.filter((list) => list.isPublished).map((list) => list.id);
      const reason = `${RETENTION_MARKER} event_plus_${retentionDays}d=${retentionDeadline.toISOString()}`;

      if (!dryRun) {
        if (toUnpublish.length > 0) {
          await prisma.giftList.updateMany({
            where: { id: { in: toUnpublish } },
            data: { isPublished: false },
          });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isBlocked: true,
            blockReason: reason,
            blockedAt: now,
          },
        });
      }

      unpublishedLists += toUnpublish.length;
      blockedNow += 1;
      auditEntries.push({
        runId,
        dryRun,
        action: dryRun ? "would_block_and_unpublish" : "blocked_and_unpublished",
        userId: user.id,
        userEmail: user.email,
        metadata: {
          retentionDeadline,
          unpublishedCount: toUnpublish.length,
        },
      });
      details.push({
        userId: user.id,
        email: user.email,
        action: dryRun ? "would_block_and_unpublish" : "blocked_and_unpublished",
        retentionDeadline,
        unpublishedCount: toUnpublish.length,
      });
      continue;
    }

    // Second phase: hard delete after grace period.
    const blockedAt = user.blockedAt ?? now;
    const hardDeleteAt = addDays(blockedAt, graceDays);
    if (now < hardDeleteAt) {
      auditEntries.push({
        runId,
        dryRun,
        action: "waiting_grace_period",
        userId: user.id,
        userEmail: user.email,
        metadata: { hardDeleteAt },
      });
      details.push({
        userId: user.id,
        email: user.email,
        action: "waiting_grace_period",
        hardDeleteAt,
      });
      continue;
    }

    const assetUrls = new Set<string>();
    if (user.image) assetUrls.add(user.image);

    for (const list of user.giftLists) {
      for (const gift of list.gifts) {
        if (gift.imageUrl) assetUrls.add(gift.imageUrl);
      }
      if (list.rsvpSettings?.coverImageUrl) assetUrls.add(list.rsvpSettings.coverImageUrl);
      for (const message of list.messages) {
        extractUrlsFromJson(message.photoUrls, assetUrls);
      }
      extractUrlsFromJson(list.pageLayout?.blocks, assetUrls);
    }

    const urls = Array.from(assetUrls);
    let assetResult: AssetDeleteResult = { attempted: urls.length, deleted: 0, failed: 0, errors: [] };
    let cleanupMode: "dry_run" | "queued" | "inline_fallback" = dryRun ? "dry_run" : "queued";
    let cleanupJobId: string | null = null;
    if (!dryRun && urls.length > 0) {
      try {
        cleanupJobId = await enqueueMediaCleanupJob({
          urls,
          source: "account_retention",
          userId: user.id,
          userEmail: user.email,
        });
      } catch (error) {
        cleanupMode = "inline_fallback";
        assetResult = await deleteAssets(urls);
        assetResult.errors.unshift(
          `[enqueue_failed] ${error instanceof Error ? error.message : "unknown error"}`
        );
      }
    }

    if (!dryRun) {
      await prisma.user.delete({ where: { id: user.id } });
    }

    deletedNow += 1;
    auditEntries.push({
      runId,
      dryRun,
      action: dryRun ? "would_hard_delete" : "hard_deleted",
      userId: user.id,
      userEmail: user.email,
      metadata: {
        hardDeleteAt,
        assets: assetResult,
        cleanupMode,
        cleanupJobId,
      },
    });
    details.push({
      userId: user.id,
      email: user.email,
      action: dryRun ? "would_hard_delete" : "hard_deleted",
      hardDeleteAt,
      assets: assetResult,
      cleanupMode,
      cleanupJobId,
    });
  }

  auditEntries.push({
    runId,
    dryRun,
    action: "run_summary",
    metadata: {
      checkedUsers: checked,
      eligibleUsers: eligible,
      blockedNow,
      deletedNow,
      unpublishedLists,
      retentionDays,
      graceDays,
      ranAt: now.toISOString(),
    },
  });

  const auditPersist = await writeRetentionAuditLog(auditEntries);

  return {
    ok: true,
    runId,
    dryRun,
    checkedUsers: checked,
    eligibleUsers: eligible,
    blockedNow,
    deletedNow,
    unpublishedLists,
    retentionDays,
    graceDays,
    ranAt: now.toISOString(),
    auditLogged: auditPersist.inserted,
    auditPersistFailed: auditPersist.failed,
    details,
  };
}
