-- Migration: item_tags (halal, vegan, etc.) + contains_alcohol sur MenuItem (§4.4 + §13.4)
ALTER TABLE "MenuItem" ADD COLUMN "item_tags" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "MenuItem" ADD COLUMN "contains_alcohol" BOOLEAN NOT NULL DEFAULT false;
