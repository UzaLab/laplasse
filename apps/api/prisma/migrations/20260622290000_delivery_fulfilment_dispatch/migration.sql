-- CreateEnum
CREATE TYPE "DeliveryFulfilmentMode" AS ENUM ('PLATFORM_RIDER', 'MERCHANT_OWN');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "delivery_fulfilment_default" "DeliveryFulfilmentMode" NOT NULL DEFAULT 'PLATFORM_RIDER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "delivery_fulfilment_mode" "DeliveryFulfilmentMode" NOT NULL DEFAULT 'PLATFORM_RIDER';

-- AlterTable
ALTER TABLE "DeliveryJob" ADD COLUMN "fulfilment_mode" "DeliveryFulfilmentMode" NOT NULL DEFAULT 'PLATFORM_RIDER';
