-- V0.8 — Loyalty, Referral, Promotions, Notifications enrichies

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "LoyaltyTier" AS ENUM ('EXPLORER', 'LOCAL', 'INSIDER', 'AMBASSADOR');
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE_ITEM', 'EARLY_ACCESS');

-- ── Notification : nouveaux champs ───────────────────────────────────────────

ALTER TABLE "Notification"
  ADD COLUMN "channel"     TEXT        NOT NULL DEFAULT 'in_app',
  ADD COLUMN "data"        JSONB,
  ADD COLUMN "read"        BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- ── Loyalty ──────────────────────────────────────────────────────────────────

CREATE TABLE "LoyaltyAccount" (
  "id"           TEXT         NOT NULL,
  "user_id"      TEXT         NOT NULL,
  "points"       INTEGER      NOT NULL DEFAULT 0,
  "tier"         "LoyaltyTier" NOT NULL DEFAULT 'EXPLORER',
  "total_earned" INTEGER      NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoyaltyAccount_user_id_key" ON "LoyaltyAccount"("user_id");
CREATE INDEX "LoyaltyAccount_user_id_idx" ON "LoyaltyAccount"("user_id");
CREATE INDEX "LoyaltyAccount_tier_idx" ON "LoyaltyAccount"("tier");

ALTER TABLE "LoyaltyAccount"
  ADD CONSTRAINT "LoyaltyAccount_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LoyaltyTransaction" (
  "id"         TEXT         NOT NULL,
  "account_id" TEXT         NOT NULL,
  "points"     INTEGER      NOT NULL,
  "reason"     TEXT         NOT NULL,
  "metadata"   JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoyaltyTransaction_account_id_idx" ON "LoyaltyTransaction"("account_id");
CREATE INDEX "LoyaltyTransaction_created_at_idx" ON "LoyaltyTransaction"("created_at");

ALTER TABLE "LoyaltyTransaction"
  ADD CONSTRAINT "LoyaltyTransaction_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Referral ─────────────────────────────────────────────────────────────────

CREATE TABLE "ReferralCode" (
  "id"         TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "code"       TEXT         NOT NULL,
  "uses_count" INTEGER      NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferralCode_user_id_key" ON "ReferralCode"("user_id");
CREATE UNIQUE INDEX "ReferralCode_code_key"    ON "ReferralCode"("code");
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

ALTER TABLE "ReferralCode"
  ADD CONSTRAINT "ReferralCode_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Referral" (
  "id"               TEXT         NOT NULL,
  "referral_code_id" TEXT         NOT NULL,
  "invited_user_id"  TEXT         NOT NULL,
  "rewarded"         BOOLEAN      NOT NULL DEFAULT false,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Referral_invited_user_id_key" ON "Referral"("invited_user_id");
CREATE INDEX "Referral_referral_code_id_idx" ON "Referral"("referral_code_id");

ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referral_code_id_fkey"
  FOREIGN KEY ("referral_code_id") REFERENCES "ReferralCode"("id") ON UPDATE CASCADE;

ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_invited_user_id_fkey"
  FOREIGN KEY ("invited_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Promotions ───────────────────────────────────────────────────────────────

CREATE TABLE "Promotion" (
  "id"          TEXT           NOT NULL,
  "merchant_id" TEXT           NOT NULL,
  "title"       TEXT           NOT NULL,
  "description" TEXT,
  "type"        "PromotionType" NOT NULL DEFAULT 'PERCENTAGE',
  "value"       DOUBLE PRECISION NOT NULL,
  "code"        TEXT,
  "is_active"   BOOLEAN        NOT NULL DEFAULT true,
  "starts_at"   TIMESTAMP(3)   NOT NULL,
  "ends_at"     TIMESTAMP(3)   NOT NULL,
  "max_uses"    INTEGER,
  "uses_count"  INTEGER        NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");
CREATE INDEX "Promotion_merchant_id_idx" ON "Promotion"("merchant_id");
CREATE INDEX "Promotion_is_active_idx"   ON "Promotion"("is_active");
CREATE INDEX "Promotion_ends_at_idx"     ON "Promotion"("ends_at");

ALTER TABLE "Promotion"
  ADD CONSTRAINT "Promotion_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
