'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { ensureAuthSession, isSessionResolved } from '@/lib/authSession'

function getInitialPersistHydrated() {
  return typeof window !== 'undefined' && useAuthStore.persist.hasHydrated()
}

/** Auth prêt — attend la réhydratation puis une validation session unique (mutex global). */
export function useAuthReady() {
  const { isAuthenticated, user, logoutRemote, sessionStatus } = useAuthStore()
  const [persistHydrated, setPersistHydrated] = useState(getInitialPersistHydrated)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setPersistHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setPersistHydrated(true))
  }, [])

  useEffect(() => {
    if (!persistHydrated) return
    if (isSessionResolved(sessionStatus)) return
    ensureAuthSession()
  }, [persistHydrated, sessionStatus])

  const sessionChecked = isSessionResolved(sessionStatus)
  const ready = persistHydrated && sessionChecked && isAuthenticated && !!user

  return {
    ready,
    hydrated: persistHydrated && sessionChecked,
    sessionChecked,
    sessionStatus,
    isAuthenticated,
    user,
    logout: logoutRemote,
    activeMerchantId: useAuthStore(s => s.activeMerchantId),
  }
}
