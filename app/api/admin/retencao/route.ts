import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteAssets } from "@/lib/media-cleanup";

const RETENTION_MARKER = "[AUTO_RETENTION_PENDING_DELETE]";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const runId = (searchParams.get("runId") || "").trim();
  const action = (searchParams.get("action") || "").trim();
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 200), 1000);

  const where = {
    ...(runId ? { runId } : {}),
    ...(action ? { action } : {}),
  };

  const retentionDays = Number.parseInt(process.env.ACCOUNT_RETENTION_DAYS_AFTER_EVENT ?? "90", 10) || 90;
  const graceDays = Number.parseInt(process.env.ACCOUNT_RETENTION_GRACE_DAYS ?? "7", 10) || 7;

  const [logs, actionsRaw, runSummaries, users] = await Promise.all([
    prisma.accountRetentionAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.accountRetentionAuditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    prisma.accountRetentionAuditLog.groupBy({
      by: ["runId"],
      _count: { _all: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: "desc" } },
      take: 30,
    }),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        blockReason: true,
        blockedAt: true,
        giftLists: {
          select: {
            id: true,
            slug: true,
            title: true,
            eventDate: true,
            isPublished: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const actions = actionsRaw.map((entry) => entry.action);
  const now = new Date();
  const trackedUsers = users
    .map((user) => {
      const eventDates = user.giftLists
        .map((list) => list.eventDate)
        .filter((value): value is Date => value instanceof Date);

      if (eventDates.length === 0) return null;

      const latestEvent = eventDates.reduce((max, current) => (current > max ? current : max));
      const retentionDeadline = new Date(latestEvent);
      retentionDeadline.setDate(retentionDeadline.getDate() + retentionDays);
      const managedByRetention = Boolean(user.blockReason?.startsWith(RETENTION_MARKER));
      const hardDeleteAt = managedByRetention
        ? (() => {
            const base = new Date(user.blockedAt ?? now);
            base.setDate(base.getDate() + graceDays);
            return base;
          })()
        : null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        latestEvent,
        retentionDeadline,
        hardDeleteAt,
        isBlocked: user.isBlocked,
        managedByRetention,
        status:
          managedByRetention && hardDeleteAt && now >= hardDeleteAt
            ? "ready_to_delete"
            : managedByRetention
              ? "waiting_grace"
              : now >= retentionDeadline
                ? "eligible"
                : "active",
        publishedLists: user.giftLists.filter((list) => list.isPublished).length,
        totalLists: user.giftLists.length,
        lists: user.giftLists,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const weight = (status: string) =>
        status === "ready_to_delete" ? 0 : status === "waiting_grace" ? 1 : status === "eligible" ? 2 : 3;
      const left = weight(a!.status);
      const right = weight(b!.status);
      if (left !== right) return left - right;
      return new Date(a!.retentionDeadline).getTime() - new Date(b!.retentionDeadline).getTime();
    });

  return NextResponse.json({
    logs,
    actions,
    retentionDays,
    graceDays,
    trackedUsers,
    runSummaries: runSummaries.map((row) => ({
      runId: row.runId,
      total: row._count._all,
      startedAt: row._min.createdAt,
      finishedAt: row._max.createdAt,
    })),
  });
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

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "CLIENT",
    },
    select: {
      id: true,
      email: true,
      image: true,
      giftLists: {
        select: {
          pageLayout: { select: { blocks: true } },
          gifts: { select: { imageUrl: true } },
          messages: { select: { photoUrls: true } },
          rsvpSettings: { select: { coverImageUrl: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
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

  const assetResult = await deleteAssets(Array.from(assetUrls));
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.accountRetentionAuditLog.create({
    data: {
      runId: `manual-${Date.now()}`,
      dryRun: false,
      action: "admin_forced_delete",
      userId: user.id,
      userEmail: user.email,
      metadata: {
        assets: assetResult,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    deletedUserId: user.id,
    assets: assetResult,
  });
}

