-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT,
    "city_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address_detail" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAddress_user_id_idx" ON "UserAddress"("user_id");

-- CreateIndex
CREATE INDEX "UserAddress_user_id_is_default_idx" ON "UserAddress"("user_id", "is_default");

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
