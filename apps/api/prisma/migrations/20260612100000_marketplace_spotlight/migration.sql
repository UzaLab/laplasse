-- AlterEnum
ALTER TYPE "AdPlacement" ADD VALUE 'MARKETPLACE';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "marketplace_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- Index pour les boutiques mises en avant
CREATE INDEX "Shop_marketplace_featured_idx" ON "Shop"("marketplace_featured");

-- Limite par défaut du carrousel marketplace
INSERT INTO "PlatformSetting" ("key", "value", "updated_at")
VALUES ('marketplace_spotlight_limit', '8', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
