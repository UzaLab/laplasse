import { authFetch } from './authFetch'

export async function adminFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T | null> {
  return authFetch<T>(path, accessToken, options)
}
