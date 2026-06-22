-- Position GPS coursier pour suivi livraison (MVP)
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "courier_latitude" DOUBLE PRECISION;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "courier_longitude" DOUBLE PRECISION;
