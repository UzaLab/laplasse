-- Modificateurs menu (suppléments, tailles) + délai préparation food

ALTER TABLE "Merchant" ADD COLUMN "food_prep_minutes" INTEGER NOT NULL DEFAULT 25;

ALTER TABLE "MenuItem" ADD COLUMN "prep_minutes" INTEGER;

CREATE TABLE "MenuModifierGroup" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_select" INTEGER NOT NULL DEFAULT 0,
    "max_select" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuModifierGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuModifierOption" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MenuModifierOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MenuModifierGroup_menu_item_id_sort_order_idx" ON "MenuModifierGroup"("menu_item_id", "sort_order");
CREATE INDEX "MenuModifierOption_group_id_sort_order_idx" ON "MenuModifierOption"("group_id", "sort_order");

ALTER TABLE "MenuModifierGroup" ADD CONSTRAINT "MenuModifierGroup_menu_item_id_fkey"
  FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuModifierOption" ADD CONSTRAINT "MenuModifierOption_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "MenuModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem" ADD COLUMN "selected_modifiers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "OrderItem" ADD COLUMN "modifiers" JSONB NOT NULL DEFAULT '[]';
