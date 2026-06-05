'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authFetch } from '@/lib/authFetch'

export function useAdminSession() {
  const router = useRouter()
  const { isAuthenticated, user, access_token, logout } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated || !access_token) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/')
      return
    }

    let cancelled = false
    authFetch('/auth/me', access_token).then(me => {
      if (cancelled) return
      if (!me) {
        logout()
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }
      setSessionValid(true)
    })

    return () => { cancelled = true }
  }, [hydrated, isAuthenticated, access_token, user, router, logout])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const ready = hydrated && isAuthenticated && !!access_token && isAdmin && sessionValid

  return { ready, access_token, user }
}
