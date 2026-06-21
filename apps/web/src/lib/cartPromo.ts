import type { AppliedPromotionInput, CartPromoApplication } from '@/lib/marketplaceApi'
import type { OrderFlow } from '@/lib/orderFlow'

const PROMO_KEY_PREFIX = 'laplasse_cart_promos_'

function storageKey(flow: OrderFlow): string {
  return `${PROMO_KEY_PREFIX}${flow}`
}

/** Ne conserve que les promos dont la boutique est encore dans le panier. */
export function prunePromosForCart(
  promos: CartPromoApplication[],
  cartShopIds: string[],
): CartPromoApplication[] {
  if (!cartShopIds.length) return []
  const shopSet = new Set(cartShopIds)
  return promos.filter(p => p.valid && shopSet.has(p.shop_id))
}

export function saveCartPromos(
  flow: OrderFlow,
  applications: CartPromoApplication[],
  cartShopIds: string[],
) {
  if (typeof window === 'undefined') return
  const pruned = prunePromosForCart(applications.filter(a => a.valid), cartShopIds)
  if (pruned.length === 0) {
    sessionStorage.removeItem(storageKey(flow))
    return
  }
  sessionStorage.setItem(storageKey(flow), JSON.stringify(pruned))
}

export function getCartPromos(
  flow: OrderFlow = 'marketplace',
  cartShopIds?: string[],
): CartPromoApplication[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(storageKey(flow))
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartPromoApplication[]
    if (cartShopIds) return prunePromosForCart(parsed, cartShopIds)
    return parsed
  } catch {
    return []
  }
}

export function clearCartPromos(flow?: OrderFlow) {
  if (typeof window === 'undefined') return
  if (flow) {
    sessionStorage.removeItem(storageKey(flow))
    return
  }
  sessionStorage.removeItem(storageKey('marketplace'))
  sessionStorage.removeItem(storageKey('food'))
  // Ancienne clé (migration)
  sessionStorage.removeItem('laplasse_cart_promos')
}

export function toAppliedPromotionInputs(
  promos: CartPromoApplication[],
): AppliedPromotionInput[] {
  return promos
    .filter(p => p.valid && p.promotion_id)
    .map(p => ({
      shop_id: p.shop_id,
      promotion_id: p.promotion_id!,
      code: p.code,
    }))
}

export function getTotalPromoDiscount(promos: CartPromoApplication[]): number {
  return promos.reduce((sum, p) => sum + (p.valid ? p.discount : 0), 0)
}

export function getFreeDeliveryShopIds(promos: CartPromoApplication[]): Set<string> {
  return new Set(
    promos.filter(p => p.valid && p.free_delivery).map(p => p.shop_id),
  )
}

export function computeEffectiveDeliveryFee(
  quotes: { shop_id: string; available: boolean; fee: number }[],
  freeDeliveryShopIds: Set<string>,
): number {
  return quotes.reduce((sum, q) => {
    if (!q.available || freeDeliveryShopIds.has(q.shop_id)) return sum
    return sum + q.fee
  }, 0)
}
