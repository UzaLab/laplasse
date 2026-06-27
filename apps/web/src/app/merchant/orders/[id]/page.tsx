'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { ShopOrderDetailPanel } from '@/features/merchant/components/shop/ShopOrderDetailPanel'
import { buildMerchantOrderScope, FOOD_ORDER_ROUTES } from '@/lib/merchantOrderScope'

export default function MerchantOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { ready, isAuthenticated } = useAuthReady()
  const { activeMerchantId, activeShopId, user } = useAuthStore()

  const scope = useMemo(
    () => buildMerchantOrderScope(activeMerchantId, user?.shops, activeShopId),
    [activeMerchantId, user?.shops, activeShopId],
  )

  if (!ready || !isAuthenticated) return null

  return (
    <MerchantShell>
      <ShopOrderDetailPanel
        orderId={orderId}
        scope={scope}
        routes={FOOD_ORDER_ROUTES}
      />
    </MerchantShell>
  )
}
