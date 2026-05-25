ALTER TABLE "users" ADD COLUMN "document" TEXT;

ALTER TABLE "email_verification_codes" ADD COLUMN "document" TEXT;

CREATE UNIQUE INDEX "users_document_key" ON "users"("document");
