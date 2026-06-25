/**
 * Base URL publique des médias (Hetzner via reverse proxy).
 * En dev local sans S3 : les URLs pointent vers l'API (/uploads/...).
 */
export const MEDIA_BASE_URL = (
  process.env.NEXT_PUBLIC_MEDIA_URL ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ??
  'http://localhost:3001'
).replace(/\/$/, '')

/** Vérifie si une URL est hébergée sur notre domaine média. */
export function isMediaUrl(url: string): boolean {
  try {
    const base = new URL(MEDIA_BASE_URL)
    const target = new URL(url, MEDIA_BASE_URL)
    return target.origin === base.origin
  } catch {
    return false
  }
}

/** Normalise une URL média (trim, pas de double slash). */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  return url.trim()
}
