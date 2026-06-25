'use client'

import { use } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { MerchantProductForm } from '@/features/merchant/components/MerchantProductForm'

export default function ShopManageEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { hydrated, isAuthenticated, ready } = useRequireAuth(`/shop/manage/products/${id}/edit`)
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout hideTabs>
      <MerchantProductForm productId={id} skipShellLayout />
    </ShopManageSectionLayout>
  )
}
