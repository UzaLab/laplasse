'use client'

import { useEffect } from 'react'
import { ensureAuthSession, isSessionResolved } from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'

/** Lance la validation session une fois le store réhydraté (mutex — sans doublon). */
export function AuthBootstrap() {
  useEffect(() => {
    const kick = () => {
      const { sessionStatus } = useAuthStore.getState()
      if (!isSessionResolved(sessionStatus)) {
        ensureAuthSession()
      }
    }

    if (useAuthStore.persist.hasHydrated()) {
      kick()
      return
    }
    return useAuthStore.persist.onFinishHydration(kick)
  }, [])
  return null
}
