-- File d'attente campagnes publicitaires
ALTER TYPE "AdCampaignStatus" ADD VALUE IF NOT EXISTS 'WAITLISTED';

ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "waitlist_position" INTEGER;
ALTER TABLE "AdCampaign" ADD COLUMN IF NOT EXISTS "duration_days" INTEGER NOT NULL DEFAULT 7;

CREATE INDEX IF NOT EXISTS "AdCampaign_placement_status_idx" ON "AdCampaign"("placement", "status");
