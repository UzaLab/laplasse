-- Promo scope catégorie
ALTER TABLE "Promotion" ADD COLUMN "category_id" TEXT;
CREATE INDEX "Promotion_category_id_idx" ON "Promotion"("category_id");
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Avis produits
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductReview_product_id_user_id_key" ON "ProductReview"("product_id", "user_id");
CREATE INDEX "ProductReview_product_id_idx" ON "ProductReview"("product_id");
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Menu restaurant
CREATE TABLE "MenuSection" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MenuSection_shop_id_sort_order_idx" ON "MenuSection"("shop_id", "sort_order");
ALTER TABLE "MenuSection" ADD CONSTRAINT "MenuSection_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "section_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MenuItem_shop_id_sort_order_idx" ON "MenuItem"("shop_id", "sort_order");
CREATE INDEX "MenuItem_section_id_idx" ON "MenuItem"("section_id");
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "MenuSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tarif nuit hôtel
ALTER TABLE "MerchantService" ADD COLUMN "nightly_rate" INTEGER;
