-- Migration: add avg_rating to Merchant for denormalized hub display
ALTER TABLE "Merchant" ADD COLUMN "avg_rating" DOUBLE PRECISION;

-- Backfill: compute avg rating from existing approved reviews
UPDATE "Merchant" m
SET "avg_rating" = sub.avg_r
FROM (
  SELECT merchant_id, ROUND(AVG(rating)::numeric, 1) AS avg_r
  FROM "Review"
  WHERE status = 'APPROVED'
  GROUP BY merchant_id
) sub
WHERE m.id = sub.merchant_id;
