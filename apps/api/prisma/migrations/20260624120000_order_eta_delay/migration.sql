-- DN-6.5 : ETA initial, alertes retard
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eta_initial_arrival_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eta_delay_notified_at" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eta_delayed" BOOLEAN NOT NULL DEFAULT false;
