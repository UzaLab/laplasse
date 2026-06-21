-- CreateTable
CREATE TABLE "ShopCollection" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCollection" (
    "product_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("product_id","collection_id")
);

-- CreateIndex
CREATE INDEX "ShopCollection_shop_id_is_active_sort_order_idx" ON "ShopCollection"("shop_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "ShopCollection_shop_id_slug_key" ON "ShopCollection"("shop_id", "slug");

-- CreateIndex
CREATE INDEX "ProductCollection_collection_id_sort_order_idx" ON "ProductCollection"("collection_id", "sort_order");

-- AddForeignKey
ALTER TABLE "ShopCollection" ADD CONSTRAINT "ShopCollection_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "ShopCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
