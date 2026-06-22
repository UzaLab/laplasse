-- Sprint 17: paiement réservation, recently viewed, settings booking

ALTER TYPE "PaymentPurpose" ADD VALUE IF NOT EXISTS 'BOOKING';

ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_booking_id_key" ON "PaymentTransaction"("booking_id");

DO $$ BEGIN
  ALTER TABLE "PaymentTransaction"
    ADD CONSTRAINT "PaymentTransaction_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "MerchantBookingSettings" ADD COLUMN IF NOT EXISTS "require_payment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MerchantBookingSettings" ADD COLUMN IF NOT EXISTS "deposit_percent" INTEGER NOT NULL DEFAULT 100;

CREATE TABLE IF NOT EXISTS "ProductView" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_key" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CI',
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductView_user_id_viewed_at_idx" ON "ProductView"("user_id", "viewed_at");
CREATE INDEX IF NOT EXISTS "ProductView_guest_key_viewed_at_idx" ON "ProductView"("guest_key", "viewed_at");
CREATE INDEX IF NOT EXISTS "ProductView_product_id_idx" ON "ProductView"("product_id");

CREATE UNIQUE INDEX IF NOT EXISTS "ProductView_user_id_product_id_key"
  ON "ProductView"("user_id", "product_id") WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductView_guest_key_product_id_key"
  ON "ProductView"("guest_key", "product_id") WHERE "guest_key" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "ProductView"
    ADD CONSTRAINT "ProductView_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductView"
    ADD CONSTRAINT "ProductView_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
