ALTER TABLE "custom_domains"
  ADD COLUMN "registrarOrderId" TEXT,
  ADD COLUMN "registrarOrderStatus" TEXT,
  ADD COLUMN "purchaseAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "projectDomainVerifiedAt" TIMESTAMP(3);
