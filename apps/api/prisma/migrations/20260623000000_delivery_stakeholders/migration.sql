-- AlterEnum
ALTER TYPE "DeliveryFulfilmentMode" ADD VALUE 'LOGISTICS_PARTNER';

-- CreateEnum
CREATE TYPE "PartnerVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryContractStatus" AS ENUM ('DRAFT', 'PENDING_PARTNER', 'PENDING_MERCHANT', 'ACTIVE', 'PAUSED', 'TERMINATED');

-- AlterTable
ALTER TABLE "CourierProfile" ADD COLUMN "shop_id" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "logistics_partner_id" TEXT;

-- AlterTable
ALTER TABLE "DeliveryJob" ADD COLUMN "logistics_partner_id" TEXT;

-- CreateTable
CREATE TABLE "LogisticsPartner" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CI',
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "logo" TEXT,
    "verification" "PartnerVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsPartnerStaff" (
    "id" TEXT NOT NULL,
    "logistics_partner_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DISPATCHER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogisticsPartnerStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryPartnerContract" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "logistics_partner_id" TEXT NOT NULL,
    "status" "DeliveryContractStatus" NOT NULL DEFAULT 'DRAFT',
    "fee_override" INTEGER,
    "sla_eta_max_minutes" INTEGER,
    "auto_dispatch" BOOLEAN NOT NULL DEFAULT true,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryPartnerContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPartner_owner_user_id_key" ON "LogisticsPartner"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPartner_slug_key" ON "LogisticsPartner"("slug");

-- CreateIndex
CREATE INDEX "LogisticsPartner_country_city_is_active_idx" ON "LogisticsPartner"("country", "city", "is_active");

-- CreateIndex
CREATE INDEX "LogisticsPartner_verification_idx" ON "LogisticsPartner"("verification");

-- CreateIndex
CREATE UNIQUE INDEX "LogisticsPartnerStaff_user_id_key" ON "LogisticsPartnerStaff"("user_id");

-- CreateIndex
CREATE INDEX "LogisticsPartnerStaff_logistics_partner_id_idx" ON "LogisticsPartnerStaff"("logistics_partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryPartnerContract_shop_id_logistics_partner_id_key" ON "DeliveryPartnerContract"("shop_id", "logistics_partner_id");

-- CreateIndex
CREATE INDEX "DeliveryPartnerContract_shop_id_status_idx" ON "DeliveryPartnerContract"("shop_id", "status");

-- CreateIndex
CREATE INDEX "DeliveryPartnerContract_logistics_partner_id_status_idx" ON "DeliveryPartnerContract"("logistics_partner_id", "status");

-- CreateIndex
CREATE INDEX "CourierProfile_shop_id_kind_idx" ON "CourierProfile"("shop_id", "kind");

-- CreateIndex
CREATE INDEX "CourierProfile_logistics_partner_id_kind_idx" ON "CourierProfile"("logistics_partner_id", "kind");

-- CreateIndex
CREATE INDEX "CourierProfile_merchant_id_idx" ON "CourierProfile"("merchant_id");

-- CreateIndex
CREATE INDEX "Order_logistics_partner_id_idx" ON "Order"("logistics_partner_id");

-- CreateIndex
CREATE INDEX "DeliveryJob_logistics_partner_id_idx" ON "DeliveryJob"("logistics_partner_id");

-- AddForeignKey
ALTER TABLE "CourierProfile" ADD CONSTRAINT "CourierProfile_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierProfile" ADD CONSTRAINT "CourierProfile_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierProfile" ADD CONSTRAINT "CourierProfile_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsPartner" ADD CONSTRAINT "LogisticsPartner_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsPartnerStaff" ADD CONSTRAINT "LogisticsPartnerStaff_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsPartnerStaff" ADD CONSTRAINT "LogisticsPartnerStaff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPartnerContract" ADD CONSTRAINT "DeliveryPartnerContract_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryPartnerContract" ADD CONSTRAINT "DeliveryPartnerContract_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
