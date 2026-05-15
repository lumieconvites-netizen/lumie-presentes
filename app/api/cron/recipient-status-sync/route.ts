import { NextResponse } from "next/server";
import { syncRecipientStatuses } from "@/lib/recipient-status-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.RECIPIENT_STATUS_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice("Bearer ".length).trim() === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dryRunRaw = (searchParams.get("dryRun") || "").toLowerCase();
  const dryRun = dryRunRaw === "1" || dryRunRaw === "true";
  const limitRaw = Number.parseInt(searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50;

  const result = await syncRecipientStatuses({ dryRun, limit });
  return NextResponse.json(result);
}
