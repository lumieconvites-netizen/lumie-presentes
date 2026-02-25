import { NextResponse } from "next/server";
import { processEmailJobs } from "@/lib/email-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.ACCOUNT_RETENTION_CRON_SECRET;
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

  const { searchParams } = new URL(request.url);
  const dryRunRaw = (searchParams.get("dryRun") || "").toLowerCase();
  const dryRun = dryRunRaw === "1" || dryRunRaw === "true";
  const limitRaw = Number.parseInt(searchParams.get("limit") || "30", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 30;

  const result = await processEmailJobs({ dryRun, limit });
  return NextResponse.json(result);
}
