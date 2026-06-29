'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'
import { Loader2 } from 'lucide-react'

function ShopManageDeliveryContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/delivery-zones')
  const { activeMerchantId } = useAuthStore()

  if (!hydrated || !isAuthenticated || !ready || !activeMerchantId) return null

  return (
    <ShopManageSectionLayout>
      <DeliveryHubPanel
        merchantId={activeMerchantId}
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
