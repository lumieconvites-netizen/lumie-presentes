-- Add selected template reference for email verification flow
ALTER TABLE "email_verification_codes"
ADD COLUMN IF NOT EXISTS "templateSlug" TEXT;
