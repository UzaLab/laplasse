'use client'

import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { getShopsForMerchant } from '@/lib/shopApi'
import { ShopEmptyState, ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopOverview } from '@/features/merchant/components/shop/ShopOverview'
import { ShopPublishWizard } from '@/features/merchant/components/shop/ShopPublishWizard'

export default function ShopHubPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop')
  const { user, activeMerchantId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)

  if (!hydrated || !isAuthenticated || !ready) return null
  if (!linkedShops.length) return <ShopEmptyState merchantId={activeMerchantId} />

  return (
    <ShopSectionLayout>
      <div className="space-y-6">
        <ShopPublishWizard />
        <ShopOverview />
      </div>
    </ShopSectionLayout>
  )
}
