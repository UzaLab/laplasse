'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopDeliveryZonesPanel } from '@/features/merchant/components/shop/ShopDeliveryZonesPanel'

export default function ShopManageDeliveryZonesPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/delivery-zones')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopDeliveryZonesPanel />
    </ShopManageSectionLayout>
  )
}
