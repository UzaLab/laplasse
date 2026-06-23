-- DN-1.3: offres livreur + timeout
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "offered_to_profile_id" TEXT;
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "offered_at" TIMESTAMP(3);
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "offer_expires_at" TIMESTAMP(3);
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "accepted_at" TIMESTAMP(3);
ALTER TABLE "DeliveryJob" ADD COLUMN IF NOT EXISTS "rejected_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "DeliveryJob_offered_to_profile_id_idx" ON "DeliveryJob"("offered_to_profile_id");
CREATE INDEX IF NOT EXISTS "DeliveryJob_offer_expires_at_idx" ON "DeliveryJob"("offer_expires_at");

ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_offered_to_profile_id_fkey"
  FOREIGN KEY ("offered_to_profile_id") REFERENCES "CourierProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "DeliveryJobOfferRejection" (
  "id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "courier_profile_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT 'rejected',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryJobOfferRejection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryJobOfferRejection_job_id_courier_profile_id_key"
  ON "DeliveryJobOfferRejection"("job_id", "courier_profile_id");
CREATE INDEX IF NOT EXISTS "DeliveryJobOfferRejection_job_id_idx" ON "DeliveryJobOfferRejection"("job_id");

ALTER TABLE "DeliveryJobOfferRejection" ADD CONSTRAINT "DeliveryJobOfferRejection_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "DeliveryJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryJobOfferRejection" ADD CONSTRAINT "DeliveryJobOfferRejection_courier_profile_id_fkey"
  FOREIGN KEY ("courier_profile_id") REFERENCES "CourierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DN-1.4: wallet livreur
CREATE TYPE "CourierWalletEntryType" AS ENUM ('EARNING', 'BONUS', 'PENALTY', 'PAYOUT');

CREATE TABLE IF NOT EXISTS "CourierWallet" (
  "id" TEXT NOT NULL,
  "courier_id" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourierWallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourierWallet_courier_id_key" ON "CourierWallet"("courier_id");

CREATE TABLE IF NOT EXISTS "CourierWalletEntry" (
  "id" TEXT NOT NULL,
  "wallet_id" TEXT NOT NULL,
  "job_id" TEXT,
  "amount" INTEGER NOT NULL,
  "type" "CourierWalletEntryType" NOT NULL,
  "label" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourierWalletEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourierWalletEntry_job_id_key" ON "CourierWalletEntry"("job_id");
CREATE INDEX IF NOT EXISTS "CourierWalletEntry_wallet_id_idx" ON "CourierWalletEntry"("wallet_id");

ALTER TABLE "CourierWallet" ADD CONSTRAINT "CourierWallet_courier_id_fkey"
  FOREIGN KEY ("courier_id") REFERENCES "CourierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierWalletEntry" ADD CONSTRAINT "CourierWalletEntry_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "CourierWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierWalletEntry" ADD CONSTRAINT "CourierWalletEntry_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "DeliveryJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
