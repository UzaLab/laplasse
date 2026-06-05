'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export function useAdminSession() {
  const router = useRouter()
  const { isAuthenticated, user, access_token } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

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
      router.push('/login')
      return
    }
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/')
    }
  }, [hydrated, isAuthenticated, access_token, user, router])

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const ready = hydrated && isAuthenticated && !!access_token && isAdmin

  return { ready, access_token, user }
}
