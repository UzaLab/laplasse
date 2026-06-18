'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { getShopsForMerchant } from '@/lib/shopApi'
import { ShopEmptyState, ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopPromotionsPanel } from '@/features/merchant/components/shop/ShopPromotionsPanel'

export default function ShopPromotionsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/promotions')
  const { user, activeMerchantId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)

  if (!hydrated || !isAuthenticated || !ready) return null
  if (!linkedShops.length) return <ShopEmptyState merchantId={activeMerchantId} />

  return (
    <ShopSectionLayout>
      <ShopPromotionsPanel />
    </ShopSectionLayout>
  )
}
