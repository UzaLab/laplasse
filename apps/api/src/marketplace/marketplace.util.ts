export const BOUTIQUE_CATEGORY_SLUGS = ['boutiques']

/** Produits miroir créés à la volée pour commander depuis le menu restaurant */
export const MENU_MIRROR_SLUG_PREFIX = 'menu-item-'

export function isMenuMirrorProductSlug(slug: string): boolean {
  return slug.startsWith(MENU_MIRROR_SLUG_PREFIX)
}

export function menuMirrorProductSlug(menuItemId: string): string {
  return `${MENU_MIRROR_SLUG_PREFIX}${menuItemId}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'produit'
}

export function generatePaymentReference() {
  return `LP-ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
