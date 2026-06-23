'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopOrdersPanel } from '@/features/merchant/components/shop/ShopOrdersPanel'

export default function ShopManageOrdersPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/orders')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopOrdersPanel />
    </ShopManageSectionLayout>
  )
}
