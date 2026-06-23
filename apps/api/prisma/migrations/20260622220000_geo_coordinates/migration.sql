-- GeoCountry + coordonnées GPS sur villes et communes

CREATE TABLE "GeoCountry" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoCountry_pkey" PRIMARY KEY ("code")
);

ALTER TABLE "GeoCity" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "GeoCity" ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "GeoCommune" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "GeoCommune" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Pays (centres carte par défaut)
INSERT INTO "GeoCountry" ("code", "name", "latitude", "longitude", "is_active", "updated_at") VALUES
  ('CI', 'Côte d''Ivoire', 5.3599517, -4.0082563, true, CURRENT_TIMESTAMP),
  ('BF', 'Burkina Faso', 12.3714277, -1.5196603, true, CURRENT_TIMESTAMP),
  ('SN', 'Sénégal', 14.716677, -17.467686, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Villes principales
UPDATE "GeoCity" SET "latitude" = 5.3599517, "longitude" = -4.0082563 WHERE "country" = 'CI' AND "slug" = 'abidjan';
UPDATE "GeoCity" SET "latitude" = 12.3714277, "longitude" = -1.5196603 WHERE "country" = 'BF' AND "slug" = 'ouagadougou';
UPDATE "GeoCity" SET "latitude" = 11.1781, "longitude" = -4.2894 WHERE "country" = 'BF' AND "slug" = 'bobo-dioulasso';
UPDATE "GeoCity" SET "latitude" = 14.716677, "longitude" = -17.467686 WHERE "country" = 'SN' AND "slug" = 'dakar';

-- Communes Abidjan (centres approximatifs OSM)
UPDATE "GeoCommune" c SET "latitude" = v.lat, "longitude" = v.lng
FROM "GeoCity" ci,
(VALUES
  ('cocody', 5.3600, -3.9867),
  ('plateau', 5.3197, -4.0267),
  ('marcory', 5.3097, -3.9783),
  ('yopougon', 5.3364, -4.0827),
  ('adjame', 5.3509, -4.0219),
  ('koumassi', 5.3056, -3.9458),
  ('treichville', 5.2897, -4.0075),
  ('abobo', 5.4167, -4.0167),
  ('port-bouet', 5.2536, -3.9242),
  ('attecoube', 5.3297, -4.0264),
  ('bingerville', 5.3558, -3.8894)
) AS v(slug, lat, lng)
WHERE c."city_id" = ci."id" AND ci."country" = 'CI' AND ci."slug" = 'abidjan' AND c."slug" = v.slug;
