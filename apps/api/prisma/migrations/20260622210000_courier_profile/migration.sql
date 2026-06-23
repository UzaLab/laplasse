-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COURIER';

-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'OFFLINE');
CREATE TYPE "CourierKind" AS ENUM ('INDEPENDENT', 'MERCHANT_STAFF', 'PARTNER_FLEET');

-- CreateTable
CREATE TABLE "CourierProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "CourierKind" NOT NULL DEFAULT 'INDEPENDENT',
    "logistics_partner_id" TEXT,
    "merchant_id" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CI',
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle" "DeliveryVehicle" NOT NULL DEFAULT 'MOTO',
    "plate_number" TEXT,
    "status" "CourierStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "completed_jobs" INTEGER NOT NULL DEFAULT 0,
    "cancellation_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_latitude" DOUBLE PRECISION,
    "current_longitude" DOUBLE PRECISION,
    "last_location_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierProfile_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DeliveryJob" ADD COLUMN "courier_profile_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CourierProfile_user_id_key" ON "CourierProfile"("user_id");
CREATE INDEX "CourierProfile_country_city_status_idx" ON "CourierProfile"("country", "city", "status");
CREATE INDEX "CourierProfile_is_online_status_idx" ON "CourierProfile"("is_online", "status");
CREATE INDEX "DeliveryJob_courier_profile_id_idx" ON "DeliveryJob"("courier_profile_id");

-- AddForeignKey
ALTER TABLE "CourierProfile" ADD CONSTRAINT "CourierProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_courier_profile_id_fkey" FOREIGN KEY ("courier_profile_id") REFERENCES "CourierProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
