-- Allergènes par plat (tableau de chaînes)
ALTER TABLE "MenuItem" ADD COLUMN "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
