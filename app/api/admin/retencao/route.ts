import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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

  const [logs, actionsRaw, runSummaries] = await Promise.all([
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
  ]);

  const actions = actionsRaw.map((entry) => entry.action);
  return NextResponse.json({
    logs,
    actions,
    runSummaries: runSummaries.map((row) => ({
      runId: row.runId,
      total: row._count._all,
      startedAt: row._min.createdAt,
      finishedAt: row._max.createdAt,
    })),
  });
}

