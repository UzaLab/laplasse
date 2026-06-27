-- Migration: product made-to-order + variant is_disabled

ALTER TABLE "Product"
  ADD COLUMN "is_made_to_order" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProductVariant"
  ADD COLUMN "is_disabled" BOOLEAN NOT NULL DEFAULT false;
