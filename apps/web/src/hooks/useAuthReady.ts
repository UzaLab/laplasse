'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

function getInitialHydrated() {
  return typeof window !== 'undefined' && useAuthStore.persist.hasHydrated()
}

/** Auth persisté prêt — attend la réhydratation localStorage avant toute décision. */
export function useAuthReady() {
  const { isAuthenticated, access_token, user } = useAuthStore()
  const [hydrated, setHydrated] = useState(getInitialHydrated)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  const ready = hydrated && isAuthenticated && !!access_token
  const { logout, activeMerchantId } = useAuthStore()

  return { ready, hydrated, isAuthenticated, access_token, user, logout, activeMerchantId }
}
