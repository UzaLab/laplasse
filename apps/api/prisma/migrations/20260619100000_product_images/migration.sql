-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductImage_product_id_sort_order_idx" ON "ProductImage"("product_id", "sort_order");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill depuis image_url existante
INSERT INTO "ProductImage" ("id", "product_id", "url", "sort_order", "created_at")
SELECT 'pimg_' || "id", "id", "image_url", 0, CURRENT_TIMESTAMP
FROM "Product"
WHERE "image_url" IS NOT NULL AND trim("image_url") <> '';
