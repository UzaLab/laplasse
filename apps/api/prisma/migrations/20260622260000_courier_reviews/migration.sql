-- CreateTable
CREATE TABLE "CourierReview" (
    "id" TEXT NOT NULL,
    "courier_profile_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourierReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourierReview_order_id_key" ON "CourierReview"("order_id");

-- CreateIndex
CREATE INDEX "CourierReview_courier_profile_id_idx" ON "CourierReview"("courier_profile_id");

-- CreateIndex
CREATE INDEX "CourierReview_user_id_idx" ON "CourierReview"("user_id");

-- CreateIndex
CREATE INDEX "CourierReview_status_idx" ON "CourierReview"("status");

-- AddForeignKey
ALTER TABLE "CourierReview" ADD CONSTRAINT "CourierReview_courier_profile_id_fkey" FOREIGN KEY ("courier_profile_id") REFERENCES "CourierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierReview" ADD CONSTRAINT "CourierReview_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourierReview" ADD CONSTRAINT "CourierReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
