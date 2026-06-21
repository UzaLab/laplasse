-- Delivery zones L1
CREATE TYPE "DeliveryVehicle" AS ENUM ('MOTO', 'TRICYCLE', 'CAR', 'VAN');

CREATE TABLE "ShopDeliveryZone" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee" INTEGER NOT NULL,
    "min_order_amount" INTEGER,
    "free_delivery_threshold" INTEGER,
    "eta_min_minutes" INTEGER NOT NULL,
    "eta_max_minutes" INTEGER NOT NULL,
    "vehicle" "DeliveryVehicle" NOT NULL DEFAULT 'MOTO',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDeliveryZone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopDeliveryZone_shop_id_is_active_idx" ON "ShopDeliveryZone"("shop_id", "is_active");

ALTER TABLE "ShopDeliveryZone" ADD CONSTRAINT "ShopDeliveryZone_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ShopDeliveryZoneRule" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "all_communes" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShopDeliveryZoneRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopDeliveryZoneRule_zone_id_idx" ON "ShopDeliveryZoneRule"("zone_id");
CREATE INDEX "ShopDeliveryZoneRule_city_id_idx" ON "ShopDeliveryZoneRule"("city_id");

ALTER TABLE "ShopDeliveryZoneRule" ADD CONSTRAINT "ShopDeliveryZoneRule_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "ShopDeliveryZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopDeliveryZoneRule" ADD CONSTRAINT "ShopDeliveryZoneRule_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ShopDeliveryZoneCommune" (
    "zone_rule_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,

    CONSTRAINT "ShopDeliveryZoneCommune_pkey" PRIMARY KEY ("zone_rule_id","commune_id")
);

ALTER TABLE "ShopDeliveryZoneCommune" ADD CONSTRAINT "ShopDeliveryZoneCommune_zone_rule_id_fkey" FOREIGN KEY ("zone_rule_id") REFERENCES "ShopDeliveryZoneRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopDeliveryZoneCommune" ADD CONSTRAINT "ShopDeliveryZoneCommune_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Promotions L2
ALTER TYPE "PromotionType" ADD VALUE 'FREE_DELIVERY';

ALTER TABLE "Promotion" ADD COLUMN "shop_id" TEXT;
ALTER TABLE "Promotion" ADD COLUMN "min_order_amount" INTEGER;

DROP INDEX IF EXISTS "Promotion_code_key";

CREATE UNIQUE INDEX "Promotion_merchant_id_code_key" ON "Promotion"("merchant_id", "code");

CREATE INDEX "Promotion_shop_id_idx" ON "Promotion"("shop_id");

ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_saved" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromotionRedemption_order_id_key" ON "PromotionRedemption"("order_id");
CREATE INDEX "PromotionRedemption_promotion_id_idx" ON "PromotionRedemption"("promotion_id");
CREATE INDEX "PromotionRedemption_user_id_idx" ON "PromotionRedemption"("user_id");

ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Order extensions
ALTER TABLE "Order" ADD COLUMN "promotion_id" TEXT;
ALTER TABLE "Order" ADD COLUMN "discount_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "delivery_fee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "delivery_city_id" TEXT;
ALTER TABLE "Order" ADD COLUMN "delivery_commune_id" TEXT;
ALTER TABLE "Order" ADD COLUMN "delivery_district" TEXT;

CREATE INDEX "Order_promotion_id_idx" ON "Order"("promotion_id");

ALTER TABLE "Order" ADD CONSTRAINT "Order_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
