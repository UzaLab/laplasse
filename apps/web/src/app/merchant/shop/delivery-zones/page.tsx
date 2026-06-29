'use client'

import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

function ShopDeliveryPageContent() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/delivery-zones')
  const { activeMerchantId } = useAuthStore()

  if (!hydrated || !ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !activeMerchantId) return null

  return (
    <ShopSectionLayout>
      <DeliveryHubPanel
        merchantId={activeMerchantId}
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
