-- Shop geolocation
ALTER TABLE "Shop" ADD COLUMN "city_id" TEXT;
ALTER TABLE "Shop" ADD COLUMN "commune_id" TEXT;
ALTER TABLE "Shop" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Shop" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Shop" ADD COLUMN "has_physical_location" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Shop_city_id_idx" ON "Shop"("city_id");
CREATE INDEX "Shop_commune_id_idx" ON "Shop"("commune_id");

ALTER TABLE "Shop" ADD CONSTRAINT "Shop_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Promotion multi-category
CREATE TABLE "PromotionCategory" (
    "promotion_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "PromotionCategory_pkey" PRIMARY KEY ("promotion_id","category_id")
);

CREATE INDEX "PromotionCategory_category_id_idx" ON "PromotionCategory"("category_id");

ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
