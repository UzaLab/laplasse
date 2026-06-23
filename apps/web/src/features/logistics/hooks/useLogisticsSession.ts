'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ensureAuthSession } from '@/lib/authSession'

export function useLogisticsSession() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [persistHydrated, setPersistHydrated] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setPersistHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setPersistHydrated(true))
  }, [])

  useEffect(() => {
    if (!persistHydrated) return

    let cancelled = false
    ensureAuthSession().then(validatedUser => {
      if (cancelled) return

      if (!validatedUser) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      if (!validatedUser.logistics_partner) {
        router.push('/logistics/signup')
        return
      }

      setSessionValid(true)
    })

    return () => { cancelled = true }
  }, [persistHydrated, router])

  const ready = persistHydrated && sessionValid && !!user?.logistics_partner

  return {
    ready,
    user,
    partner: user?.logistics_partner ?? null,
  }
}
