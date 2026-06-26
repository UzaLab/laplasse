-- Promotions pour boutiques standalone (sans établissement marchand)
ALTER TABLE "Promotion" ALTER COLUMN "merchant_id" DROP NOT NULL;

CREATE UNIQUE INDEX "Promotion_shop_id_code_key"
  ON "Promotion"("shop_id", "code")
  WHERE "code" IS NOT NULL AND "shop_id" IS NOT NULL;
