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

export type ShopStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED'

export interface ShopSummary {
  id: string
  name: string
  slug: string
  status: ShopStatus
  merchant_id?: string | null
  logo?: string | null
  description?: string | null
  delivery_fulfilment_default?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'
}

export interface ShopDetails extends ShopSummary {
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  city_id?: string | null
  commune_id?: string | null
  latitude?: number | null
  longitude?: number | null
  has_physical_location?: boolean
  country?: string | null
  is_active?: boolean
}

export function getShopsForMerchant(
  shops: ShopSummary[] | undefined,
  merchantId: string | null | undefined,
): ShopSummary[] {
  if (!merchantId) return []
  return (shops ?? []).filter(s => s.merchant_id === merchantId)
}

export function getActiveMerchantShopId(
  shops: ShopSummary[] | undefined,
  activeMerchantId: string | null | undefined,
  activeShopId: string | null | undefined,
): string | null {
  const linked = getShopsForMerchant(shops, activeMerchantId)
  if (!linked.length) return null
  if (activeShopId && linked.some(s => s.id === activeShopId)) return activeShopId
  return linked[0].id
}

/** Boutiques sans établissement lié (créées directement par l'utilisateur). */
export function getIndependentShops(shops: ShopSummary[] | undefined): ShopSummary[] {
  return (shops ?? []).filter(s => !s.merchant_id)
}

/** Fiche établissement marchand créée (distinct d'une boutique standalone). */
export function hasMerchantEstablishment(
  user: { role?: string; merchants?: { id: string }[] } | null | undefined,
): boolean {
  if (!user) return false
  return user.role === 'MERCHANT' || (user.merchants?.length ?? 0) > 0
}

/** Boutique standalone sans fiche établissement. */
export function hasStandaloneShopOnly(
  user: { role?: string; merchants?: { id: string }[]; shops?: ShopSummary[] } | null | undefined,
): boolean {
  if (!user) return false
  return getIndependentShops(user.shops).length > 0 && !hasMerchantEstablishment(user)
}

/** Retourne l'URL de gestion d'une boutique (espace marchand si liée, sinon /shop/manage). */
/** URL publique vitrine boutique (standalone ou liée). */
export function getShopPublicHref(shop: { slug: string } | null | undefined): string {
  if (!shop?.slug) return '/marketplace'
  return `/m/${shop.slug}/boutique`
}

export function getShopManageHref(shop: ShopSummary | null | undefined): string {
  return shop?.merchant_id ? '/merchant/shop' : '/shop/manage'
}

export type ShopManageBase = '/shop/manage' | '/merchant/shop'

export interface ShopRoutePaths {
  base: ShopManageBase
  products: string
  productsNew: string
  productsCategories: string
  productsEdit: (id: string) => string
  settings: string
  orders: string
  orderDetail: (id: string) => string
  analytics: string
  promotions: string
}

export function buildShopRoutes(base: ShopManageBase): ShopRoutePaths {
  return {
    base,
    products: `${base}/products`,
    productsNew: `${base}/products/new`,
    productsCategories: `${base}/products/categories`,
    productsEdit: id => `${base}/products/${id}/edit`,
    settings: `${base}/settings`,
    orders: `${base}/orders`,
    orderDetail: id => `${base}/orders/${id}`,
    analytics: `${base}/analytics`,
    promotions: `${base}/promotions`,
  }
}

export function getShopRoutesFromPathname(pathname: string): ShopRoutePaths {
  return buildShopRoutes(pathname.startsWith('/shop/manage') ? '/shop/manage' : '/merchant/shop')
}

export function getShopRoutesForShop(shop: ShopSummary | null | undefined): ShopRoutePaths {
  return buildShopRoutes(getShopManageHref(shop) as ShopManageBase)
}

/** Boutique active en contexte gestion (marchand lié ou boutique indépendante). */
export function getActiveShopIdForManage(
  shops: ShopSummary[] | undefined,
  activeMerchantId: string | null | undefined,
  activeShopId: string | null | undefined,
): string | null {
  const merchantShopId = getActiveMerchantShopId(shops, activeMerchantId, activeShopId)
  if (merchantShopId) return merchantShopId
  const independent = getIndependentShops(shops)
  if (!independent.length) return null
  if (activeShopId && independent.some(s => s.id === activeShopId)) return activeShopId
  return independent[0]?.id ?? null
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
  city_id?: string
  commune_id?: string
  latitude?: number | null
  longitude?: number | null
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

/** Détails boutique pour le propriétaire (DRAFT, ACTIVE, etc.). */
export async function fetchShopForManage(shopId: string): Promise<ShopDetails | null> {
  const res = await shopApiFetch(`/shops/${shopId}/manage`, shopId)
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
    city_id?: string
    commune_id?: string
    latitude?: number | null
    longitude?: number | null
    has_physical_location?: boolean
    delivery_fulfilment_default?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'
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

export interface ShopProductCategoryOption {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id: string | null
  sort_order: number
  enabled: boolean
}

export async function fetchShopProductCategories(
  shopId: string | null | undefined,
): Promise<{ categories: ShopProductCategoryOption[]; error?: string }> {
  if (!shopId) return { categories: [], error: 'Boutique introuvable' }
  const res = await shopApiFetch(`/shops/${shopId}/product-categories`, shopId)
  if (!res.ok) {
    try {
      const data = await res.json()
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
      return { categories: [], error: msg ?? 'Impossible de charger les catégories' }
    } catch {
      return { categories: [], error: 'Impossible de charger les catégories' }
    }
  }
  return { categories: await res.json() as ShopProductCategoryOption[] }
}

export async function saveShopProductCategories(
  shopId: string | null | undefined,
  categoryIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!shopId) return { ok: false, error: 'Boutique introuvable' }
  const res = await shopApiFetch(`/shops/${shopId}/product-categories`, shopId, {
    method: 'PUT',
    body: JSON.stringify({ category_ids: categoryIds }),
  })
  if (!res.ok) {
    try {
      const data = await res.json()
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
      return { ok: false, error: msg ?? 'Erreur' }
    } catch {
      return { ok: false, error: 'Erreur' }
    }
  }
  return { ok: true }
}

export async function uploadShopImage(
  shopId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const body = new FormData()
  body.append('file', file)
  const res = await shopApiFetch(`/shops/${shopId}/media/upload`, shopId, {
    method: 'POST',
    body,
  })
  if (!res.ok) {
    try {
      const data = await res.json()
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
      return { error: msg ?? 'Échec de l\'upload' }
    } catch {
      return { error: 'Échec de l\'upload' }
    }
  }
  return res.json() as Promise<{ url: string }>
}

export interface ShopMediaPage {
  logo?: string | null
  cover_image?: string | null
  gallery: Array<{ id: string; url: string; type?: string; order?: number; created_at?: string }>
  pagination?: { page: number; limit: number; total: number; has_more: boolean }
}

export async function fetchShopMedia(
  shopId: string,
  page = 1,
  limit = 24,
): Promise<ShopMediaPage | null> {
  const res = await shopApiFetch(`/shops/${shopId}/media?page=${page}&limit=${limit}`, shopId)
  if (!res.ok) return null
  return res.json() as Promise<ShopMediaPage>
}

export async function deleteShopMedia(shopId: string, mediaId: string): Promise<boolean> {
  const res = await shopApiFetch(`/shops/${shopId}/media/${mediaId}`, shopId, { method: 'DELETE' })
  return res.ok
}
