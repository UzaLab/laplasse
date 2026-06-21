'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { getShopsForMerchant } from '@/lib/shopApi'
import { ShopEmptyState, ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopCollectionsPanel } from '@/features/merchant/components/shop/ShopCollectionsPanel'

export default function ShopCollectionsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/collections')
  const { user, activeMerchantId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)

  if (!hydrated || !isAuthenticated || !ready) return null
  if (!linkedShops.length) return <ShopEmptyState merchantId={activeMerchantId} />

  return (
    <ShopSectionLayout>
      <ShopCollectionsPanel />
    </ShopSectionLayout>
  )
}
