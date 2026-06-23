'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopCollectionsPanel } from '@/features/merchant/components/shop/ShopCollectionsPanel'

export default function ShopManageCollectionsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/collections')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopCollectionsPanel />
    </ShopManageSectionLayout>
  )
}
