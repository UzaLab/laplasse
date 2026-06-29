import { authApiFetch } from './authFetch'

/** Ajoute merchantId à un chemin API (gère les query params existants). */
export function withMerchantId(path: string, activeMerchantId?: string | null): string {
  if (!activeMerchantId) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('merchantId', activeMerchantId)
  return `${base}?${params.toString()}`
}

/** Fetch authentifié pour les routes marchand, avec refresh auto sur 401. */
export function merchantApiFetch(
  path: string,
  activeMerchantId?: string | null,
  options?: RequestInit,
) {
  return authApiFetch(withMerchantId(path, activeMerchantId), options)
}
