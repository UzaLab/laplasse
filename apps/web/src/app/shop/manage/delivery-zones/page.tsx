'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'
import { getActiveStandaloneShopId } from '@/lib/shopApi'
import { Loader2 } from 'lucide-react'

function ShopManageDeliveryContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/delivery-zones')
  const { user, activeShopId } = useAuthStore()
  const shopId = getActiveStandaloneShopId(user?.shops, activeShopId)

  if (!hydrated || !isAuthenticated || !ready || !shopId) return null

  return (
    <ShopManageSectionLayout>
      <DeliveryHubPanel
        shopId={shopId}
        basePath="/shop/manage/delivery-zones"
      />
    </ShopManageSectionLayout>
  )
}

export default function ShopManageDeliveryZonesPage() {
  return (
    <SearchParamsWrapper fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <ShopManageDeliveryContent />
    </SearchParamsWrapper>
  )
}
