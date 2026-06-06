'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Redirection vers la nouvelle page offres & disponibilités. */
export default function MerchantStaffRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/offerings')
  }, [router])
  return null
}
