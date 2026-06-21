-- Tarification hôtel dynamique : week-end, haute saison, séjour minimum
ALTER TABLE "MerchantService" ADD COLUMN "weekend_nightly_rate" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN "peak_nightly_rate" INTEGER;
ALTER TABLE "MerchantService" ADD COLUMN "peak_months" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "MerchantService" ADD COLUMN "min_stay_nights" INTEGER NOT NULL DEFAULT 1;
