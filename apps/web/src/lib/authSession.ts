import { useAuthStore, type AuthUser } from '@/stores/authStore'
import { authUrl, AUTH_FETCH_INIT } from '@/lib/authClient'

export type SessionStatus = 'idle' | 'checking' | 'authenticated' | 'anonymous'

let bootstrapPromise: Promise<AuthUser | null> | null = null
let refreshPromise: Promise<boolean> | null = null
let hydrationPromise: Promise<void> | null = null

/** Invalide le cache de bootstrap (login / logout). */
export function invalidateAuthSession() {
  bootstrapPromise = null
  refreshPromise = null
}

export function waitForAuthHydration(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (useAuthStore.persist.hasHydrated()) return Promise.resolve()
  if (!hydrationPromise) {
    hydrationPromise = new Promise(resolve => {
      useAuthStore.persist.onFinishHydration(() => {
        hydrationPromise = null
        resolve()
      })
    })
  }
  return hydrationPromise
}

/** Refresh token rotatif — une seule requête à la fois. */
export async function refreshAuthSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(authUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
          headers: AUTH_FETCH_INIT.headers,
          body: '{}',
        })
        return res.ok
      } catch {
        return false
      }
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function runBootstrap(): Promise<AuthUser | null> {
  const store = useAuthStore.getState()
  store.setSessionStatus('checking')

  try {
    let res = await fetch(authUrl('/auth/me'), { credentials: 'include' })

    if (res.status === 401) {
      const refreshed = await refreshAuthSession()
      if (refreshed) {
        res = await fetch(authUrl('/auth/me'), { credentials: 'include' })
      }
    }

    if (res.ok) {
      const user = (await res.json()) as AuthUser
      store.setAuth(user)
      return user
    }

    if (res.status === 401 || res.status === 403) {
      store.logout()
      return null
    }

    // Erreur serveur — conserver la session locale si elle existait
    const { user, isAuthenticated } = useAuthStore.getState()
    if (user && isAuthenticated) {
      store.setSessionStatus('authenticated')
      return user
    }
    store.setSessionStatus('anonymous')
    return null
  } catch {
    const { user, isAuthenticated } = useAuthStore.getState()
    if (user && isAuthenticated) {
      store.setSessionStatus('authenticated')
      return user
    }
    store.setSessionStatus('anonymous')
    return null
  }
}

/**
 * Valide la session cookie auprès de l'API (mutex global).
 * Appels concurrents partagent la même promesse — évite la course sur le refresh rotatif.
 */
export async function ensureAuthSession(): Promise<AuthUser | null> {
  await waitForAuthHydration()

  const { sessionStatus, user, isAuthenticated } = useAuthStore.getState()
  if (sessionStatus === 'authenticated' && user) return user

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap()
  }
  return bootstrapPromise
}

export function isSessionResolved(status: SessionStatus): boolean {
  return status === 'authenticated' || status === 'anonymous'
}
