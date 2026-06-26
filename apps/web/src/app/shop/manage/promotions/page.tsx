'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopPromotionsPanel } from '@/features/merchant/components/shop/ShopPromotionsPanel'

export default function ShopManagePromotionsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/promotions')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopPromotionsPanel />
    </ShopManageSectionLayout>
  )
}
