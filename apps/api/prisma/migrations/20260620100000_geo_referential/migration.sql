-- Référentiel géographique : villes et communes (V2 slice F1)

CREATE TABLE "GeoCity" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoCity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeoCommune" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoCommune_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GeoCity_country_slug_key" ON "GeoCity"("country", "slug");
CREATE INDEX "GeoCity_country_is_active_idx" ON "GeoCity"("country", "is_active");

CREATE UNIQUE INDEX "GeoCommune_city_id_slug_key" ON "GeoCommune"("city_id", "slug");
CREATE INDEX "GeoCommune_city_id_is_active_idx" ON "GeoCommune"("city_id", "is_active");

ALTER TABLE "GeoCommune" ADD CONSTRAINT "GeoCommune_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "GeoCity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
