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

export interface MerchantDeliveryShop {
  id: string
  slug: string
  name: string
  country?: string
  delivery_fulfilment_default?: string
}

export async function fetchMerchantDeliveryShop(
  activeMerchantId?: string | null,
): Promise<MerchantDeliveryShop | null> {
  const res = await merchantApiFetch('/merchants/me/delivery-shop', activeMerchantId)
  if (!res.ok) return null
  return res.json() as Promise<MerchantDeliveryShop>
}

export async function fetchMerchantFleetInviteLink(
  activeMerchantId?: string | null,
): Promise<{ url: string; slug: string; shop_name: string } | null> {
  const res = await merchantApiFetch('/merchants/me/fleet/invite-link', activeMerchantId)
  if (!res.ok) return null
  return res.json() as Promise<{ url: string; slug: string; shop_name: string }>
}
