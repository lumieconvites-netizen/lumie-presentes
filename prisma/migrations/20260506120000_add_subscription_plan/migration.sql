CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PREMIUM');

ALTER TABLE "users"
ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "planExpiresAt" TIMESTAMP(3);

CREATE INDEX "users_plan_idx" ON "users"("plan");
