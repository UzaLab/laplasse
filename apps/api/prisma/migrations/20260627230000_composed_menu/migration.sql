-- Migration: ComposedMenu + ComposedMenuSlot (formules / menus composés)
CREATE TABLE "ComposedMenu" (
  "id"          TEXT NOT NULL,
  "merchant_id" TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "price"       INTEGER NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'XOF',
  "image_url"   TEXT,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComposedMenu_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComposedMenuSlot" (
  "id"               TEXT NOT NULL,
  "composed_menu_id" TEXT NOT NULL,
  "label"            TEXT NOT NULL,
  "sort_order"       INTEGER NOT NULL DEFAULT 0,
  "required"         BOOLEAN NOT NULL DEFAULT true,
  "item_choices"     TEXT[],
  CONSTRAINT "ComposedMenuSlot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ComposedMenu"
  ADD CONSTRAINT "ComposedMenu_merchant_id_fkey"
  FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComposedMenuSlot"
  ADD CONSTRAINT "ComposedMenuSlot_composed_menu_id_fkey"
  FOREIGN KEY ("composed_menu_id") REFERENCES "ComposedMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ComposedMenu_merchant_id_sort_order_idx" ON "ComposedMenu"("merchant_id", "sort_order");
CREATE INDEX "ComposedMenuSlot_composed_menu_id_idx" ON "ComposedMenuSlot"("composed_menu_id");
