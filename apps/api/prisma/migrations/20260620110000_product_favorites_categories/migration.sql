-- Product favorites
CREATE TABLE "ProductFavorite" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFavorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductFavorite_user_id_product_id_key" ON "ProductFavorite"("user_id", "product_id");
CREATE INDEX "ProductFavorite_user_id_idx" ON "ProductFavorite"("user_id");
CREATE INDEX "ProductFavorite_product_id_idx" ON "ProductFavorite"("product_id");

ALTER TABLE "ProductFavorite" ADD CONSTRAINT "ProductFavorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductFavorite" ADD CONSTRAINT "ProductFavorite_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product categories (marketplace taxonomy)
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
CREATE INDEX "ProductCategory_parent_id_sort_order_idx" ON "ProductCategory"("parent_id", "sort_order");
CREATE INDEX "ProductCategory_is_active_idx" ON "ProductCategory"("is_active");

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProductCategoryCountry" (
    "category_id" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,

    CONSTRAINT "ProductCategoryCountry_pkey" PRIMARY KEY ("category_id","country_code")
);

CREATE INDEX "ProductCategoryCountry_country_code_idx" ON "ProductCategoryCountry"("country_code");

ALTER TABLE "ProductCategoryCountry" ADD CONSTRAINT "ProductCategoryCountry_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Product" ADD COLUMN "category_id" TEXT;

CREATE INDEX "Product_category_id_idx" ON "Product"("category_id");

ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shop modular capabilities
ALTER TABLE "Shop" ADD COLUMN "enabled_modules" TEXT[] DEFAULT ARRAY['catalog']::TEXT[];
