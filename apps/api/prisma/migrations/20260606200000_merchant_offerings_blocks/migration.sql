-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('APPOINTMENT', 'TABLE_MENU', 'ROOM_TYPE', 'CONSULTATION');

-- AlterTable
ALTER TABLE "MerchantService" ADD COLUMN "service_kind" "ServiceKind" NOT NULL DEFAULT 'APPOINTMENT';
ALTER TABLE "MerchantService" ADD COLUMN "description" TEXT;
ALTER TABLE "MerchantService" ADD COLUMN "capacity" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN "staff_id" TEXT;

-- CreateTable
CREATE TABLE "MerchantAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "staff_id" TEXT,
    "service_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchantService_staff_id_idx" ON "MerchantService"("staff_id");
CREATE INDEX "MerchantAvailabilityBlock_merchant_id_idx" ON "MerchantAvailabilityBlock"("merchant_id");
CREATE INDEX "MerchantAvailabilityBlock_starts_at_ends_at_idx" ON "MerchantAvailabilityBlock"("starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "MerchantService" ADD CONSTRAINT "MerchantService_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "MerchantStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantAvailabilityBlock" ADD CONSTRAINT "MerchantAvailabilityBlock_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MerchantAvailabilityBlock" ADD CONSTRAINT "MerchantAvailabilityBlock_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "MerchantStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantAvailabilityBlock" ADD CONSTRAINT "MerchantAvailabilityBlock_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "MerchantService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
