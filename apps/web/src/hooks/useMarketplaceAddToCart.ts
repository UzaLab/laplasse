'use client'

import { useCallback } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'
import { addPendingCartAdd } from '@/lib/pendingCartAdd'

export function useMarketplaceAddToCart() {
  const { isAuthenticated, ready } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)

  const addToCart = useCallback(async (
    productId: string,
    quantity = 1,
    options?: { variantId?: string; openDrawer?: boolean },
  ) => {
    if (!ready) return { error: 'Chargement…' }

    if (isAuthenticated) {
      return addItem(productId, quantity, options)
    }

    addPendingCartAdd({
      productId,
      quantity,
      variantId: options?.variantId,
    })
    openDrawer()
    return {}
  }, [ready, isAuthenticated, addItem, openDrawer])

  return { addToCart, isAuthenticated, ready }
}

export async function flushPendingCartAdds(
  addItem: (
    productId: string,
    quantity: number,
    options?: { variantId?: string; openDrawer?: boolean },
  ) => Promise<{ error?: string }>,
) {
  const { getPendingCartAdds, clearPendingCartAdds } = await import('@/lib/pendingCartAdd')
  const pending = getPendingCartAdds()
  if (!pending.length) return

  clearPendingCartAdds()
  for (const item of pending) {
    await addItem(item.productId, item.quantity, {
      variantId: item.variantId,
      openDrawer: false,
    })
  }
}
