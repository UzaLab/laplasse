const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export const AUTH_FETCH_INIT: RequestInit = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
}

export function authUrl(path: string): string {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}
