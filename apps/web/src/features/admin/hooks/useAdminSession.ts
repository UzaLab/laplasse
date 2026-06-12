'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ensureAuthSession } from '@/lib/authSession'

export function useAdminSession() {
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

      if (validatedUser.role !== 'ADMIN' && validatedUser.role !== 'SUPER_ADMIN') {
        router.push('/')
        return
      }

      setSessionValid(true)
    })

    return () => { cancelled = true }
  }, [persistHydrated, router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const ready = persistHydrated && sessionValid && isAdmin

  return { ready, user }
}
