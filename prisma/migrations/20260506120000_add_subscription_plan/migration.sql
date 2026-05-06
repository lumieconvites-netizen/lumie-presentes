DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_plan_idx" ON "users"("plan");
