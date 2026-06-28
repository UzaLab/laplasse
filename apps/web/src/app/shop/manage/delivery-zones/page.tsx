'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { useDeliveryShopId } from '@/features/merchant/components/delivery/useDeliveryShopId'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'
import { Loader2 } from 'lucide-react'

function ShopManageDeliveryContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/delivery-zones')
  const { shopId, loading } = useDeliveryShopId('shop')

  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <DeliveryHubPanel
        shopId={shopId}
        shopLoading={loading}
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
