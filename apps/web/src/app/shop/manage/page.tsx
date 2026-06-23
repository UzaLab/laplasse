'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopOverview } from '@/features/merchant/components/shop/ShopOverview'
import { ShopPublishWizard } from '@/features/merchant/components/shop/ShopPublishWizard'

export default function ShopManagePage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <div className="space-y-6">
        <ShopPublishWizard />
        <ShopOverview />
      </div>
    </ShopManageSectionLayout>
  )
}
