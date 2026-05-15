ALTER TABLE "recipients"
  ADD COLUMN "lastStatusCheckedAt" TIMESTAMP(3),
  ADD COLUMN "statusCheckAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "statusFinalizedAt" TIMESTAMP(3);

CREATE INDEX "recipients_status_statusFinalizedAt_lastStatusCheckedAt_idx"
  ON "recipients"("status", "statusFinalizedAt", "lastStatusCheckedAt");
