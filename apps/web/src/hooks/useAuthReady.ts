'use client'

import { useEffect, useState } from 'react'
import { useAuthStore, bootstrapAuthSession } from '@/stores/authStore'

function getInitialHydrated() {
  return typeof window !== 'undefined' && useAuthStore.persist.hasHydrated()
}

/** Auth prêt — réhydrate le store puis valide la session cookie auprès de l'API. */
export function useAuthReady() {
  const { isAuthenticated, user, logoutRemote } = useAuthStore()
  const [hydrated, setHydrated] = useState(getInitialHydrated)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated || sessionChecked) return
    let cancelled = false
    bootstrapAuthSession().finally(() => {
      if (!cancelled) setSessionChecked(true)
    })
    return () => { cancelled = true }
  }, [hydrated, sessionChecked])

  const ready = hydrated && sessionChecked && isAuthenticated && !!user
  const { logout, activeMerchantId } = useAuthStore()

  return {
    ready,
    hydrated: hydrated && sessionChecked,
    isAuthenticated,
    user,
    logout: logoutRemote,
    activeMerchantId,
  }
}
