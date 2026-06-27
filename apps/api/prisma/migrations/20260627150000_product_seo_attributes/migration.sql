-- Migration: product SEO fields, product-level SKU, image alt_text,
--            CategoryAttribute + ProductAttributeValue, legal_notice on category

-- 1. SEO fields on Product
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "sku"              TEXT,
  ADD COLUMN IF NOT EXISTS "seo_title"        TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description"  TEXT;

-- 2. Alt text on ProductImage
ALTER TABLE "ProductImage"
  ADD COLUMN IF NOT EXISTS "alt_text" TEXT;

-- 3. Legal notice on ProductCategory
ALTER TABLE "ProductCategory"
  ADD COLUMN IF NOT EXISTS "legal_notice" TEXT;

-- 4. Enum CategoryAttributeType
DO $$ BEGIN
  CREATE TYPE "CategoryAttributeType" AS ENUM ('TEXT', 'NUMBER', 'ENUM', 'BOOLEAN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. CategoryAttribute table
CREATE TABLE IF NOT EXISTS "CategoryAttribute" (
  "id"             TEXT NOT NULL,
  "category_id"    TEXT NOT NULL,
  "label"          TEXT NOT NULL,
  "key"            TEXT NOT NULL,
  "attribute_type" "CategoryAttributeType" NOT NULL DEFAULT 'TEXT',
  "is_required"    BOOLEAN NOT NULL DEFAULT false,
  "sort_order"     INTEGER NOT NULL DEFAULT 0,
  "enum_options"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "unit"           TEXT,
  "placeholder"    TEXT,
  CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CategoryAttribute_category_id_key_key" UNIQUE ("category_id", "key"),
  CONSTRAINT "CategoryAttribute_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "ProductCategory"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CategoryAttribute_category_id_sort_order_idx"
  ON "CategoryAttribute"("category_id", "sort_order");

-- 6. ProductAttributeValue table
CREATE TABLE IF NOT EXISTS "ProductAttributeValue" (
  "id"           TEXT NOT NULL,
  "product_id"   TEXT NOT NULL,
  "attribute_id" TEXT NOT NULL,
  "value"        TEXT NOT NULL,
  CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductAttributeValue_product_id_attribute_id_key" UNIQUE ("product_id", "attribute_id"),
  CONSTRAINT "ProductAttributeValue_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductAttributeValue_attribute_id_fkey"
    FOREIGN KEY ("attribute_id") REFERENCES "CategoryAttribute"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductAttributeValue_product_id_idx"
  ON "ProductAttributeValue"("product_id");
