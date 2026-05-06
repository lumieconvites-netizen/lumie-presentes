DO $$ BEGIN
  CREATE TYPE "CustomDomainStatus" AS ENUM ('SELECTED', 'PURCHASE_PENDING', 'ACTIVE', 'EXPIRED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "custom_domains" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "giftListId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" "CustomDomainStatus" NOT NULL DEFAULT 'SELECTED',
  "provider" TEXT NOT NULL DEFAULT 'VERCEL',
  "availabilityCheckedAt" TIMESTAMP(3),
  "registeredAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "custom_domains_domain_key" ON "custom_domains"("domain");
CREATE INDEX IF NOT EXISTS "custom_domains_userId_idx" ON "custom_domains"("userId");
CREATE INDEX IF NOT EXISTS "custom_domains_giftListId_idx" ON "custom_domains"("giftListId");
CREATE INDEX IF NOT EXISTS "custom_domains_status_idx" ON "custom_domains"("status");

DO $$ BEGIN
  ALTER TABLE "custom_domains"
  ADD CONSTRAINT "custom_domains_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "custom_domains"
  ADD CONSTRAINT "custom_domains_giftListId_fkey"
  FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
