'use client'

import { Loader2 } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { NotificationsPageContent } from '@/features/profile/components/NotificationsPageContent'

export default function AdminNotificationsPage() {
  const { ready } = useAdminSession()

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  return (
    <NotificationsPageContent
      audience="admin"
      backHref="/admin"
      backLabel="Retour au dashboard"
    />
  )
}
