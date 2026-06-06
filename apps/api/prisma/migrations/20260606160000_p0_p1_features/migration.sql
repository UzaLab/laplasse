-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('TABLE', 'APPOINTMENT', 'ROOM', 'CONSULTATION', 'VENUE');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('SEARCH', 'FEATURED', 'CATEGORY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT', 'MODERATION');

-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'AD_CAMPAIGN';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "booking_type" "BookingType" NOT NULL DEFAULT 'TABLE',
ADD COLUMN "check_out_at" TIMESTAMP(3),
ADD COLUMN "service_id" TEXT,
ADD COLUMN "staff_id" TEXT,
ADD COLUMN "room_type" TEXT,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "reminder_sent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MerchantBookingSettings" (
    "merchant_id" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL DEFAULT 20,
    "slot_duration_min" INTEGER NOT NULL DEFAULT 60,
    "buffer_min" INTEGER NOT NULL DEFAULT 15,
    "booking_window_days" INTEGER NOT NULL DEFAULT 30,
    "auto_confirm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MerchantBookingSettings_pkey" PRIMARY KEY ("merchant_id")
);

-- CreateTable
CREATE TABLE "MerchantService" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "price" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantStaff" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL DEFAULT 'SEARCH',
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "payload" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_booking_type_idx" ON "Booking"("booking_type");

-- CreateIndex
CREATE INDEX "MerchantService_merchant_id_idx" ON "MerchantService"("merchant_id");

-- CreateIndex
CREATE INDEX "MerchantStaff_merchant_id_idx" ON "MerchantStaff"("merchant_id");

-- CreateIndex
CREATE INDEX "AdCampaign_merchant_id_idx" ON "AdCampaign"("merchant_id");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_ends_at_idx" ON "AdCampaign"("ends_at");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- CreateIndex
CREATE INDEX "FraudSignal_resolved_idx" ON "FraudSignal"("resolved");

-- CreateIndex
CREATE INDEX "FraudSignal_created_at_idx" ON "FraudSignal"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_user_id_idx" ON "DeviceToken"("user_id");

-- AddForeignKey
ALTER TABLE "MerchantBookingSettings" ADD CONSTRAINT "MerchantBookingSettings_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantService" ADD CONSTRAINT "MerchantService_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantStaff" ADD CONSTRAINT "MerchantStaff_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "MerchantService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "MerchantStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
