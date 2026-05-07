CREATE TYPE "DomainEntitlementStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'CONSUMED', 'EXPIRED', 'RELEASED');

CREATE TABLE "domain_entitlements" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planPurchaseId" TEXT NOT NULL,
  "customDomainId" TEXT,
  "status" "DomainEntitlementStatus" NOT NULL DEFAULT 'AVAILABLE',
  "reservedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "domain_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "domain_entitlements_planPurchaseId_key" ON "domain_entitlements"("planPurchaseId");
CREATE UNIQUE INDEX "domain_entitlements_customDomainId_key" ON "domain_entitlements"("customDomainId");
CREATE INDEX "domain_entitlements_userId_status_idx" ON "domain_entitlements"("userId", "status");
CREATE INDEX "domain_entitlements_userId_expiresAt_idx" ON "domain_entitlements"("userId", "expiresAt");
CREATE INDEX "domain_entitlements_status_expiresAt_idx" ON "domain_entitlements"("status", "expiresAt");

ALTER TABLE "domain_entitlements"
  ADD CONSTRAINT "domain_entitlements_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "domain_entitlements"
  ADD CONSTRAINT "domain_entitlements_planPurchaseId_fkey"
  FOREIGN KEY ("planPurchaseId") REFERENCES "plan_purchases"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "domain_entitlements"
  ADD CONSTRAINT "domain_entitlements_customDomainId_fkey"
  FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
