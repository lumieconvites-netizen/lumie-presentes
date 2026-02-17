-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('REGISTER');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_email_purpose_idx" ON "email_verification_codes"("email", "purpose");

-- CreateIndex
CREATE INDEX "email_verification_codes_expiresAt_idx" ON "email_verification_codes"("expiresAt");
