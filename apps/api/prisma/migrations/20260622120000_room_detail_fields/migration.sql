-- Room detail display fields (max guests, surface) — capacity remains inventory stock
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "max_guests" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN IF NOT EXISTS "surface_sqm" INTEGER;
