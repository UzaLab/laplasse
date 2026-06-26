'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantAnalyticsPanel } from '@/features/merchant/components/MerchantAnalyticsPanel'

function MerchantAnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOrgScope = searchParams.get('scope') === 'organization'
  const { isAuthenticated } = useAuthStore()
  const { hydrated } = useAuthReady()

  if (hydrated && !isAuthenticated) {
    router.push('/login?redirect=/merchant/analytics')
    return null
  }

  return (
    <MerchantShell>
      <MerchantAnalyticsPanel isOrgScope={isOrgScope} />
    </MerchantShell>
  )
}

export default function MerchantAnalyticsPage() {
  return (
    <SearchParamsWrapper>
      <Suspense
        fallback={
          <MerchantShell>
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-slate-300" />
            </div>
          </MerchantShell>
        }
      >
        <MerchantAnalyticsContent />
      </Suspense>
    </SearchParamsWrapper>
  )
}
