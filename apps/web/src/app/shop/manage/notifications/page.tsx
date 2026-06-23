'use client'

import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopShell } from '@/features/shop/components/ShopShell'
import { NotificationsPageContent } from '@/features/profile/components/NotificationsPageContent'

export default function ShopManageNotificationsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/notifications')

  if (!hydrated || !isAuthenticated || !ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <ShopShell>
      <NotificationsPageContent audience="merchant" />
    </ShopShell>
  )
}
