import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

let refreshPromise: Promise<string | null> | null = null
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

async function refreshAccessToken(): Promise<string | null> {
  const { refresh_token, setAuth, user, logout } = useAuthStore.getState()
  if (!refresh_token) return null

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) logout()
      return null
    }
    const data = await res.json()
    if (user && data.access_token && data.refresh_token) {
      setAuth(user, data.access_token, data.refresh_token)
      return data.access_token as string
    }
    logout()
    return null
  } catch {
    // Erreur réseau — conserver la session, ne pas déconnecter
    return null
  }
}

async function getValidAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
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

function buildHeaders(accessToken: string, options?: RequestInit): HeadersInit {
  const base: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }
  const isFormData =
    typeof FormData !== 'undefined' && options?.body instanceof FormData
  const existingContentType = (options?.headers as Record<string, string> | undefined)?.['Content-Type']
  if (options?.body && !isFormData && !existingContentType) {
    base['Content-Type'] = 'application/json'
  }
  return { ...base, ...(options?.headers as Record<string, string> | undefined) }
}

/** Fetch authentifié avec refresh auto sur 401. Retourne la Response brute. */
export async function authApiFetch(
  path: string,
  options?: RequestInit,
  retried = false,
): Promise<Response> {
  await waitForAuthHydration()

  const token = useAuthStore.getState().access_token
  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Non authentifié' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(token, options),
    })

    if (res.status === 401 && !retried) {
      const newToken = await getValidAccessToken()
      if (newToken) {
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

/** Fetch authentifié — retourne JSON ou null (utilise le token passé, refresh auto sur 401). */
export async function authFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
  retried = false,
): Promise<T | null> {
  await waitForAuthHydration()

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(accessToken, options),
    })

    if (res.status === 401 && !retried) {
      const newToken = await getValidAccessToken()
      if (newToken) {
        return authFetch<T>(path, newToken, options, true)
      }
      redirectToLogin()
      return null
    }

    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
