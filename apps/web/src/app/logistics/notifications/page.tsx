'use client'

import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { NotificationsPageContent } from '@/features/profile/components/NotificationsPageContent'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import { Loader2 } from 'lucide-react'

export default function LogisticsNotificationsPage() {
  const { ready } = useLogisticsSession()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  return (
    <LogisticsShell>
      <NotificationsPageContent
        audience="logistics"
        backHref="/logistics"
        backLabel="Retour à l'accueil"
      />
    </LogisticsShell>
  )
}
