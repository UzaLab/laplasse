-- Courier KYC documents
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "id_document_type" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "id_document_number" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "id_document_url" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "license_document_url" TEXT;
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "kyc_submitted_at" TIMESTAMP(3);
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "kyc_reviewed_at" TIMESTAMP(3);
ALTER TABLE "CourierProfile" ADD COLUMN IF NOT EXISTS "kyc_rejection_note" TEXT;

-- Logistics partner onboarding (DN-7.2)
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "fleet_size_range" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "vehicle_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "rccm_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "kyc_document_url" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "payout_method" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "payout_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "onboarding_step" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "auto_dispatch_default" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "sla_eta_default_minutes" INTEGER;

CREATE TABLE IF NOT EXISTS "LogisticsPartnerServiceArea" (
    "id" TEXT NOT NULL,
    "logistics_partner_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,

    CONSTRAINT "LogisticsPartnerServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LogisticsPartnerServiceArea_logistics_partner_id_commune_id_key" ON "LogisticsPartnerServiceArea"("logistics_partner_id", "commune_id");
CREATE INDEX IF NOT EXISTS "LogisticsPartnerServiceArea_commune_id_idx" ON "LogisticsPartnerServiceArea"("commune_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LogisticsPartnerServiceArea_logistics_partner_id_fkey'
  ) THEN
    ALTER TABLE "LogisticsPartnerServiceArea" ADD CONSTRAINT "LogisticsPartnerServiceArea_logistics_partner_id_fkey"
      FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LogisticsPartnerServiceArea_commune_id_fkey'
  ) THEN
    ALTER TABLE "LogisticsPartnerServiceArea" ADD CONSTRAINT "LogisticsPartnerServiceArea_commune_id_fkey"
      FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
