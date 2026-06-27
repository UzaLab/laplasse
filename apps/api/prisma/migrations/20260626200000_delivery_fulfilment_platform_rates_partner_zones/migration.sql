-- Migration: delivery fulfilment per merchant + platform delivery rates + partner zones
-- 1. Add delivery_fulfilment_default to Merchant
ALTER TABLE "Merchant" ADD COLUMN "delivery_fulfilment_default" "DeliveryFulfilmentMode" NOT NULL DEFAULT 'PLATFORM_RIDER';

-- 2. Make ShopDeliveryZone.shop_id nullable (to allow partner-owned zones)
ALTER TABLE "ShopDeliveryZone" ALTER COLUMN "shop_id" DROP NOT NULL;

-- 3. Add logistics_partner_id to ShopDeliveryZone
ALTER TABLE "ShopDeliveryZone" ADD COLUMN "logistics_partner_id" TEXT;

ALTER TABLE "ShopDeliveryZone" ADD CONSTRAINT "ShopDeliveryZone_logistics_partner_id_fkey"
  FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ShopDeliveryZone_logistics_partner_id_is_active_idx"
  ON "ShopDeliveryZone"("logistics_partner_id", "is_active");

-- 4. Create PlatformDeliveryRate table
CREATE TABLE "PlatformDeliveryRate" (
  "id"         TEXT NOT NULL,
  "city_id"    TEXT NOT NULL,
  "commune_id" TEXT,
  "vehicle"    "DeliveryVehicle" NOT NULL DEFAULT 'MOTO',
  "fee"        INTEGER NOT NULL,
  "min_order"  INTEGER,
  "is_active"  BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformDeliveryRate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlatformDeliveryRate" ADD CONSTRAINT "PlatformDeliveryRate_city_id_fkey"
  FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlatformDeliveryRate" ADD CONSTRAINT "PlatformDeliveryRate_commune_id_fkey"
  FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PlatformDeliveryRate_city_id_is_active_idx" ON "PlatformDeliveryRate"("city_id", "is_active");
CREATE INDEX "PlatformDeliveryRate_commune_id_is_active_idx" ON "PlatformDeliveryRate"("commune_id", "is_active");
