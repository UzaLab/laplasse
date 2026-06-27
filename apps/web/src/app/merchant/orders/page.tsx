'use client'

import { Loader2 } from 'lucide-react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { getMerchantVertical } from '@/lib/merchantVertical'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { ShopOrdersPanel } from '@/features/merchant/components/shop/ShopOrdersPanel'
import { buildFoodOrderScope, FOOD_ORDER_ROUTES } from '@/lib/merchantOrderScope'

export default function MerchantOrdersPage() {
  const { ready } = useAuthReady()
  const { user, activeMerchantId } = useAuthStore()
  const router = useRouter()

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId) ?? user?.merchants?.[0]
  const vertical = getMerchantVertical(activeMerchant?.category_slug ?? '')
  const scope = useMemo(
    () => buildFoodOrderScope(activeMerchantId),
    [activeMerchantId],
  )

  useEffect(() => {
    if (!ready) return
    if (vertical !== 'food') {
      router.replace('/merchant/shop/orders')
    }
  }, [ready, vertical, router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!user) return null

  if (vertical !== 'food') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <MerchantShell>
      <ShopOrdersPanel
        scope={scope}
        routes={FOOD_ORDER_ROUTES}
        heading="Commandes menu"
        subheading="Suivez et gérez les commandes de plats de bout en bout."
      />
    </MerchantShell>
  )
}
