'use client'

import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { NotificationsPageContent } from '@/features/profile/components/NotificationsPageContent'

export default function MerchantNotificationsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/merchant/notifications')

  if (!hydrated || !isAuthenticated || !ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <MerchantShell>
      <NotificationsPageContent audience="merchant" />
    </MerchantShell>
  )
}
