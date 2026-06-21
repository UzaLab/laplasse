-- Menu rattaché à l'établissement (merchant), boutique optionnelle

ALTER TABLE "MenuSection" ADD COLUMN "merchant_id" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "merchant_id" TEXT;

UPDATE "MenuSection" ms
SET "merchant_id" = s."merchant_id"
FROM "Shop" s
WHERE ms."shop_id" = s."id" AND s."merchant_id" IS NOT NULL;

UPDATE "MenuItem" mi
SET "merchant_id" = s."merchant_id"
FROM "Shop" s
WHERE mi."shop_id" = s."id" AND s."merchant_id" IS NOT NULL;

DELETE FROM "MenuItem" WHERE "merchant_id" IS NULL;
DELETE FROM "MenuSection" WHERE "merchant_id" IS NULL;

ALTER TABLE "MenuSection" ALTER COLUMN "merchant_id" SET NOT NULL;
ALTER TABLE "MenuItem" ALTER COLUMN "merchant_id" SET NOT NULL;

ALTER TABLE "MenuSection" ALTER COLUMN "shop_id" DROP NOT NULL;
ALTER TABLE "MenuItem" ALTER COLUMN "shop_id" DROP NOT NULL;

ALTER TABLE "MenuSection" ADD CONSTRAINT "MenuSection_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "MenuSection_merchant_id_sort_order_idx" ON "MenuSection"("merchant_id", "sort_order");
CREATE INDEX "MenuItem_merchant_id_sort_order_idx" ON "MenuItem"("merchant_id", "sort_order");
