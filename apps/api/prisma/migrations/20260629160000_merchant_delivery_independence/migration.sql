-- AlterTable: ShopDeliveryZone — add merchant_id
ALTER TABLE "ShopDeliveryZone" ADD COLUMN "merchant_id" TEXT;
ALTER TABLE "ShopDeliveryZone" ADD CONSTRAINT "ShopDeliveryZone_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ShopDeliveryZone_merchant_id_is_active_idx" ON "ShopDeliveryZone"("merchant_id", "is_active");

-- AlterTable: DeliveryPartnerContract — make shop_id optional, add merchant_id
ALTER TABLE "DeliveryPartnerContract" ALTER COLUMN "shop_id" DROP NOT NULL;
ALTER TABLE "DeliveryPartnerContract" ADD COLUMN "merchant_id" TEXT;
ALTER TABLE "DeliveryPartnerContract" ADD CONSTRAINT "DeliveryPartnerContract_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "DeliveryPartnerContract_merchant_id_status_idx" ON "DeliveryPartnerContract"("merchant_id", "status");

-- Drop the old unique constraint that enforced (shop_id, logistics_partner_id) since shop_id is now nullable
ALTER TABLE "DeliveryPartnerContract" DROP CONSTRAINT IF EXISTS "DeliveryPartnerContract_shop_id_logistics_partner_id_key";

-- Data migration: move delivery zones from ghost shops to their merchants
UPDATE "ShopDeliveryZone" SET "merchant_id" = s."merchant_id"
FROM "Shop" s
WHERE "ShopDeliveryZone"."shop_id" = s."id"
  AND s."merchant_id" IS NOT NULL
  AND s."status" = 'DRAFT'
  AND s."is_active" = false
  AND "ShopDeliveryZone"."merchant_id" IS NULL;

-- Data migration: move delivery contracts from ghost shops to their merchants
UPDATE "DeliveryPartnerContract" SET "merchant_id" = s."merchant_id"
FROM "Shop" s
WHERE "DeliveryPartnerContract"."shop_id" = s."id"
  AND s."merchant_id" IS NOT NULL
  AND s."status" = 'DRAFT'
  AND s."is_active" = false
  AND "DeliveryPartnerContract"."merchant_id" IS NULL;

-- Data migration: move courier profiles from ghost shops to their merchants
UPDATE "CourierProfile" SET "merchant_id" = s."merchant_id", "shop_id" = NULL
FROM "Shop" s
WHERE "CourierProfile"."shop_id" = s."id"
  AND s."merchant_id" IS NOT NULL
  AND s."status" = 'DRAFT'
  AND s."is_active" = false
  AND "CourierProfile"."merchant_id" IS NULL;

-- Clear the shop_id reference on migrated zones (so they reference merchant directly)
UPDATE "ShopDeliveryZone" SET "shop_id" = NULL
WHERE "merchant_id" IS NOT NULL AND "shop_id" IS NOT NULL
  AND "shop_id" IN (SELECT id FROM "Shop" WHERE status = 'DRAFT' AND is_active = false AND merchant_id IS NOT NULL);

-- Clear shop_id on migrated contracts
UPDATE "DeliveryPartnerContract" SET "shop_id" = NULL
WHERE "merchant_id" IS NOT NULL AND "shop_id" IS NOT NULL
  AND "shop_id" IN (SELECT id FROM "Shop" WHERE status = 'DRAFT' AND is_active = false AND merchant_id IS NOT NULL);
