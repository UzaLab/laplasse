-- Boutique modulaire V1.6 : entité Shop indépendante des établissements

CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED');

CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "cover_image" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CI',
    "city" TEXT NOT NULL DEFAULT 'Abidjan',
    "district" TEXT,
    "address" TEXT,
    "merchant_id" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");
CREATE UNIQUE INDEX "Shop_merchant_id_key" ON "Shop"("merchant_id");
CREATE INDEX "Shop_owner_id_idx" ON "Shop"("owner_id");
CREATE INDEX "Shop_slug_idx" ON "Shop"("slug");
CREATE INDEX "Shop_merchant_id_idx" ON "Shop"("merchant_id");
CREATE INDEX "Shop_status_idx" ON "Shop"("status");
CREATE INDEX "Shop_is_active_idx" ON "Shop"("is_active");

ALTER TABLE "Shop" ADD CONSTRAINT "Shop_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shops pour marchands boutique existants + marchands ayant déjà des produits
INSERT INTO "Shop" (
    "id", "owner_id", "name", "slug", "description", "logo", "cover_image",
    "phone", "whatsapp", "email", "merchant_id", "status", "is_active",
    "created_at", "updated_at"
)
SELECT
    'shop_' || m."id",
    m."owner_id",
    m."business_name",
    m."slug",
    m."description",
    m."logo",
    m."cover_image",
    m."phone",
    m."whatsapp",
    m."email",
    m."id",
    CASE WHEN m."is_active" THEN 'ACTIVE'::"ShopStatus" ELSE 'DRAFT'::"ShopStatus" END,
    m."is_active",
    m."created_at",
    NOW()
FROM "Merchant" m
LEFT JOIN "Category" c ON c."id" = m."category_id"
WHERE c."slug" = 'boutiques'
   OR EXISTS (SELECT 1 FROM "Product" p WHERE p."merchant_id" = m."id");

-- Product : merchant_id -> shop_id
ALTER TABLE "Product" ADD COLUMN "shop_id" TEXT;

UPDATE "Product" p
SET "shop_id" = 'shop_' || p."merchant_id"
WHERE EXISTS (SELECT 1 FROM "Shop" s WHERE s."id" = 'shop_' || p."merchant_id");

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_merchant_id_fkey";
DROP INDEX IF EXISTS "Product_merchant_id_slug_key";
DROP INDEX IF EXISTS "Product_merchant_id_status_idx";

ALTER TABLE "Product" DROP COLUMN "merchant_id";

ALTER TABLE "Product" ALTER COLUMN "shop_id" SET NOT NULL;

ALTER TABLE "Product" ADD CONSTRAINT "Product_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Product_shop_id_slug_key" ON "Product"("shop_id", "slug");
CREATE INDEX "Product_shop_id_status_idx" ON "Product"("shop_id", "status");

-- Order : merchant_id optionnel + shop_id requis
ALTER TABLE "Order" ADD COLUMN "shop_id" TEXT;

UPDATE "Order" o
SET "shop_id" = 'shop_' || o."merchant_id"
WHERE EXISTS (SELECT 1 FROM "Shop" s WHERE s."id" = 'shop_' || o."merchant_id");

ALTER TABLE "Order" ALTER COLUMN "merchant_id" DROP NOT NULL;

ALTER TABLE "Order" ALTER COLUMN "shop_id" SET NOT NULL;

ALTER TABLE "Order" ADD CONSTRAINT "Order_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Order_merchant_id_status_idx";
CREATE INDEX "Order_shop_id_status_idx" ON "Order"("shop_id", "status");
CREATE INDEX "Order_merchant_id_status_idx" ON "Order"("merchant_id", "status");

-- PaymentTransaction : merchant_id optionnel + shop_id
ALTER TABLE "PaymentTransaction" ADD COLUMN "shop_id" TEXT;
ALTER TABLE "PaymentTransaction" ALTER COLUMN "merchant_id" DROP NOT NULL;

UPDATE "PaymentTransaction" pt
SET "shop_id" = 'shop_' || pt."merchant_id"
WHERE pt."purpose" = 'ORDER'
  AND pt."merchant_id" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "Shop" s WHERE s."id" = 'shop_' || pt."merchant_id");

ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "PaymentTransaction_shop_id_idx" ON "PaymentTransaction"("shop_id");

ALTER TABLE "PaymentTransaction" DROP CONSTRAINT IF EXISTS "PaymentTransaction_merchant_id_fkey";
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
