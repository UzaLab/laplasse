-- AlterTable
ALTER TABLE "DeliveryJob" ADD COLUMN "proof_photo_url" TEXT;

-- CreateEnum
CREATE TYPE "DeliveryDisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "DeliveryDispute" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "job_id" TEXT,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "DeliveryDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "DeliveryDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryDispute_order_id_key" ON "DeliveryDispute"("order_id");

-- CreateIndex
CREATE INDEX "DeliveryDispute_status_idx" ON "DeliveryDispute"("status");

-- CreateIndex
CREATE INDEX "DeliveryDispute_user_id_idx" ON "DeliveryDispute"("user_id");

-- AddForeignKey
ALTER TABLE "DeliveryDispute" ADD CONSTRAINT "DeliveryDispute_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDispute" ADD CONSTRAINT "DeliveryDispute_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryDispute" ADD CONSTRAINT "DeliveryDispute_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "DeliveryJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
