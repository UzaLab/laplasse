'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthReady } from './useAuthReady'

/** Protège une page client — redirige vers login seulement après réhydratation du store. */
export function useRequireAuth(explicitRedirect?: string) {
  const router = useRouter()
  const pathname = usePathname()
  const auth = useAuthReady()

  useEffect(() => {
    if (auth.hydrated && !auth.isAuthenticated) {
      const target = explicitRedirect ?? pathname
      router.push(`/login?redirect=${encodeURIComponent(target)}`)
    }
  }, [auth.hydrated, auth.isAuthenticated, router, explicitRedirect, pathname])

  return auth
}
