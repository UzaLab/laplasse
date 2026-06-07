'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { authApiFetch } from '@/lib/authFetch'

export function useAdminSession() {
  const router = useRouter()
  const { isAuthenticated, user, logoutRemote } = useAuthStore()
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

    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/')
      return
    }

    let cancelled = false
    authApiFetch('/auth/me').then(async res => {
      if (cancelled) return
      if (!res.ok) {
        await logoutRemote()
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }
      setSessionValid(true)
    })

    return () => { cancelled = true }
  }, [hydrated, isAuthenticated, user, router, logoutRemote])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const ready = hydrated && isAuthenticated && isAdmin && sessionValid

  return { ready, user }
}
