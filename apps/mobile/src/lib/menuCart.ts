import type { Cart, CartItem } from '@laplasse/api-client'

type MenuCartLine = CartItem & {
  menu_item_id?: string | null
  selected_modifiers?: unknown[] | null
}

function lineMenuItemId(item: MenuCartLine): string | null {
  return item.menu_item_id ?? item.product?.id ?? null
}

function hasModifiers(item: MenuCartLine): boolean {
  return Array.isArray(item.selected_modifiers) && item.selected_modifiers.length > 0
}

export function getSimpleMenuItemQty(cart: Cart | null, menuItemId: string): number {
  if (!cart) return 0
  return cart.items.reduce((sum, raw) => {
    const item = raw as MenuCartLine
    if (lineMenuItemId(item) !== menuItemId || hasModifiers(item)) return sum
    return sum + item.quantity
  }, 0)
}

export function getMenuItemModifierQty(cart: Cart | null, menuItemId: string): number {
  if (!cart) return 0
  return cart.items.reduce((sum, raw) => {
    const item = raw as MenuCartLine
    if (lineMenuItemId(item) !== menuItemId || !hasModifiers(item)) return sum
    return sum + item.quantity
  }, 0)
}

export function findSimpleMenuCartLine(cart: Cart | null, menuItemId: string): MenuCartLine | null {
  if (!cart) return null
  for (const raw of cart.items) {
    const item = raw as MenuCartLine
    if (lineMenuItemId(item) === menuItemId && !hasModifiers(item)) return item
  }
  return null
}
