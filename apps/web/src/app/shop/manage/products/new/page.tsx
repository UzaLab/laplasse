'use client'

import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { MerchantProductForm } from '@/features/merchant/components/MerchantProductForm'

export default function ShopManageNewProductPage() {
  return (
    <ShopManageSectionLayout hideTabs>
      <MerchantProductForm />
    </ShopManageSectionLayout>
  )
}
