-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "FeeMode" AS ENUM ('PASS_TO_GUEST', 'ABSORB');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'AUTHORIZED', 'REFUSED', 'REFUNDED', 'CHARGEBACK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "feeMode" "FeeMode" NOT NULL DEFAULT 'PASS_TO_GUEST',
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowPhotoUpload" BOOLEAN NOT NULL DEFAULT true,
    "showGuestNames" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_layouts" (
    "id" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_items" (
    "id" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "availableQty" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "giftItemId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "feeAmount" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "pagarmeOrderId" TEXT,
    "pagarmeChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "giftListId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "signature" TEXT,
    "photoUrls" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pagarmeRecipientId" TEXT NOT NULL,
    "bankAccount" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "thumbnail" TEXT,
    "defaultBlocks" JSONB NOT NULL,
    "defaultTheme" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gift_lists_slug_key" ON "gift_lists"("slug");

-- CreateIndex
CREATE INDEX "gift_lists_userId_idx" ON "gift_lists"("userId");

-- CreateIndex
CREATE INDEX "gift_lists_slug_idx" ON "gift_lists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "page_layouts_giftListId_key" ON "page_layouts"("giftListId");

-- CreateIndex
CREATE INDEX "gift_items_giftListId_idx" ON "gift_items"("giftListId");

-- CreateIndex
CREATE INDEX "gift_items_isActive_idx" ON "gift_items"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "orders_pagarmeOrderId_key" ON "orders"("pagarmeOrderId");

-- CreateIndex
CREATE INDEX "orders_giftListId_idx" ON "orders"("giftListId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_pagarmeOrderId_idx" ON "orders"("pagarmeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_orderId_key" ON "messages"("orderId");

-- CreateIndex
CREATE INDEX "messages_giftListId_idx" ON "messages"("giftListId");

-- CreateIndex
CREATE INDEX "messages_isPublic_idx" ON "messages"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "recipients_userId_key" ON "recipients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "recipients_pagarmeRecipientId_key" ON "recipients"("pagarmeRecipientId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- AddForeignKey
ALTER TABLE "gift_lists" ADD CONSTRAINT "gift_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_lists" ADD CONSTRAINT "gift_lists_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_layouts" ADD CONSTRAINT "page_layouts_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_items" ADD CONSTRAINT "gift_items_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "gift_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_giftListId_fkey" FOREIGN KEY ("giftListId") REFERENCES "gift_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
