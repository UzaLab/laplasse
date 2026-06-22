-- Slug URL pour prestations / chambres (unique par établissement)

ALTER TABLE "MerchantService" ADD COLUMN "slug" TEXT;

CREATE OR REPLACE FUNCTION temp_slugify(txt TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN LEFT(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LOWER(TRANSLATE(
          txt,
          'àáâãäåèéêëìíîïòóôõöùúûüýÿçñÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÇÑ',
          'aaaaaaeeeeiiiioooooouuuuyycnaaaaaaeeeeiiiioooooouuuuyycn'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '(^-+|-+$)', '', 'g'
    ),
    80
  );
END;
$$ LANGUAGE plpgsql;

WITH base AS (
  SELECT
    id,
    merchant_id,
    COALESCE(NULLIF(temp_slugify(name), ''), 'prestation') AS base_slug,
    created_at
  FROM "MerchantService"
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY merchant_id, base_slug
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM base
)
UPDATE "MerchantService" ms
SET slug = CASE
  WHEN r.rn = 1 THEN r.base_slug
  ELSE r.base_slug || '-' || (r.rn - 1)::TEXT
END
FROM ranked r
WHERE ms.id = r.id;

ALTER TABLE "MerchantService" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "MerchantService_merchant_id_slug_key"
  ON "MerchantService"("merchant_id", "slug");

DROP FUNCTION temp_slugify(TEXT);
