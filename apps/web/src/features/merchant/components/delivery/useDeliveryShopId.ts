'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { fetchMerchantDeliveryShop } from '@/lib/merchantApi'

export function useDeliveryShopId(context: 'shop' | 'merchant') {
  const { activeShopId, activeMerchantId } = useAuthStore()
  const [shopId, setShopId] = useState<string | null>(context === 'shop' ? activeShopId : null)
  const [loading, setLoading] = useState(context === 'merchant')
  const [countryCode, setCountryCode] = useState<string | undefined>()

  useEffect(() => {
    if (context === 'shop') {
      setShopId(activeShopId)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      const shop = await fetchMerchantDeliveryShop(activeMerchantId)
      if (cancelled) return
      setShopId(shop?.id ?? null)
      setCountryCode(shop?.country?.toUpperCase())
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [context, activeShopId, activeMerchantId])

  return { shopId, loading, countryCode }
}
