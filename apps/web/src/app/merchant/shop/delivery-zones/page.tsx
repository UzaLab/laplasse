'use client'

import { Loader2 } from 'lucide-react'
import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopDeliveryZonesPanel } from '@/features/merchant/components/shop/ShopDeliveryZonesPanel'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ShopDeliveryZonesPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/delivery-zones')

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
      <ShopDeliveryZonesPanel />
    </ShopSectionLayout>
  )
}
