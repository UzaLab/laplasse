import { fetchGuestCartPreview, type Cart } from '@/lib/marketplaceApi'
import {
  clearGuestCart,
  getGuestCartLines,
  setGuestCartLines,
  type GuestCartLine,
} from '@/lib/guestCart'

/** Charge le panier invité en retirant les lignes invalides (produits supprimés, miroirs menu…). */
export async function sanitizeGuestCartLines(): Promise<{
  cart: Cart | null
  removed: number
}> {
  const lines = getGuestCartLines()
  if (!lines.length) return { cart: null, removed: 0 }

  const batch = await fetchGuestCartPreview(lines)
  if (batch.cart) return { cart: batch.cart, removed: 0 }

  const valid: GuestCartLine[] = []
  for (const line of lines) {
    const { cart } = await fetchGuestCartPreview([line])
    if (cart) valid.push(line)
  }

  const removed = lines.length - valid.length
  if (!valid.length) {
    clearGuestCart()
    return { cart: null, removed }
  }

  setGuestCartLines(valid)
  const retry = await fetchGuestCartPreview(valid)
  return { cart: retry.cart ?? null, removed }
}
