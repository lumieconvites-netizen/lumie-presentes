-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('PLATFORM_DIRECT', 'AMBASSADOR_DIRECT', 'PARTNER_DIRECT', 'PARTNER_WITH_AMBASSADOR');

-- CreateEnum
CREATE TYPE "ReferralCodeType" AS ENUM ('PARTNER_CLIENT', 'AMBASSADOR_CLIENT', 'AMBASSADOR_PARTNER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'PARTNER';
ALTER TYPE "UserRole" ADD VALUE 'AMBASSADOR';

-- AlterTable
ALTER TABLE "email_verification_codes" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "requestedRole" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acquisitionSource" "AcquisitionSource" NOT NULL DEFAULT 'PLATFORM_DIRECT',
ADD COLUMN     "appliedReferralCode" TEXT,
ADD COLUMN     "partnerAmbassadorId" TEXT,
ADD COLUMN     "referredByAmbassadorId" TEXT,
ADD COLUMN     "referredByPartnerId" TEXT;

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ReferralCodeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_ownerUserId_idx" ON "referral_codes"("ownerUserId");

-- CreateIndex
CREATE INDEX "referral_codes_type_idx" ON "referral_codes"("type");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_partnerAmbassadorId_idx" ON "users"("partnerAmbassadorId");

-- CreateIndex
CREATE INDEX "users_referredByPartnerId_idx" ON "users"("referredByPartnerId");

-- CreateIndex
CREATE INDEX "users_referredByAmbassadorId_idx" ON "users"("referredByAmbassadorId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partnerAmbassadorId_fkey" FOREIGN KEY ("partnerAmbassadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByPartnerId_fkey" FOREIGN KEY ("referredByPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByAmbassadorId_fkey" FOREIGN KEY ("referredByAmbassadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "email_verification_codes_expiresat_idx" RENAME TO "email_verification_codes_expiresAt_idx";
