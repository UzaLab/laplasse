import { authApiFetch } from './authFetch'

export async function adminFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const res = await authApiFetch(path, options)
  if (!res.ok) return null
  return res.json() as Promise<T>
}
