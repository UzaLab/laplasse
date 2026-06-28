-- Migration: food_opening_hours JSON par restaurant (§3.4 horaires différenciés)
ALTER TABLE "Merchant" ADD COLUMN "food_opening_hours" JSONB;
