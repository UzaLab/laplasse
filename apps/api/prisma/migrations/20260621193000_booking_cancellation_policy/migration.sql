-- Politique d'annulation configurable par établissement (hôtels & booking vertical)
ALTER TABLE "MerchantBookingSettings" ADD COLUMN "cancellation_policy" TEXT;
