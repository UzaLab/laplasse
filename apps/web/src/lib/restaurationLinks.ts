/** Deep-links menu restauration — module sans dépendances (safe client/server). */

export const RESTAURATION_MENU_ITEM_PARAM = 'plat'

export function menuItemDomId(itemId: string): string {
  return `menu-item-${itemId}`
}

export function restaurationMenuItemHref(merchantSlug: string, itemId: string): string {
  return `/restauration/${merchantSlug}?${RESTAURATION_MENU_ITEM_PARAM}=${encodeURIComponent(itemId)}`
}
