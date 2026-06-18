import { authApiFetch } from './authFetch'

/** Ajoute shopId à un chemin API (gère les query params existants). */
export function withShopId(path: string, activeShopId?: string | null): string {
  if (!activeShopId) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('shopId', activeShopId)
  return `${base}?${params.toString()}`
}

/** Fetch authentifié pour les routes boutique, avec refresh auto sur 401. */
export function shopApiFetch(
  path: string,
  activeShopId?: string | null,
  options?: RequestInit,
) {
  return authApiFetch(withShopId(path, activeShopId), options)
}

export type ShopStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED'

export interface ShopSummary {
  id: string
  name: string
  slug: string
  status: ShopStatus
  merchant_id?: string | null
  logo?: string | null
  description?: string | null
}

export interface ShopDetails extends ShopSummary {
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  is_active?: boolean
}

export function getShopsForMerchant(
  shops: ShopSummary[] | undefined,
  merchantId: string | null | undefined,
): ShopSummary[] {
  if (!merchantId) return []
  return (shops ?? []).filter(s => s.merchant_id === merchantId)
}

export interface CreateShopInput {
  name: string
  description?: string
  phone?: string
  whatsapp?: string
  email?: string
  city?: string
  district?: string
  address?: string
  merchant_id?: string
}

export async function fetchMyShops(): Promise<ShopSummary[]> {
  const res = await authApiFetch('/shops/mine')
  if (!res.ok) return []
  return res.json() as Promise<ShopSummary[]>
}

export async function fetchShopBySlug(slug: string): Promise<ShopDetails | null> {
  const res = await authApiFetch(`/shops/${slug}`)
  if (!res.ok) return null
  return res.json() as Promise<ShopDetails>
}

export async function createShop(
  input: CreateShopInput,
): Promise<{ shop: ShopSummary | null; error?: string }> {
  const res = await authApiFetch('/shops', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    try {
      const data = await res.json()
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
      return { shop: null, error: msg ?? 'Erreur lors de la création' }
    } catch {
      return { shop: null, error: 'Erreur lors de la création' }
    }
  }
  const shop = await res.json() as ShopSummary
  return { shop }
}

export async function updateShop(
  shopId: string,
  input: Partial<CreateShopInput> & {
    status?: ShopStatus
    logo?: string
    cover_image?: string
  },
): Promise<{ shop: ShopSummary | null; error?: string }> {
  const res = await shopApiFetch(`/shops/${shopId}`, shopId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    try {
      const data = await res.json()
      return { shop: null, error: data.message ?? 'Erreur' }
    } catch {
      return { shop: null, error: 'Erreur' }
    }
  }
  const shop = await res.json() as ShopSummary
  return { shop }
}

export async function linkShopToMerchant(
  shopId: string,
  merchantId: string | null,
): Promise<{ shop: ShopSummary | null; error?: string }> {
  const res = await shopApiFetch(`/shops/${shopId}/link-merchant`, shopId, {
    method: 'PATCH',
    body: JSON.stringify({ merchant_id: merchantId }),
  })
  if (!res.ok) {
    try {
      const data = await res.json()
      return { shop: null, error: data.message ?? 'Erreur' }
    } catch {
      return { shop: null, error: 'Erreur' }
    }
  }
  const shop = await res.json() as ShopSummary
  return { shop }
}
