'use client'

import { Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { NotificationsPageContent } from '@/features/profile/components/NotificationsPageContent'

export default function NotificationsPage() {
  const { hydrated, isAuthenticated } = useRequireAuth('/profile/notifications')

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <ProfileShell>
      <NotificationsPageContent />
    </ProfileShell>
  )
}
