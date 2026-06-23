'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantAdsPanel } from '@/features/merchant/components/MerchantAdsPanel'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { getShopsForMerchant } from '@/lib/shopApi'
import { resolveAdsContext } from '@/lib/adsContext'

export default function MerchantAdsPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId, user } = useAuthStore()
  const { hydrated } = useAuthReady()

  const context = useMemo(
    () => resolveAdsContext('/merchant/ads', user?.shops, activeMerchantId),
    [user?.shops, activeMerchantId],
  )

  const hasLinkedShop = getShopsForMerchant(user?.shops, activeMerchantId).length > 0

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/merchant/ads')
    }
  }, [hydrated, isAuthenticated, router])

  return (
    <MerchantShell>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Megaphone size={24} className="text-amber-500" />
          Visibilité sponsorisée
        </h1>
        {hasLinkedShop && context === 'merchant_retail' && (
          <p className="text-xs text-brand-600 font-semibold mt-2">
            Vous pouvez aussi gérer la visibilité depuis l&apos;onglet{' '}
            <a href="/merchant/shop/visibility" className="underline hover:text-brand-700">
              Boutique → Visibilité
            </a>
            .
          </p>
        )}
      </div>
      <MerchantAdsPanel />
    </MerchantShell>
  )
}
