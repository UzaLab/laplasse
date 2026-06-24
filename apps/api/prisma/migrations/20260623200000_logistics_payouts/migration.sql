-- DN-7.4 : finances partenaire + champs onboarding (idempotent vs 20260623120000)
DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "fleet_size_range" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "vehicle_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "rccm_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "kyc_document_url" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "payout_method" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "payout_number" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "onboarding_step" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "auto_dispatch_default" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "sla_eta_default_minutes" INTEGER;

CREATE TABLE IF NOT EXISTS "LogisticsPartnerServiceArea" (
  "id" TEXT NOT NULL,
  "logistics_partner_id" TEXT NOT NULL,
  "commune_id" TEXT NOT NULL,
  CONSTRAINT "LogisticsPartnerServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LogisticsPartnerServiceArea_logistics_partner_id_commune_id_key"
  ON "LogisticsPartnerServiceArea"("logistics_partner_id", "commune_id");
CREATE INDEX IF NOT EXISTS "LogisticsPartnerServiceArea_logistics_partner_id_idx"
  ON "LogisticsPartnerServiceArea"("logistics_partner_id");
CREATE INDEX IF NOT EXISTS "LogisticsPartnerServiceArea_commune_id_idx"
  ON "LogisticsPartnerServiceArea"("commune_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LogisticsPartnerServiceArea_logistics_partner_id_fkey'
  ) THEN
    ALTER TABLE "LogisticsPartnerServiceArea"
      ADD CONSTRAINT "LogisticsPartnerServiceArea_logistics_partner_id_fkey"
      FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LogisticsPartnerServiceArea_commune_id_fkey'
  ) THEN
    ALTER TABLE "LogisticsPartnerServiceArea"
      ADD CONSTRAINT "LogisticsPartnerServiceArea_commune_id_fkey"
      FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LogisticsPartnerPayout" (
  "id" TEXT NOT NULL,
  "logistics_partner_id" TEXT NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "paid_at" TIMESTAMP(3),
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LogisticsPartnerPayout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LogisticsPartnerPayout_logistics_partner_id_period_start_idx"
  ON "LogisticsPartnerPayout"("logistics_partner_id", "period_start");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LogisticsPartnerPayout_logistics_partner_id_fkey'
  ) THEN
    ALTER TABLE "LogisticsPartnerPayout"
      ADD CONSTRAINT "LogisticsPartnerPayout_logistics_partner_id_fkey"
      FOREIGN KEY ("logistics_partner_id") REFERENCES "LogisticsPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
