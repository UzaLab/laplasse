'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopProductsPanel } from '@/features/merchant/components/shop/ShopProductsPanel'

export default function ShopManageProductsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/products')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopProductsPanel />
    </ShopManageSectionLayout>
  )
}
