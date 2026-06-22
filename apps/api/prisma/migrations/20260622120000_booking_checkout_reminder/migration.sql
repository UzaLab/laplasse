-- Rappel J-1 départ pour séjours hôtel (multi-nuits)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "checkout_reminder_sent_at" TIMESTAMP(3);
