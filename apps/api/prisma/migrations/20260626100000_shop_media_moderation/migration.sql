-- AlterEnum ShopStatus
ALTER TYPE "ShopStatus" ADD VALUE 'PENDING_REVIEW';

-- AlterEnum ProductStatus
ALTER TYPE "ProductStatus" ADD VALUE 'PENDING_REVIEW';

-- CreateTable ShopMedia
CREATE TABLE "ShopMedia" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopMedia_shop_id_idx" ON "ShopMedia"("shop_id");

ALTER TABLE "ShopMedia" ADD CONSTRAINT "ShopMedia_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
