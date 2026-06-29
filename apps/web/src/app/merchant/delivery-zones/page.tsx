'use client'

import { Loader2 } from 'lucide-react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { DeliveryHubPanel } from '@/features/merchant/components/delivery/DeliveryHubPanel'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

function MerchantDeliveryContent() {
  const { user, activeMerchantId } = useAuthStore()

  if (!user || !activeMerchantId) return null

  return (
    <MerchantShell>
      <DeliveryHubPanel
        merchantId={activeMerchantId}
        basePath="/merchant/delivery-zones"
      />
    </MerchantShell>
  )
}

export default function MerchantDeliveryZonesPage() {
  const { ready } = useAuthReady()

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <SearchParamsWrapper fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <MerchantDeliveryContent />
    </SearchParamsWrapper>
  )
}
