-- Commande restaurant native : MenuItem dans panier/commande, sans produit miroir ni shop obligatoire

CREATE TYPE "OrderSource" AS ENUM ('MARKETPLACE', 'FOOD');

ALTER TABLE "CartItem" ALTER COLUMN "product_id" DROP NOT NULL;
ALTER TABLE "CartItem" ADD COLUMN "menu_item_id" TEXT;

ALTER TABLE "Order" ALTER COLUMN "shop_id" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "order_source" "OrderSource" NOT NULL DEFAULT 'MARKETPLACE';

ALTER TABLE "OrderItem" ADD COLUMN "menu_item_id" TEXT;

ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CartItem_menu_item_id_idx" ON "CartItem"("menu_item_id");
CREATE INDEX "OrderItem_menu_item_id_idx" ON "OrderItem"("menu_item_id");
CREATE INDEX "Order_order_source_idx" ON "Order"("order_source");
