'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { getShopsForMerchant } from '@/lib/shopApi'
import { ShopEmptyState, ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopAnalyticsPanel } from '@/features/merchant/components/shop/ShopAnalyticsPanel'

export default function ShopAnalyticsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/analytics')
  const { user, activeMerchantId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)

  if (!hydrated || !isAuthenticated || !ready) return null
  if (!linkedShops.length) return <ShopEmptyState merchantId={activeMerchantId} />

  return (
    <ShopSectionLayout>
      <ShopAnalyticsPanel />
    </ShopSectionLayout>
  )
}
