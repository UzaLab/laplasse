-- Allow a user to own multiple merchants
-- Remove unique constraint on owner_id in Merchant table

DROP INDEX IF EXISTS "Merchant_owner_id_key";
