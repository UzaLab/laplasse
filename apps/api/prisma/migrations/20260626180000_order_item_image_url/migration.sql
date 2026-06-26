-- Snapshot image par ligne de commande (thumbnail au moment de l'achat)
ALTER TABLE "OrderItem" ADD COLUMN "image_url" TEXT;
