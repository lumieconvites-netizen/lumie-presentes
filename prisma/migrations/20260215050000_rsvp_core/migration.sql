-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "rsvp_settings" (
    "id" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmail" TEXT,
    "eventTitle" TEXT,
    "eventDateLabel" TEXT,
    "eventLocation" TEXT,
    "checkInEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_guests" (
    "id" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "status" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "qrToken" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkInCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_settings_giftListId_key" ON "rsvp_settings"("giftListId");

-- CreateIndex
CREATE UNIQUE INDEX "rsvp_guests_qrToken_key" ON "rsvp_guests"("qrToken");

-- CreateIndex
CREATE INDEX "rsvp_guests_giftListId_idx" ON "rsvp_guests"("giftListId");

-- CreateIndex
CREATE INDEX "rsvp_guests_status_idx" ON "rsvp_guests"("status");

-- CreateIndex
CREATE INDEX "rsvp_guests_fullName_idx" ON "rsvp_guests"("fullName");

-- AddForeignKey
ALTER TABLE "rsvp_settings" ADD CONSTRAINT "rsvp_settings_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_guests" ADD CONSTRAINT "rsvp_guests_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
