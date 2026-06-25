'use client'

import { useParams } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopOrderDetailPanel } from '@/features/merchant/components/shop/ShopOrderDetailPanel'

export default function ShopManageOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/orders')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout hideTabs>
      <ShopOrderDetailPanel orderId={orderId} />
    </ShopManageSectionLayout>
  )
}
