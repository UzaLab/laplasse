import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refresh_token, setAuth, user, logout } = useAuthStore.getState()
  if (!refresh_token) {
    logout()
    return null
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) {
      logout()
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
    logout()
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

export async function authFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
  retried = false,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options?.headers,
      },
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
