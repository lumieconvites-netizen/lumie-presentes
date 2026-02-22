import { NextResponse } from "next/server";
import { runAccountRetentionJob } from "@/lib/account-retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.ACCOUNT_RETENTION_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const enabled = (process.env.ACCOUNT_RETENTION_ENABLED || "false").toLowerCase() === "true";
  const { searchParams } = new URL(request.url);
  const dryRunParam = (searchParams.get("dryRun") || "").toLowerCase();
  const dryRun = dryRunParam === "1" || dryRunParam === "true" || !enabled;

  const result = await runAccountRetentionJob({ dryRun });
  return NextResponse.json(result);
}

