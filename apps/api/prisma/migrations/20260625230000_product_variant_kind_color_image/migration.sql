-- Variantes enrichies : type couleur + image par variante
CREATE TYPE "ProductVariantKind" AS ENUM ('TEXT', 'COLOR');

ALTER TABLE "ProductVariant" ADD COLUMN "kind" "ProductVariantKind" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "ProductVariant" ADD COLUMN "color_hex" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN "image_url" TEXT;
