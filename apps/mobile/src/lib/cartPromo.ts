import type { AppliedPromotionInput, CartPromoApplication } from '@laplasse/api-client'
import { secureStorage } from '@/src/lib/secureStorage'

const PROMO_KEY = 'laplasse_cart_promos_marketplace'

export function prunePromosForCart(
  promos: CartPromoApplication[],
  cartShopIds: string[],
): CartPromoApplication[] {
  if (!cartShopIds.length) return []
  const shopSet = new Set(cartShopIds)
  return promos.filter(p => p.valid && shopSet.has(p.shop_id))
}

export async function saveCartPromos(
  applications: CartPromoApplication[],
  cartShopIds: string[],
) {
  const pruned = prunePromosForCart(applications.filter(a => a.valid), cartShopIds)
  if (pruned.length === 0) {
    await secureStorage.deleteItem(PROMO_KEY)
    return
  }
  await secureStorage.setItem(PROMO_KEY, JSON.stringify(pruned))
}

export async function getCartPromos(cartShopIds?: string[]): Promise<CartPromoApplication[]> {
  try {
    const raw = await secureStorage.getItem(PROMO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartPromoApplication[]
    if (cartShopIds) return prunePromosForCart(parsed, cartShopIds)
    return parsed
  } catch {
    return []
  }
}

export async function clearCartPromos() {
  await secureStorage.deleteItem(PROMO_KEY)
}

export function toAppliedPromotionInputs(promos: CartPromoApplication[]): AppliedPromotionInput[] {
  return promos
    .filter(p => p.valid && p.promotion_id)
    .map(p => ({
      shop_id: p.shop_id,
      promotion_id: p.promotion_id!,
      code: p.code,
    }))
}

export function getTotalPromoDiscount(promos: CartPromoApplication[]): number {
  return promos.reduce(
    (sum, p) => sum + (p.valid ? Math.max(0, Number(p.discount) || 0) : 0),
    0,
  )
}

export function getFreeDeliveryShopIds(promos: CartPromoApplication[]): Set<string> {
  return new Set(promos.filter(p => p.valid && p.free_delivery).map(p => p.shop_id))
}

export function computeEffectiveDeliveryFee(
  quotes: { shop_id: string; fee: number; available: boolean }[],
  freeDeliveryShopIds: Set<string>,
): number {
  return quotes
    .filter(q => q.available)
    .reduce((sum, q) => sum + (freeDeliveryShopIds.has(q.shop_id) ? 0 : q.fee), 0)
}
