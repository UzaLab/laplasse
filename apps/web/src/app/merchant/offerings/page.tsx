'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { getPrestationsModuleHref } from '@/lib/serviceListingConfig'

/** Redirection vers le module prestations / consultations / chambres unifié. */
export default function MerchantOfferingsRedirectPage() {
  const router = useRouter()
  const { user, activeMerchantId } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/merchant/offerings')

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return
    const merchant = user?.merchants?.find(m => m.id === activeMerchantId)
    router.replace(getPrestationsModuleHref(merchant?.category_slug))
  }, [hydrated, isAuthenticated, user, activeMerchantId, router])

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-slate-400" />
    </div>
  )
}
