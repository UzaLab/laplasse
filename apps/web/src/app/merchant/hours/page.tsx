'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantHoursPanel } from '@/features/merchant/components/MerchantHoursPanel'

function HoursContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { hydrated } = useAuthReady()

  if (hydrated && !isAuthenticated) {
    router.push('/login?redirect=/merchant/hours')
    return null
  }

  return (
    <MerchantShell>
      <MerchantHoursPanel />
    </MerchantShell>
  )
}

export default function MerchantHoursPage() {
  return (
    <Suspense
      fallback={
        <MerchantShell>
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        </MerchantShell>
      }
    >
      <HoursContent />
    </Suspense>
  )
}
