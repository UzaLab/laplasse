'use client'

import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { useDeliveryShopId } from '@/features/merchant/components/delivery/useDeliveryShopId'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

function ShopDeliveryPageContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/delivery-zones')
  const { shopId, loading } = useDeliveryShopId('shop')

  if (!hydrated || !ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <ShopSectionLayout>
      <DeliveryHubPanel
        shopId={shopId}
        shopLoading={loading}
        basePath="/merchant/shop/delivery-zones"
      />
    </ShopSectionLayout>
  )
}

export default function ShopDeliveryZonesPage() {
  return (
    <SearchParamsWrapper fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <ShopDeliveryPageContent />
    </SearchParamsWrapper>
  )
}
