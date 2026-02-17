ALTER TABLE "rsvp_settings"
  ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "publicTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "publicDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "searchPlaceholder" TEXT;
