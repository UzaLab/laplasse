-- DN-7.2 / DN-7.3 : onboarding adresse + seuil alerte dispatch
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "LogisticsPartner" ADD COLUMN IF NOT EXISTS "dispatch_pending_alert_minutes" INTEGER NOT NULL DEFAULT 5;
