'use client'

import { useCallback } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useCartStore } from '@/stores/cartStore'

export function useMarketplaceAddToCart() {
  const { isAuthenticated, ready } = useAuthReady()
  const addItem = useCartStore(s => s.addItem)

  const addToCart = useCallback(async (
    productId: string,
    quantity = 1,
    options?: { variantId?: string; openDrawer?: boolean },
  ) => addItem(productId, quantity, options), [addItem])

  return { addToCart, isAuthenticated, ready }
}
