import { useAuthStore } from '@/stores/authStore'
import { authUrl, AUTH_FETCH_INIT } from '@/lib/authClient'

let refreshPromise: Promise<boolean> | null = null
let hydrationPromise: Promise<void> | null = null

function waitForAuthHydration(): Promise<void> {
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

async function refreshSession(): Promise<boolean> {
  try {
    const res = await fetch(authUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: AUTH_FETCH_INIT.headers,
      body: '{}',
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        useAuthStore.getState().logout()
      }
      return false
    }
    return true
  } catch {
    return false
  }
}

async function ensureValidSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function redirectToLogin() {
  if (typeof window === 'undefined') return
  const redirect = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?redirect=${redirect}`
}

function buildHeaders(options?: RequestInit): HeadersInit {
  const base: Record<string, string> = {}
  const isFormData =
    typeof FormData !== 'undefined' && options?.body instanceof FormData
  const existingContentType = (options?.headers as Record<string, string> | undefined)?.['Content-Type']
  if (options?.body && !isFormData && !existingContentType) {
    base['Content-Type'] = 'application/json'
  }
  return { ...base, ...(options?.headers as Record<string, string> | undefined) }
}

/** Fetch authentifié via cookies httpOnly, refresh auto sur 401. */
export async function authApiFetch(
  path: string,
  options?: RequestInit,
  retried = false,
): Promise<Response> {
  await waitForAuthHydration()

  if (!useAuthStore.getState().isAuthenticated) {
    return new Response(
      JSON.stringify({ message: 'Non authentifié' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const res = await fetch(authUrl(path), {
      ...options,
      credentials: 'include',
      headers: buildHeaders(options),
    })

    if (res.status === 401 && !retried) {
      const ok = await ensureValidSession()
      if (ok) {
        return authApiFetch(path, options, true)
      }
      redirectToLogin()
    }

    return res
  } catch {
    return new Response(
      JSON.stringify({ message: 'Impossible de contacter le serveur' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/** Fetch authentifié — retourne JSON ou null. */
export async function authFetch<T>(
  path: string,
  options?: RequestInit,
  retried = false,
): Promise<T | null> {
  const res = await authApiFetch(path, options, retried)
  if (!res.ok) return null
  return res.json() as Promise<T>
}
