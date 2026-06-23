-- AlterTable
ALTER TABLE "DeliveryJob" ADD COLUMN "proof_otp" TEXT,
ADD COLUMN "proof_otp_expires_at" TIMESTAMP(3),
ADD COLUMN "proof_confirmed_at" TIMESTAMP(3);
