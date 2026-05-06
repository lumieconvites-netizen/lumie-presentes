-- Improve RSVP check-in and guest listing performance.
CREATE INDEX IF NOT EXISTS "rsvp_guests_gift_list_id_created_at_idx"
ON "rsvp_guests"("giftListId", "createdAt");

CREATE INDEX IF NOT EXISTS "rsvp_guests_gift_list_id_checked_in_at_idx"
ON "rsvp_guests"("giftListId", "checkedInAt");
