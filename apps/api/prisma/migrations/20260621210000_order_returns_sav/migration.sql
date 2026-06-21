-- Demandes de retour / SAV marketplace
CREATE TYPE "OrderReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');

CREATE TABLE "OrderReturn" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_id" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "OrderReturnStatus" NOT NULL DEFAULT 'PENDING',
    "merchant_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "OrderReturn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderReturn_order_id_key" ON "OrderReturn"("order_id");
CREATE INDEX "OrderReturn_shop_id_status_idx" ON "OrderReturn"("shop_id", "status");
CREATE INDEX "OrderReturn_user_id_idx" ON "OrderReturn"("user_id");

ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
