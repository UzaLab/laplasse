-- Statuts livraison commande
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- Modération avis produits
ALTER TABLE "ProductReview" ADD COLUMN IF NOT EXISTS "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
CREATE INDEX IF NOT EXISTS "ProductReview_status_idx" ON "ProductReview"("status");

-- Delivery engine V3.0
CREATE TYPE "DeliveryJobStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED');

CREATE TABLE "DeliveryCourier" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CI',
    "city" TEXT NOT NULL,
    "vehicle" "DeliveryVehicle" NOT NULL DEFAULT 'MOTO',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryCourier_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DeliveryCourier_country_city_is_active_idx" ON "DeliveryCourier"("country", "city", "is_active");

CREATE TABLE "DeliveryJob" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "courier_id" TEXT,
    "status" "DeliveryJobStatus" NOT NULL DEFAULT 'PENDING',
    "tracking_token" TEXT NOT NULL,
    "pickup_address" TEXT,
    "dropoff_address" TEXT,
    "assigned_at" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "eta_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliveryJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryJob_order_id_key" ON "DeliveryJob"("order_id");
CREATE UNIQUE INDEX "DeliveryJob_tracking_token_key" ON "DeliveryJob"("tracking_token");
CREATE INDEX "DeliveryJob_status_idx" ON "DeliveryJob"("status");
CREATE INDEX "DeliveryJob_courier_id_idx" ON "DeliveryJob"("courier_id");
CREATE INDEX "DeliveryJob_tracking_token_idx" ON "DeliveryJob"("tracking_token");
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "DeliveryCourier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
