/** Parcours commande — marketplace retail vs restaurant (Glovo-like) */

export const MENU_MIRROR_SLUG_PREFIX = 'menu-item-'

export type OrderFlow = 'marketplace' | 'food'
export type CartKind = 'empty' | 'marketplace' | 'food' | 'mixed'

export function isMenuMirrorSlug(slug: string): boolean {
  return slug.startsWith(MENU_MIRROR_SLUG_PREFIX)
}

type CartItemKindHint = {
  line_kind?: 'menu' | 'product'
  menu_item_id?: string | null
  product?: { slug: string }
}

export function detectCartKind(
  items: CartItemKindHint[],
  cartKind?: CartKind | null,
): CartKind {
  if (cartKind && cartKind !== 'empty') return cartKind
  if (!items.length) return 'empty'

  const hasMenu = items.some(
    i => i.line_kind === 'menu' || Boolean(i.menu_item_id) || isMenuMirrorSlug(i.product?.slug ?? ''),
  )
  const hasProduct = items.some(
    i =>
      i.line_kind === 'product'
      || (!i.menu_item_id && i.product && !isMenuMirrorSlug(i.product.slug)),
  )

  if (hasMenu && !hasProduct) return 'food'
  if (hasProduct && !hasMenu) return 'marketplace'
  if (hasMenu && hasProduct) return 'mixed'
  return 'marketplace'
}

export function orderFlowFromKind(kind: CartKind): OrderFlow | null {
  if (kind === 'food') return 'food'
  if (kind === 'marketplace') return 'marketplace'
  return null
}

export function getCartRoute(kind: CartKind): '/cart' | '/commande' | null {
  if (kind === 'food') return '/commande'
  if (kind === 'marketplace') return '/cart'
  return null
}

export function getCheckoutRoute(flow: OrderFlow): '/checkout' | '/commande/livraison' {
  return flow === 'food' ? '/commande/livraison' : '/checkout'
}

export function getPaymentRoute(flow: OrderFlow): '/checkout/payment' | '/commande/paiement' {
  return flow === 'food' ? '/commande/paiement' : '/checkout/payment'
}

export function isFoodOrderCart(
  items: CartItemKindHint[],
  cartKind?: CartKind | null,
): boolean {
  return detectCartKind(items, cartKind) === 'food'
}

/** @deprecated use detectCartKind */
export { isMenuMirrorSlug as isMenuMirrorProductSlug }
