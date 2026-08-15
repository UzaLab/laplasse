import { Alert } from 'react-native'
import type { Cart } from '@laplasse/api-client'

export const MENU_MIRROR_SLUG_PREFIX = 'menu-item-'

export type CartKind = 'empty' | 'marketplace' | 'food' | 'mixed'

type CartItemKindHint = {
  line_kind?: 'menu' | 'product'
  menu_item_id?: string | null
  product?: { slug?: string }
}

export function isMenuMirrorSlug(slug: string): boolean {
  return slug.startsWith(MENU_MIRROR_SLUG_PREFIX)
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
      || (!i.menu_item_id && i.product && !isMenuMirrorSlug(i.product.slug ?? '')),
  )

  if (hasMenu && !hasProduct) return 'food'
  if (hasProduct && !hasMenu) return 'marketplace'
  if (hasMenu && hasProduct) return 'mixed'
  return 'marketplace'
}

export function getCartKind(cart: Cart | null | undefined): CartKind {
  if (!cart?.items.length) return 'empty'
  return detectCartKind(cart.items, cart.kind)
}

const FOOD_BLOCKS_MARKETPLACE =
  'Votre panier contient une commande restaurant. Finalisez-la ou videz le panier avant d\'ajouter des produits boutique.'

const MARKETPLACE_BLOCKS_FOOD =
  'Votre panier contient des produits boutique. Videz-le avant de commander au restaurant.'

const MIXED_CART =
  'Votre panier mélange restaurant et boutique. Videz-le pour recommencer une commande.'

export function getMarketplaceAddBlockReason(cart: Cart | null | undefined): string | null {
  const kind = getCartKind(cart)
  if (kind === 'food') return FOOD_BLOCKS_MARKETPLACE
  if (kind === 'mixed') return MIXED_CART
  return null
}

export function getFoodAddBlockReason(cart: Cart | null | undefined): string | null {
  const kind = getCartKind(cart)
  if (kind === 'marketplace') return MARKETPLACE_BLOCKS_FOOD
  if (kind === 'mixed') return MIXED_CART
  return null
}

export function showCartBlockedAlert(message: string, onClear?: () => void) {
  Alert.alert('Panier incompatible', message, [
    { text: 'OK', style: 'cancel' },
    ...(onClear
      ? [{ text: 'Vider le panier', style: 'destructive' as const, onPress: onClear }]
      : []),
  ])
}
