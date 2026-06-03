import { prisma } from "@/lib/prisma";
import { getRecipientStatusWithGateway } from "@/lib/withdraw-gateway";

const ACTIVE_SAFETY_WINDOW_MS = 2 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;

function isRealRecipientId(value?: string | null) {
  return Boolean(value && !value.startsWith("pending_"));
}

function normalizeRecipientStatus(input?: string | null) {
  const status = String(input ?? "").trim().toLowerCase();
  if (["active", "ativo", "approved", "enabled"].includes(status)) return "active";
  if (["refused", "rejected", "denied", "inactive", "disabled"].includes(status)) return "refused";
  if (["pending", "created", "processing", "waiting"].includes(status)) return "pending";
  return status || "unknown";
}

function addMs(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

function shouldFinalizeActive(referenceDate: Date, attempts: number, now: Date) {
  return attempts >= 3 || addMs(referenceDate, ACTIVE_SAFETY_WINDOW_MS) <= now;
}

function maxDate(a: Date, b: Date) {
  return a.getTime() >= b.getTime() ? a : b;
}

export async function syncRecipientStatuses(options?: {
  limit?: number;
  intervalMs?: number;
  dryRun?: boolean;
}) {
  const now = new Date();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const intervalMs = Math.max(options?.intervalMs ?? DEFAULT_INTERVAL_MS, 60_000);
  const dryRun = Boolean(options?.dryRun);
  const lastCheckCutoff = new Date(now.getTime() - intervalMs);
  const activeCutoff = new Date(now.getTime() - ACTIVE_SAFETY_WINDOW_MS);

  const recipients = await prisma.recipient.findMany({
    where: {
      statusFinalizedAt: null,
      pagarmeRecipientId: { not: { startsWith: "pending_" } },
      OR: [
        {
          status: { in: ["pending", "created", "processing", "waiting"] },
        },
        {
          status: "active",
          OR: [{ createdAt: { gte: activeCutoff } }, { updatedAt: { gte: activeCutoff } }],
          statusCheckAttempts: { lt: 3 },
        },
      ],
      AND: [
        {
          OR: [
            { lastStatusCheckedAt: null },
            { lastStatusCheckedAt: { lte: lastCheckCutoff } },
          ],
        },
      ],
    },
    orderBy: [{ lastStatusCheckedAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
      pagarmeRecipientId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      statusCheckAttempts: true,
      user: { select: { email: true, name: true } },
    },
  });

  const results: Array<{
    recipientId: string;
    previousStatus: string;
    nextStatus?: string;
    finalized?: boolean;
    error?: string;
  }> = [];

  for (const recipient of recipients) {
    if (!isRealRecipientId(recipient.pagarmeRecipientId)) continue;

    try {
      const gatewayStatus = dryRun
        ? { status: recipient.status }
        : await getRecipientStatusWithGateway(recipient.pagarmeRecipientId);
      const nextStatus = normalizeRecipientStatus(gatewayStatus.status);
      const attempts = recipient.statusCheckAttempts + 1;
      const activeReferenceDate = maxDate(recipient.createdAt, recipient.updatedAt);
      const finalized =
        nextStatus === "refused" ||
        (nextStatus === "active" && shouldFinalizeActive(activeReferenceDate, attempts, now));

      if (!dryRun) {
        await prisma.recipient.update({
          where: { id: recipient.id },
          data: {
            status: nextStatus === "unknown" ? recipient.status : nextStatus,
            lastStatusCheckedAt: now,
            statusCheckAttempts: attempts,
            statusFinalizedAt: finalized ? now : null,
          },
        });
      }

      results.push({
        recipientId: recipient.pagarmeRecipientId,
        previousStatus: recipient.status,
        nextStatus,
        finalized,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const gatewayRouteMissing = /Withdraw gateway error 404/i.test(message);
      if (!dryRun) {
        await prisma.recipient.update({
          where: { id: recipient.id },
          data: {
            lastStatusCheckedAt: now,
            ...(gatewayRouteMissing ? {} : { statusCheckAttempts: { increment: 1 } }),
          },
        });
      }

      results.push({
        recipientId: recipient.pagarmeRecipientId,
        previousStatus: recipient.status,
        error: message,
      });
    }
  }

  return {
    ok: true,
    dryRun,
    checked: results.length,
    queued: recipients.length,
    results,
  };
}
