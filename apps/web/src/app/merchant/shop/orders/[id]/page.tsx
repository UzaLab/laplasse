'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { getShopsForMerchant } from '@/lib/shopApi'
import { ShopEmptyState, ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { ShopOrderDetailPanel } from '@/features/merchant/components/shop/ShopOrderDetailPanel'

export default function ShopOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/shop/orders')
  const { user, activeMerchantId } = useAuthStore()
  const linkedShops = getShopsForMerchant(user?.shops, activeMerchantId)

  if (!hydrated || !isAuthenticated || !ready) return null
  if (!linkedShops.length) return <ShopEmptyState merchantId={activeMerchantId} />

  return (
    <ShopSectionLayout>
      <ShopOrderDetailPanel orderId={orderId} />
    </ShopSectionLayout>
  )
}
