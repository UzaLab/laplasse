-- CreateTable
CREATE TABLE "CourierServiceZone" (
    "id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "all_communes" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierServiceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierServiceZoneCommune" (
    "zone_id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,

    CONSTRAINT "CourierServiceZoneCommune_pkey" PRIMARY KEY ("zone_id","commune_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourierServiceZone_courier_id_city_id_key" ON "CourierServiceZone"("courier_id", "city_id");
CREATE INDEX "CourierServiceZone_courier_id_is_active_idx" ON "CourierServiceZone"("courier_id", "is_active");
CREATE INDEX "CourierServiceZoneCommune_commune_id_idx" ON "CourierServiceZoneCommune"("commune_id");

-- AddForeignKey
ALTER TABLE "CourierServiceZone" ADD CONSTRAINT "CourierServiceZone_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "CourierProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierServiceZone" ADD CONSTRAINT "CourierServiceZone_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierServiceZoneCommune" ADD CONSTRAINT "CourierServiceZoneCommune_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "CourierServiceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierServiceZoneCommune" ADD CONSTRAINT "CourierServiceZoneCommune_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "GeoCommune"("id") ON DELETE CASCADE ON UPDATE CASCADE;
