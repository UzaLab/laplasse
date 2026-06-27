-- Mode pause (fermeture manuelle ou momentanée) du restaurant
ALTER TABLE "Merchant" ADD COLUMN "food_is_paused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Merchant" ADD COLUMN "food_pause_until" TIMESTAMP(3);
