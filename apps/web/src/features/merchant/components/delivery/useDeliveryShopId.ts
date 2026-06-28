'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { fetchMerchantDeliveryShop, initMerchantDeliveryShop } from '@/lib/merchantApi'

export function useDeliveryShopId(context: 'shop' | 'merchant') {
  const { activeShopId, activeMerchantId } = useAuthStore()
  const [shopId, setShopId] = useState<string | null>(context === 'shop' ? activeShopId : null)
  const [loading, setLoading] = useState(context === 'merchant')
  const [initializing, setInitializing] = useState(false)
  const [countryCode, setCountryCode] = useState<string | undefined>()

  const fetchShop = useCallback(async () => {
    if (context === 'shop') return
    setLoading(true)
    const shop = await fetchMerchantDeliveryShop(activeMerchantId)
    setShopId(shop?.id ?? null)
    setCountryCode(shop?.country?.toUpperCase())
    setLoading(false)
  }, [context, activeMerchantId])

  useEffect(() => {
    if (context === 'shop') {
      setShopId(activeShopId)
      setLoading(false)
      return
    }
    void fetchShop()
  }, [context, activeShopId, fetchShop])

  const initShop = useCallback(async () => {
    setInitializing(true)
    const shop = await initMerchantDeliveryShop(activeMerchantId)
    if (shop) {
      setShopId(shop.id)
      setCountryCode(shop.country?.toUpperCase())
    }
    setInitializing(false)
  }, [activeMerchantId])

  return { shopId, loading, initializing, countryCode, initShop }
}
