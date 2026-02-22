CREATE TABLE IF NOT EXISTS "account_retention_audit_logs" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "dryRun" BOOLEAN NOT NULL DEFAULT false,
  "action" TEXT NOT NULL,
  "userId" TEXT,
  "userEmail" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_retention_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "account_retention_audit_logs_runId_idx"
  ON "account_retention_audit_logs"("runId");

CREATE INDEX IF NOT EXISTS "account_retention_audit_logs_action_createdAt_idx"
  ON "account_retention_audit_logs"("action", "createdAt");

CREATE INDEX IF NOT EXISTS "account_retention_audit_logs_userId_createdAt_idx"
  ON "account_retention_audit_logs"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "account_retention_audit_logs_createdAt_idx"
  ON "account_retention_audit_logs"("createdAt");
