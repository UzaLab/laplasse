import { authApiFetch } from './authFetch'
import { merchantApiFetch } from './merchantApi'
import { authUrl } from './authClient'
import { countryRequestHeaders } from './country'

export type AdTargetType = 'MERCHANT' | 'SHOP' | 'PRODUCT'
export type AdPlacement =
  | 'SEARCH'
  | 'FEATURED'
  | 'CATEGORY'
  | 'MARKETPLACE'
  | 'MARKETPLACE_FEATURED_PRODUCTS'

export const TARGET_LABELS: Record<AdTargetType, string> = {
  MERCHANT: 'Mon établissement',
  SHOP: 'Ma boutique',
  PRODUCT: 'Un produit',
}

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  SEARCH: 'Top recherche',
  FEATURED: "Page d'accueil",
  CATEGORY: 'Listing catégorie',
  MARKETPLACE: 'Boutiques à la une',
  MARKETPLACE_FEATURED_PRODUCTS: 'Produits à la une',
}

export interface PlacementAvailability {
  placement: AdPlacement
  capacity: number
  active: number
  waitlist: number
  available_slots: number
  is_saturated: boolean
}

export interface AdEligibilityMerchant {
  id: string
  business_name: string
  slug: string
  verification_status: string
  is_active: boolean
  logo: string | null
  eligible: boolean
}

export interface AdEligibilityShop {
  id: string
  name: string
  slug: string
  logo: string | null
  merchant_id: string | null
  active_products: number
  eligible: boolean
}

export interface AdEligibilityProduct {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url: string | null
  shop_id: string
  shop_name: string
  shop_slug: string
}

export interface AdEligibility {
  merchant: AdEligibilityMerchant | null
  shops: AdEligibilityShop[]
  products: AdEligibilityProduct[]
  suggestions?: AdSuggestion[]
  placement_availability?: Record<AdPlacement, PlacementAvailability>
}

export interface AdSuggestion {
  target_type: AdTargetType
  placement: AdPlacement
  target_id: string
  label: string
  message: string
}

export interface AdCampaign {
  id: string
  target_type: AdTargetType
  placement: AdPlacement
  status: string
  amount: number
  duration_days?: number
  starts_at: string
  ends_at: string
  impressions: number
  clicks: number
  waitlist_position?: number | null
  payment_id?: string | null
  merchant?: { id: string; business_name: string; slug: string } | null
  shop?: { id: string; name: string; slug: string } | null
  product?: { id: string; name: string; slug: string; image_url: string | null } | null
}

export interface AdCampaignStats {
  totals: {
    impressions: number
    clicks: number
    active: number
    waitlisted: number
    spent: number
    campaigns: number
    ctr: number | null
  }
  by_placement: Record<
    AdPlacement,
    { campaigns: number; active: number; waitlisted: number; impressions: number; clicks: number }
  >
  campaigns: Array<{
    id: string
    status: string
    placement: AdPlacement
    target_type: AdTargetType
    impressions: number
    clicks: number
    ctr: number | null
    amount: number
    waitlist_position: number | null
    starts_at: string
    ends_at: string
  }>
}

export interface AdPricing {
  prices: Record<string, Record<number, number>>
  durations: number[]
  placements_by_target: Record<AdTargetType, AdPlacement[]>
  placement_availability?: Record<AdPlacement, PlacementAvailability>
}

function withShopId(path: string, shopId?: string | null): string {
  if (!shopId) return path
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('shopId', shopId)
  return `${base}?${params.toString()}`
}

export async function fetchAdEligibility(merchantId?: string | null, shopId?: string | null) {
  const path = withShopId('/ads/eligibility', shopId)
  const res = await merchantApiFetch(path, merchantId)
  if (!res.ok) return null
  return res.json() as Promise<AdEligibility>
}

export async function fetchAdPricing() {
  const res = await authApiFetch('/ads/pricing')
  if (!res.ok) return null
  return res.json() as Promise<AdPricing>
}

export async function fetchAdCampaigns(merchantId?: string | null, shopId?: string | null) {
  const path = withShopId('/ads/campaigns', shopId)
  const res = await merchantApiFetch(path, merchantId)
  if (!res.ok) return []
  return res.json() as Promise<AdCampaign[]>
}

export async function fetchAdCampaignStats(merchantId?: string | null, shopId?: string | null) {
  const path = withShopId('/ads/campaigns/stats', shopId)
  const res = await merchantApiFetch(path, merchantId)
  if (!res.ok) return null
  return res.json() as Promise<AdCampaignStats>
}

export async function createAdCampaign(
  body: {
    target_type: AdTargetType
    target_id?: string
    placement: AdPlacement
    duration_days: number
    mode?: 'immediate' | 'waitlist'
  },
  merchantId?: string | null,
  shopId?: string | null,
) {
  const path = withShopId('/ads/campaigns', shopId)
  return merchantApiFetch(path, merchantId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function cancelAdWaitlist(
  campaignId: string,
  merchantId?: string | null,
  shopId?: string | null,
) {
  const path = withShopId(`/ads/campaigns/${campaignId}/cancel-waitlist`, shopId)
  return merchantApiFetch(path, merchantId, { method: 'POST' })
}

export async function confirmAdPayment(paymentId: string, simulateResult: 'success' | 'failure') {
  return authApiFetch('/ads/campaigns/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, simulateResult }),
  })
}

const recordedImpressions = new Set<string>()

export function recordAdEvent(campaignId: string, event: 'impression' | 'click') {
  if (event === 'impression' && recordedImpressions.has(campaignId)) return
  if (event === 'impression') recordedImpressions.add(campaignId)

  void fetch(authUrl('/ads/events'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
    body: JSON.stringify({ campaignId, event }),
  }).catch(() => {})
}
