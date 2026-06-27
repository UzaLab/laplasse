'use client'

import { Loader2 } from 'lucide-react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantDeliveryZonesPanel } from '@/features/merchant/components/MerchantDeliveryZonesPanel'

export default function MerchantDeliveryZonesPage() {
  const { ready } = useAuthReady()
  const { user } = useAuthStore()

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!user) return null

  return (
    <MerchantShell>
      <MerchantDeliveryZonesPanel />
    </MerchantShell>
  )
}
