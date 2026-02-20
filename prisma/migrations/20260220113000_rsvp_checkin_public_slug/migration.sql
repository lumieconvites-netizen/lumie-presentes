ALTER TABLE "rsvp_settings"
  ADD COLUMN IF NOT EXISTS "checkInSlug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "rsvp_settings_checkInSlug_key"
  ON "rsvp_settings"("checkInSlug");

