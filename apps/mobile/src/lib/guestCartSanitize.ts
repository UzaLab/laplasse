import type { Cart } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import {
  clearGuestCart,
  getGuestCartLines,
  setGuestCartLines,
  type GuestCartLine,
} from '@/src/lib/guestCart'

export async function sanitizeGuestCartLines(): Promise<{
  cart: Cart | null
  removed: number
}> {
  const lines = await getGuestCartLines()
  if (!lines.length) return { cart: null, removed: 0 }

  try {
    const cart = await getApiClient().previewGuestCart(lines)
    return { cart, removed: 0 }
  } catch {
    // Fall through to line-by-line validation
  }

  const valid: GuestCartLine[] = []
  for (const line of lines) {
    try {
      await getApiClient().previewGuestCart([line])
      valid.push(line)
    } catch {
      // skip invalid line
    }
  }

  const removed = lines.length - valid.length
  if (!valid.length) {
    await clearGuestCart()
    return { cart: null, removed }
  }

  await setGuestCartLines(valid)
  try {
    const cart = await getApiClient().previewGuestCart(valid)
    return { cart, removed }
  } catch {
    return { cart: null, removed }
  }
}
