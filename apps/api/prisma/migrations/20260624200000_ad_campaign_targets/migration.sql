-- Ad campaigns: multi-target (merchant / shop / product)

CREATE TYPE "AdTargetType" AS ENUM ('MERCHANT', 'SHOP', 'PRODUCT');

ALTER TYPE "AdPlacement" ADD VALUE IF NOT EXISTS 'MARKETPLACE_FEATURED_PRODUCTS';

ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "owner_id" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "shop_id" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "product_id" TEXT;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "target_type" "AdTargetType" NOT NULL DEFAULT 'MERCHANT';

UPDATE "AdCampaign" ac
SET "owner_id" = m."owner_id"
FROM "Merchant" m
WHERE ac."merchant_id" = m."id" AND ac."owner_id" IS NULL;

UPDATE "AdCampaign" SET "owner_id" = (SELECT "owner_id" FROM "Merchant" LIMIT 1) WHERE "owner_id" IS NULL;

ALTER TABLE "AdCampaign" ALTER COLUMN "owner_id" SET NOT NULL;
ALTER TABLE "AdCampaign" ALTER COLUMN "merchant_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "AdCampaign_owner_id_idx" ON "AdCampaign"("owner_id");
CREATE INDEX IF NOT EXISTS "AdCampaign_shop_id_idx" ON "AdCampaign"("shop_id");
CREATE INDEX IF NOT EXISTS "AdCampaign_product_id_idx" ON "AdCampaign"("product_id");
CREATE INDEX IF NOT EXISTS "AdCampaign_target_placement_status_idx" ON "AdCampaign"("target_type", "placement", "status", "ends_at");

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_shop_id_fkey"
  FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
