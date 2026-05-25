CREATE TABLE "checkout_card_attempts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "giftListId" TEXT,
    "guestEmail" TEXT,
    "guestDocument" TEXT,
    "ip" TEXT,
    "cardFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_card_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checkout_card_attempts_guestEmail_createdAt_idx" ON "checkout_card_attempts"("guestEmail", "createdAt");
CREATE INDEX "checkout_card_attempts_guestDocument_createdAt_idx" ON "checkout_card_attempts"("guestDocument", "createdAt");
CREATE INDEX "checkout_card_attempts_ip_createdAt_idx" ON "checkout_card_attempts"("ip", "createdAt");
CREATE INDEX "checkout_card_attempts_cardFingerprint_createdAt_idx" ON "checkout_card_attempts"("cardFingerprint", "createdAt");
CREATE INDEX "checkout_card_attempts_status_createdAt_idx" ON "checkout_card_attempts"("status", "createdAt");

ALTER TABLE "checkout_card_attempts"
ADD CONSTRAINT "checkout_card_attempts_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
