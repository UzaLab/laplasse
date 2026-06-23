'use client'

import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'
import { ShopSettingsPanel } from '@/features/merchant/components/shop/ShopSettingsPanel'

export default function ShopManageSettingsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/settings')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <ShopSettingsPanel />
    </ShopManageSectionLayout>
  )
}
