-- Room listing fields (Airbnb-like) on merchant services
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "image_urls" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "bathrooms" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "beds" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "property_type" TEXT;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "unit_type" TEXT;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "amenities" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "highlights" JSONB NOT NULL DEFAULT '[]';
