-- Staff ↔ prestations (N-N) + capacité par praticien

CREATE TABLE "MerchantStaffService" (
    "staff_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantStaffService_pkey" PRIMARY KEY ("staff_id","service_id")
);

ALTER TABLE "MerchantStaff" ADD COLUMN "max_concurrent_slots" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "MerchantStaff" ADD COLUMN "max_daily_bookings" INTEGER;

ALTER TABLE "MerchantStaffService" ADD CONSTRAINT "MerchantStaffService_staff_id_fkey"
    FOREIGN KEY ("staff_id") REFERENCES "MerchantStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantStaffService" ADD CONSTRAINT "MerchantStaffService_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "MerchantService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "MerchantStaffService_service_id_idx" ON "MerchantStaffService"("service_id");

-- Rétrocompat : une prestation déjà liée via staff_id → entrée junction
INSERT INTO "MerchantStaffService" ("staff_id", "service_id")
SELECT "staff_id", "id"
FROM "MerchantService"
WHERE "staff_id" IS NOT NULL
ON CONFLICT DO NOTHING;
