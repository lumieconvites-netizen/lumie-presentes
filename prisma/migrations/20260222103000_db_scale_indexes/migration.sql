-- Escala: indices para consultas criticas (admin financeiro, afiliados, RSVP e dashboards)

CREATE INDEX IF NOT EXISTS "users_role_createdAt_idx"
  ON "users"("role", "createdAt");

CREATE INDEX IF NOT EXISTS "users_isBlocked_createdAt_idx"
  ON "users"("isBlocked", "createdAt");

CREATE INDEX IF NOT EXISTS "users_appliedReferralCode_idx"
  ON "users"("appliedReferralCode");

CREATE INDEX IF NOT EXISTS "referral_codes_ownerUserId_isActive_idx"
  ON "referral_codes"("ownerUserId", "isActive");

CREATE INDEX IF NOT EXISTS "gift_lists_userId_createdAt_idx"
  ON "gift_lists"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "gift_lists_isPublished_createdAt_idx"
  ON "gift_lists"("isPublished", "createdAt");

CREATE INDEX IF NOT EXISTS "gift_items_giftListId_order_idx"
  ON "gift_items"("giftListId", "order");

CREATE INDEX IF NOT EXISTS "gift_items_giftListId_isActive_idx"
  ON "gift_items"("giftListId", "isActive");

CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx"
  ON "orders"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "orders_paymentMethod_createdAt_idx"
  ON "orders"("paymentMethod", "createdAt");

CREATE INDEX IF NOT EXISTS "orders_giftListId_status_createdAt_idx"
  ON "orders"("giftListId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "orders_paidAt_idx"
  ON "orders"("paidAt");

CREATE INDEX IF NOT EXISTS "messages_giftListId_createdAt_idx"
  ON "messages"("giftListId", "createdAt");

CREATE INDEX IF NOT EXISTS "messages_giftListId_isPublic_createdAt_idx"
  ON "messages"("giftListId", "isPublic", "createdAt");

CREATE INDEX IF NOT EXISTS "webhook_events_processed_createdAt_idx"
  ON "webhook_events"("processed", "createdAt");

CREATE INDEX IF NOT EXISTS "rsvp_guests_giftListId_fullName_idx"
  ON "rsvp_guests"("giftListId", "fullName");

CREATE INDEX IF NOT EXISTS "rsvp_guests_giftListId_status_createdAt_idx"
  ON "rsvp_guests"("giftListId", "status", "createdAt");
