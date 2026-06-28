-- CreateEnum
CREATE TYPE "DeliveryEtaUnit" AS ENUM ('MINUTES', 'HOURS', 'DAYS');

-- AlterTable
ALTER TABLE "ShopDeliveryZone" RENAME COLUMN "eta_min_minutes" TO "eta_min";
ALTER TABLE "ShopDeliveryZone" RENAME COLUMN "eta_max_minutes" TO "eta_max";
ALTER TABLE "ShopDeliveryZone" ADD COLUMN "eta_unit" "DeliveryEtaUnit" NOT NULL DEFAULT 'MINUTES';
