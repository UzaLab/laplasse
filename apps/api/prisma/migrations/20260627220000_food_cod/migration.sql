-- Migration: cash on delivery per restaurant
ALTER TABLE "Merchant" ADD COLUMN "food_accepts_cash" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Merchant" ADD COLUMN "food_cash_max_amount" INTEGER;
