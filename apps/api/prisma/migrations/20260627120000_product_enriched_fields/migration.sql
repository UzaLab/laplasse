-- Migration: product enriched fields (condition, origin, tags, weight, dimensions, preparation_delay, short_description)

CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED_GOOD', 'USED_FAIR', 'REFURBISHED');
CREATE TYPE "ProductOrigin" AS ENUM ('LOCAL_CI', 'IMPORTED', 'HANDMADE');

ALTER TABLE "Product"
  ADD COLUMN "short_description"      TEXT,
  ADD COLUMN "condition"              "ProductCondition",
  ADD COLUMN "origin"                 "ProductOrigin",
  ADD COLUMN "tags"                   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "weight_grams"           INTEGER,
  ADD COLUMN "dimensions"             TEXT,
  ADD COLUMN "preparation_delay_days" INTEGER;

CREATE INDEX "Product_condition_idx" ON "Product"("condition");
