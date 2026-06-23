'use client'

import { ShopSectionLayout } from '@/features/merchant/components/shop/ShopSectionLayout'
import { MerchantAdsPanel } from '@/features/merchant/components/MerchantAdsPanel'

export default function ShopVisibilityPage() {
  return (
    <ShopSectionLayout>
      <MerchantAdsPanel context="linked_shop" />
    </ShopSectionLayout>
  )
}
