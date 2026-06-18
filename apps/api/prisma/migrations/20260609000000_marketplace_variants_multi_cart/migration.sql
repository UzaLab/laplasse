-- ProductVariant
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductVariant_product_id_idx" ON "ProductVariant"("product_id");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CartItem: optional variant + multi-merchant (drop cart.merchant_id)
ALTER TABLE "CartItem" ADD COLUMN "variant_id" TEXT;

DROP INDEX IF EXISTS "CartItem_cart_id_product_id_key";
CREATE UNIQUE INDEX "CartItem_cart_id_product_id_variant_id_key"
    ON "CartItem"("cart_id", "product_id", COALESCE("variant_id", ''));

CREATE INDEX "CartItem_cart_id_product_id_variant_id_idx"
    ON "CartItem"("cart_id", "product_id", "variant_id");

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cart" DROP COLUMN IF EXISTS "merchant_id";

-- OrderItem: variant snapshot
ALTER TABLE "OrderItem" ADD COLUMN "variant_id" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variant_name" TEXT;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variant_id_fkey"
    FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
