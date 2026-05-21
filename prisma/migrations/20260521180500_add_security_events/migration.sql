CREATE TABLE "security_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "email" TEXT,
  "userId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "route" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_events_type_createdAt_idx" ON "security_events"("type", "createdAt");
CREATE INDEX "security_events_email_createdAt_idx" ON "security_events"("email", "createdAt");
CREATE INDEX "security_events_userId_createdAt_idx" ON "security_events"("userId", "createdAt");
CREATE INDEX "security_events_ip_createdAt_idx" ON "security_events"("ip", "createdAt");
CREATE INDEX "security_events_createdAt_idx" ON "security_events"("createdAt");
