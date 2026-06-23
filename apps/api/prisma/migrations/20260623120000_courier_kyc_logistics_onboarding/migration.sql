-- Courier KYC documents
ALTER TABLE "CourierProfile" ADD COLUMN "id_document_type" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN "id_document_number" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN "id_document_url" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN "license_document_url" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN "kyc_submitted_at" TIMESTAMP(3);
ALTER TABLE "CourierProfile" ADD COLUMN "kyc_reviewed_at" TIMESTAMP(3);
ALTER TABLE "CourierProfile" ADD COLUMN "kyc_rejection_note" TEXT;

-- Logistics partner onboarding (DN-7.2)
ALTER TABLE "LogisticsPartner" ADD COLUMN "fleet_size_range" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN "vehicle_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LogisticsPartner" ADD COLUMN "rccm_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN "kyc_document_url" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN "payout_method" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN "payout_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN "onboarding_step" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LogisticsPartner" ADD COLUMN "auto_dispatch_default" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LogisticsPartner" ADD COLUMN "sla_eta_default_minutes" INTEGER;

CREATE TABLE "LogisticsPartnerServiceArea" (
    "id" TEXT NOT NULL,
    "logistics_partner_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,

    CONSTRAINT "LogisticsPartnerServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LogisticsPartnerServiceArea_logistics_partner_id_commune_id_key" ON "LogisticsPartnerServiceArea"("logistics_partner_id", "commune_id");
CREATE INDEX "LogisticsPartnerServiceArea_commune_id_idx" ON "LogisticsPartnerServiceArea"("commune_id");

ALTER TABLE "LogisticsPartnerServiceArea" ADD CONSTRAINT "LogisticsPartnerServiceArea_logistics_partner_id_fkey" FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LogisticsPartnerServiceArea" ADD CONSTRAINT "LogisticsPartnerServiceArea_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE CASCADE ON UPDATE CASCADE;
