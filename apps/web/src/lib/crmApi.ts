import { merchantApiFetch } from './merchantApi'
import { shopApiFetch } from './shopApi'

export type CrmSegment = 'recent' | 'regular' | 'inactive' | 'lost'
export type CrmCustomerType = 'client' | 'prospect'

export type CrmCustomer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  isGuest: boolean
  profileType: 'registered' | 'guest'
  reviewCount: number
  avgRating: number
  lastReviewAt: string | null
  lastBookingAt: string | null
  bookingCount: number
  orderCount: number
  lastOrderAt: string | null
  totalSpent: number
  isFavorite: boolean
  productFavoriteCount: number
  interactionCount: number
  lastInteractionAt: string | null
  promoRedemptionCount: number
  sources: string[]
  customerType: CrmCustomerType
  segment: CrmSegment
  lastActivityAt: string | null
}

export type CrmSummary = {
  total_customers: number
  total_prospects: number
  recent_30d: number
  inactive_90d: number
  lost_180d: number
  regular: number
  recent_reviewers_30d: number
  total_orders: number
  total_revenue: number
  favorites_count: number
  interactions_30d: number
}

export type CrmContext = {
  mode: 'merchant' | 'shop'
  merchantId?: string
  shopId?: string
  hasShop: boolean
  shopName?: string
}

export type CrmData = {
  context: CrmContext
  summary: CrmSummary
  customers: CrmCustomer[]
}

export type CrmTimelineEvent = {
  type: 'review' | 'booking' | 'order' | 'interaction' | 'promo' | 'favorite' | 'product_favorite'
  date: string
  label: string
  detail?: string
  meta?: Record<string, unknown>
}

export type CrmCustomerDetail = CrmCustomer & {
  timeline: CrmTimelineEvent[]
}

export async function fetchMerchantCrm(activeMerchantId?: string | null): Promise<CrmData | null> {
  const r = await merchantApiFetch('/merchants/me/crm', activeMerchantId)
  if (!r.ok) return null
  return r.json() as Promise<CrmData>
}

export async function fetchMerchantCrmDetail(
  customerId: string,
  activeMerchantId?: string | null,
): Promise<CrmCustomerDetail | null> {
  const r = await merchantApiFetch(
    `/merchants/me/crm/detail?customerId=${encodeURIComponent(customerId)}`,
    activeMerchantId,
  )
  if (!r.ok) return null
  return r.json() as Promise<CrmCustomerDetail>
}

export async function fetchShopCrm(activeShopId?: string | null): Promise<CrmData | null> {
  if (!activeShopId) return null
  const r = await shopApiFetch(`/shops/${activeShopId}/crm`, activeShopId)
  if (!r.ok) return null
  return r.json() as Promise<CrmData>
}

export async function fetchShopCrmDetail(
  customerId: string,
  activeShopId?: string | null,
): Promise<CrmCustomerDetail | null> {
  if (!activeShopId) return null
  const r = await shopApiFetch(
    `/shops/${activeShopId}/crm/detail?customerId=${encodeURIComponent(customerId)}`,
    activeShopId,
  )
  if (!r.ok) return null
  return r.json() as Promise<CrmCustomerDetail>
}

export const SOURCE_LABELS: Record<string, string> = {
  review: 'Avis',
  booking: 'Réservation',
  favorite: 'Favori',
  order: 'Commande',
  interaction: 'Visite',
  promo: 'Promo',
  product_favorite: 'Produit favori',
}

export function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`
}

export function mailHref(email: string): string {
  return `mailto:${email}`
}
