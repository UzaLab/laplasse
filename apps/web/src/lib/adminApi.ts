import { authApiFetch } from './authFetch'

export async function adminFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const res = await authApiFetch(path, options)
  if (!res.ok) return null
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export async function adminMutate<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const res = await authApiFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    let message = 'Mise à jour impossible'
    try {
      const err = (await res.json()) as { message?: string | string[] }
      if (typeof err.message === 'string') message = err.message
      else if (Array.isArray(err.message) && err.message[0]) message = err.message[0]
    } catch {
      // ignore parse errors
    }
    return { ok: false, message }
  }

  const data = res.status === 204 ? (null as T) : ((await res.json()) as T)
  return { ok: true, data }
}
