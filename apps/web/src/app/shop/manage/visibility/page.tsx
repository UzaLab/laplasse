'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShopShell } from '@/features/shop/components/ShopShell'
import { MerchantAdsPanel } from '@/features/merchant/components/MerchantAdsPanel'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { getIndependentShops } from '@/lib/shopApi'

export default function StandaloneShopVisibilityPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const { hydrated } = useAuthReady()
  const hasStandaloneShop = getIndependentShops(user?.shops).length > 0

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/shop/manage/visibility')
      return
    }
    if (hydrated && isAuthenticated && !hasStandaloneShop) {
      router.push('/shop/manage')
    }
  }, [hydrated, isAuthenticated, hasStandaloneShop, router])

  return (
    <ShopShell>
      <MerchantAdsPanel context="standalone_shop" />
    </ShopShell>
  )
}
