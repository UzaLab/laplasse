'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopProductCategoriesPanel } from '@/features/merchant/components/shop/ShopProductCategoriesPanel'

export default function ShopManageProductCategoriesPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/products/categories')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout hideTabs>
      <ShopProductCategoriesPanel />
    </ShopManageSectionLayout>
  )
}
