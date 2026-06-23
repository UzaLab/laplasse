-- Order ETA (DN-6)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prep_started_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prep_eta_minutes" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eta_arrival_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eta_updated_at" TIMESTAMP(3);

-- DeliveryJob: split commissions + ETA dynamique + pickup GPS
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "pickup_latitude" DOUBLE PRECISION;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "pickup_longitude" DOUBLE PRECISION;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "delivery_fee_split" JSONB;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "eta_arrival_at" TIMESTAMP(3);
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "eta_travel_minutes" INTEGER;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "eta_updated_at" TIMESTAMP(3);
