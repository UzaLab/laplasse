'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopAnalyticsPanel } from '@/features/merchant/components/shop/ShopAnalyticsPanel'

export default function ShopManageAnalyticsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/analytics')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopAnalyticsPanel />
    </ShopManageSectionLayout>
  )
}
