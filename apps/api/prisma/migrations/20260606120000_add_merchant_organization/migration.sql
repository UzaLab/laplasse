-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('CHAIN', 'GROUP', 'MULTI_SITE');

-- CreateTable
CREATE TABLE "MerchantOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "owner_id" TEXT NOT NULL,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantOrganization_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN "organization_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantOrganization_owner_id_key" ON "MerchantOrganization"("owner_id");

-- CreateIndex
CREATE INDEX "MerchantOrganization_owner_id_idx" ON "MerchantOrganization"("owner_id");

-- CreateIndex
CREATE INDEX "Merchant_organization_id_idx" ON "Merchant"("organization_id");

-- AddForeignKey
ALTER TABLE "MerchantOrganization" ADD CONSTRAINT "MerchantOrganization_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "MerchantOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
