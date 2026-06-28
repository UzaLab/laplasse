-- Pré-commandes food : préférence établissement + créneau sur commande
ALTER TABLE "Merchant" ADD COLUMN "food_accepts_preorders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Order" ADD COLUMN "food_preorder_for" TIMESTAMP(3);
