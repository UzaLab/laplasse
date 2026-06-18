ALTER TABLE "Product" ADD COLUMN "composition" TEXT;
ALTER TABLE "Product" ADD COLUMN "allow_pickup" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "allow_delivery" BOOLEAN NOT NULL DEFAULT true;
