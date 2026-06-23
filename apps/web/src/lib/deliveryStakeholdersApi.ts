import { authApiFetch } from './authFetch'
import { shopApiFetch } from './shopApi'

export type DeliveryFulfilmentMode = 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'

export interface ShopCourierStaff {
  id: string
  phone: string
  vehicle: string | null
  status: string
  is_online: boolean
  rating_avg: number
  completed_jobs: number
  user: { id: string; full_name: string | null; email: string }
}

export interface DeliveryPartnerContract {
  id: string
  status: string
  fee_override: number | null
  sla_eta_max_minutes: number | null
  signed_at: string | null
  partner: {
    id: string
    legal_name: string
    trade_name: string | null
    slug: string
    city: string
    phone: string
    rating_avg: number
  }
}

export interface LogisticsPartnerKpis {
  total_jobs: number
  delivered_jobs: number
  failed_jobs: number
  success_rate: number
  offers_sent: number
  offers_accepted: number
  offers_rejected: number
  acceptance_rate: number
  on_time_deliveries: number
  on_time_rate: number
  fleet_total: number
  fleet_online: number
  fleet_availability_rate: number
  communes_covered: number
  cities_covered: number
  zone_coverage_score: number
  active_contracts: number
  rating_avg: number
  rating_count: number
}

export interface PublicLogisticsPartner {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  country: string
  rating_avg: number
  rating_count: number
  fleet_size?: number
  score?: number
  grade?: 'A' | 'B' | 'C' | 'D'
  kpis?: LogisticsPartnerKpis
}

export interface LogisticsPartnerMe {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  country: string
  phone: string
  verification: string
  is_active: boolean
  _count: { couriers: number; contracts: number }
}

export interface PartnerFleetCourier {
  id: string
  phone: string
  vehicle: string | null
  status: string
  is_online: boolean
  rating_avg: number
  rating_count: number
  completed_jobs: number
  cancellation_rate: number
  city: string
  last_location_at: string | null
  wallet_balance: number
  stats_90d: {
    total_jobs: number
    delivered_jobs: number
    active_jobs: number
    success_rate: number
  }
  user: { full_name: string | null; email: string }
}

export interface PartnerDeliveryJob {
  id: string
  status: string
  tracking_token?: string
  pickup_address?: string | null
  dropoff_address?: string | null
  eta_minutes?: number | null
  created_at?: string
  assigned_at?: string | null
  delivered_at?: string | null
  order: {
    id: string
    total: number
    delivery_fee?: number
    delivery_address: string | null
    customer_phone?: string | null
    shop: { id?: string; name: string; slug?: string } | null
  }
  courier_profile: {
    id: string
    phone?: string
    vehicle?: string | null
    is_online?: boolean
    user: { full_name: string | null; email?: string }
  } | null
}

export interface PartnerStats {
  score: number
  grade: string
  kpis: LogisticsPartnerKpis
  breakdown: Record<string, number>
  fleet: { total: number; online: number; active_contracts: number }
  jobs: { active: number; pending: number; delivered_30d: number; failed_30d: number }
  finances: {
    period_days: number
    delivery_fees_total: number
    courier_payouts: number
    partner_commission: number
    platform_share: number
    commission_rate: number
  }
}

export interface PartnerCourierDetail {
  profile: {
    id: string
    phone: string
    vehicle: string | null
    plate_number: string | null
    status: string
    is_online: boolean
    city: string
    rating_avg: number
    rating_count: number
    completed_jobs: number
    cancellation_rate: number
    last_location_at: string | null
    current_latitude: number | null
    current_longitude: number | null
  }
  user: { id: string; full_name: string | null; email: string; phone: string | null }
  zones: Array<{ city: string; communes: string }>
  kpis: {
    period_days: number
    total_jobs: number
    delivered_jobs: number
    failed_jobs: number
    success_rate: number
    on_time_rate: number
    active_jobs: number
    earnings_90d: number
    earnings_30d: number
    wallet_balance: number
  }
  job_history: Array<{
    id: string
    status: string
    tracking_token: string
    created_at: string
    assigned_at: string | null
    delivered_at: string | null
    pickup_address: string | null
    dropoff_address: string | null
    order: {
      id: string
      total: number
      delivery_fee: number
      delivery_address: string | null
      shop: { name: string }
    }
  }>
  wallet_entries: Array<{
    id: string
    amount: number
    type: string
    label: string | null
    created_at: string
    job_id: string | null
  }>
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json() as { message?: string | string[] }
    const msg = body.message
    return Array.isArray(msg) ? msg.join(', ') : msg ?? `Erreur ${res.status}`
  } catch {
    return `Erreur ${res.status}`
  }
}

export async function fetchShopCourierStaff(shopId: string): Promise<ShopCourierStaff[]> {
  const res = await shopApiFetch(`/shops/${shopId}/courier-staff`, shopId)
  if (!res.ok) return []
  return res.json() as Promise<ShopCourierStaff[]>
}

export async function linkShopCourierStaff(
  shopId: string,
  email: string,
): Promise<{ staff: ShopCourierStaff | null; error?: string }> {
  const res = await shopApiFetch(`/shops/${shopId}/courier-staff/link`, shopId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) return { staff: null, error: await parseError(res) }
  return { staff: await res.json() as ShopCourierStaff }
}

export async function unlinkShopCourierStaff(
  shopId: string,
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await shopApiFetch(`/shops/${shopId}/courier-staff/${profileId}`, shopId, {
    method: 'DELETE',
  })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export async function fetchShopDeliveryContracts(shopId: string): Promise<DeliveryPartnerContract[]> {
  const res = await shopApiFetch(`/shops/${shopId}/delivery-contracts`, shopId)
  if (!res.ok) return []
  return res.json() as Promise<DeliveryPartnerContract[]>
}

export async function requestDeliveryContract(
  shopId: string,
  logisticsPartnerId: string,
): Promise<{ contract: DeliveryPartnerContract | null; error?: string }> {
  const res = await shopApiFetch(`/shops/${shopId}/delivery-contracts`, shopId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logistics_partner_id: logisticsPartnerId }),
  })
  if (!res.ok) return { contract: null, error: await parseError(res) }
  return { contract: await res.json() as DeliveryPartnerContract }
}

export async function acceptDeliveryContract(
  shopId: string,
  contractId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await shopApiFetch(
    `/shops/${shopId}/delivery-contracts/${contractId}/accept`,
    shopId,
    { method: 'PATCH' },
  )
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export async function fetchPublicLogisticsPartners(
  country?: string,
  city?: string,
): Promise<PublicLogisticsPartner[]> {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (city) params.set('city', city)
  const qs = params.toString()
  const res = await authApiFetch(`/logistics/partners${qs ? `?${qs}` : ''}`)
  if (!res.ok) return []
  return res.json() as Promise<PublicLogisticsPartner[]>
}

export async function registerLogisticsPartner(input: {
  legal_name: string
  trade_name?: string
  city: string
  phone: string
  email?: string
  country?: string
}): Promise<{ partner: LogisticsPartnerMe | null; error?: string }> {
  const res = await authApiFetch('/logistics/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { partner: null, error: await parseError(res) }
  return { partner: await res.json() as LogisticsPartnerMe }
}

export async function fetchLogisticsPartnerMe(): Promise<LogisticsPartnerMe | null> {
  const res = await authApiFetch('/logistics/me')
  if (!res.ok) return null
  return res.json() as Promise<LogisticsPartnerMe | null>
}

export async function fetchPartnerFleet(): Promise<PartnerFleetCourier[]> {
  const res = await authApiFetch('/logistics/me/fleet')
  if (!res.ok) return []
  return res.json() as Promise<PartnerFleetCourier[]>
}

export async function linkPartnerFleetCourier(
  email: string,
): Promise<{ courier: PartnerFleetCourier | null; error?: string }> {
  const res = await authApiFetch('/logistics/me/fleet/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) return { courier: null, error: await parseError(res) }
  return { courier: await res.json() as PartnerFleetCourier }
}

export async function fetchPartnerJobs(): Promise<PartnerDeliveryJob[]> {
  const res = await authApiFetch('/logistics/me/jobs')
  if (!res.ok) return []
  return res.json() as Promise<PartnerDeliveryJob[]>
}

export async function assignPartnerJob(
  jobId: string,
  courierProfileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/jobs/${jobId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courier_profile_id: courierProfileId }),
  })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export async function fetchPartnerContracts(): Promise<Array<{
  id: string
  status: string
  shop: { id: string; name: string; slug: string }
}>> {
  const res = await authApiFetch('/logistics/me/contracts')
  if (!res.ok) return []
  return res.json() as Promise<Array<{
    id: string
    status: string
    shop: { id: string; name: string; slug: string }
  }>>
}

export async function respondPartnerContract(
  contractId: string,
  accept: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/contracts/${contractId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accept }),
  })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export async function fetchPartnerStats(): Promise<PartnerStats | null> {
  const res = await authApiFetch('/logistics/me/stats')
  if (!res.ok) return null
  return res.json() as Promise<PartnerStats>
}

export async function fetchPartnerJobsList(opts?: {
  status?: string
  days?: number
  take?: number
}): Promise<PartnerDeliveryJob[]> {
  const params = new URLSearchParams()
  if (opts?.status) params.set('status', opts.status)
  if (opts?.days) params.set('days', String(opts.days))
  if (opts?.take) params.set('take', String(opts.take))
  const qs = params.toString()
  const res = await authApiFetch(`/logistics/me/jobs/list${qs ? `?${qs}` : ''}`)
  if (!res.ok) return []
  return res.json() as Promise<PartnerDeliveryJob[]>
}

export async function fetchPartnerJob(jobId: string): Promise<PartnerDeliveryJob | null> {
  const res = await authApiFetch(`/logistics/me/jobs/${jobId}`)
  if (!res.ok) return null
  return res.json() as Promise<PartnerDeliveryJob>
}

export async function fetchPartnerCourierDetail(courierId: string): Promise<PartnerCourierDetail | null> {
  const res = await authApiFetch(`/logistics/me/fleet/${courierId}`)
  if (!res.ok) return null
  return res.json() as Promise<PartnerCourierDetail>
}

export async function unlinkPartnerFleetCourier(
  courierId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/fleet/${courierId}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}
