-- Monnaie cash à la livraison (info livreur)
ALTER TABLE "Order" ADD COLUMN "food_cash_exact" BOOLEAN;
ALTER TABLE "Order" ADD COLUMN "food_cash_tender_amount" INTEGER;
