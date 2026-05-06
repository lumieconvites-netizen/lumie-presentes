CREATE TYPE "PlanPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'AUTHORIZED', 'REFUSED', 'REFUNDED', 'CHARGEBACK', 'CANCELED');

CREATE TABLE "plan_purchases" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerUserId" TEXT,
  "ambassadorUserId" TEXT,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PREMIUM',
  "amount" DECIMAL(10,2) NOT NULL,
  "partnerCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "ambassadorCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" "PlanPurchaseStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT,
  "pagarmeOrderId" TEXT,
  "pagarmeChargeId" TEXT,
  "paidAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_purchases_pagarmeOrderId_key" ON "plan_purchases"("pagarmeOrderId");
CREATE INDEX "plan_purchases_userId_createdAt_idx" ON "plan_purchases"("userId", "createdAt");
CREATE INDEX "plan_purchases_partnerUserId_createdAt_idx" ON "plan_purchases"("partnerUserId", "createdAt");
CREATE INDEX "plan_purchases_ambassadorUserId_createdAt_idx" ON "plan_purchases"("ambassadorUserId", "createdAt");
CREATE INDEX "plan_purchases_status_createdAt_idx" ON "plan_purchases"("status", "createdAt");
CREATE INDEX "plan_purchases_paidAt_idx" ON "plan_purchases"("paidAt");

ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_partnerUserId_fkey"
  FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "plan_purchases"
  ADD CONSTRAINT "plan_purchases_ambassadorUserId_fkey"
  FOREIGN KEY ("ambassadorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
