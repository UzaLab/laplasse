const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export async function adminFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
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
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
