'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getPrestationsModuleHref } from '@/lib/serviceListingConfig'

/** Redirection vers prestations / consultations (onglet équipe inclus). */
export default function MerchantStaffRedirectPage() {
  const router = useRouter()
  const { user, activeMerchantId } = useAuthStore()

  useEffect(() => {
    const merchant = user?.merchants?.find(m => m.id === activeMerchantId)
    router.replace(`${getPrestationsModuleHref(merchant?.category_slug)}?tab=team`)
  }, [router, user, activeMerchantId])

  return null
}
