-- Shop ↔ ProductCategory (catégories activées par boutique)
CREATE TABLE "ShopProductCategory" (
    "shop_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopProductCategory_pkey" PRIMARY KEY ("shop_id","category_id")
);

CREATE INDEX "ShopProductCategory_category_id_idx" ON "ShopProductCategory"("category_id");

ALTER TABLE "ShopProductCategory" ADD CONSTRAINT "ShopProductCategory_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopProductCategory" ADD CONSTRAINT "ShopProductCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
