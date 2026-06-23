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
  current_latitude?: number | null
  current_longitude?: number | null
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

export interface PartnerContractSummary {
  id: string
  status: string
  fee_override: number | null
  sla_eta_max_minutes: number | null
  auto_dispatch: boolean
  signed_at: string | null
  updated_at: string
  shop: { id: string; name: string; slug: string; city: string; logo: string | null }
}

export interface PartnerContractDetail extends PartnerContractSummary {
  created_at: string
  stats: {
    jobs_30d: number
    revenue_30d: number
    sla_rate: number | null
    last_delivery_at: string | null
  }
}

export interface PartnerProspect {
  id: string
  name: string
  slug: string
  city: string
  district: string | null
  logo: string | null
  delivery_fulfilment_default: DeliveryFulfilmentMode
  estimated_deliveries_30d: number
  matched_communes: string[]
  latitude: number | null
  longitude: number | null
}

export async function fetchPartnerContracts(): Promise<PartnerContractSummary[]> {
  const res = await authApiFetch('/logistics/me/contracts')
  if (!res.ok) return []
  return res.json() as Promise<PartnerContractSummary[]>
}

export async function fetchPartnerContract(contractId: string): Promise<PartnerContractDetail | null> {
  const res = await authApiFetch(`/logistics/me/contracts/${contractId}`)
  if (!res.ok) return null
  return res.json() as Promise<PartnerContractDetail>
}

export async function updatePartnerContract(
  contractId: string,
  body: {
    sla_eta_max_minutes?: number
    fee_override?: number | null
    auto_dispatch?: boolean
    pause?: boolean
  },
): Promise<{ contract: PartnerContractDetail | null; error?: string }> {
  const res = await authApiFetch(`/logistics/me/contracts/${contractId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return { contract: null, error: await parseError(res) }
  return { contract: await res.json() as PartnerContractDetail }
}

export async function fetchPartnerProspects(): Promise<{
  prospects: PartnerProspect[]
  communes_configured: boolean
}> {
  const res = await authApiFetch('/logistics/me/prospects')
  if (!res.ok) return { prospects: [], communes_configured: true }
  return res.json() as Promise<{ prospects: PartnerProspect[]; communes_configured: boolean }>
}

export async function proposePartnerProspect(
  shopId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/prospects/${shopId}/propose`, { method: 'POST' })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
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

export async function updateFleetCourierStatus(
  courierId: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/fleet/${courierId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export interface LogisticsPartnerSettings {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  country: string
  city: string
  phone: string
  email: string | null
  logo: string | null
  verification: string
  rccm_number: string | null
  kyc_document_url: string | null
  fleet_size_range: string | null
  vehicle_types: string[]
  sla_eta_default_minutes: number | null
  auto_dispatch_default: boolean
  payout_method: string | null
  payout_number: string | null
  commission_rate: number
  onboarding_step: number
  address: string | null
  dispatch_pending_alert_minutes: number
  commune_ids: string[]
  communes: Array<{ id: string; name: string; city: string; city_slug: string }>
}

export async function fetchLogisticsPartnerSettings(): Promise<LogisticsPartnerSettings | null> {
  const res = await authApiFetch('/logistics/me/settings')
  if (!res.ok) return null
  return res.json() as Promise<LogisticsPartnerSettings>
}

export async function updatePartnerSettings(
  input: Partial<LogisticsPartnerSettings>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch('/logistics/me/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export async function uploadLogisticsPartnerLogo(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await authApiFetch('/logistics/me/logo', { method: 'POST', body: form })
  if (!res.ok) return { error: await parseError(res) }
  return { partner: await res.json() as { id: string; logo: string } }
}

export async function uploadLogisticsKycDocument(file: File): Promise<{ partner?: { kyc_document_url?: string | null }; error?: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await authApiFetch('/logistics/me/kyc-document', { method: 'POST', body: form })
  if (!res.ok) return { error: await parseError(res) }
  return { partner: await res.json() as { kyc_document_url?: string | null } }
}

export interface DispatchBoardCourier {
  id: string
  label: string
  is_online: boolean
  status: string
  rating_avg: number
  active_jobs: number
  lat: number | null
  lng: number | null
  vehicle: string | null
}

export interface DispatchBoardJob extends PartnerDeliveryJob {
  pickup_lat?: number | null
  pickup_lng?: number | null
  dropoff_lat?: number | null
  dropoff_lng?: number | null
  pending_minutes?: number
  is_urgent?: boolean
  suggested_courier_id?: string | null
  suggested_courier_name?: string | null
  suggested_couriers?: Array<{
    courier_profile_id: string
    label: string
    dispatch_score: number
  }>
}

export interface PartnerDispatchBoard {
  auto_dispatch_default: boolean
  sla_pending_threshold_minutes: number
  commune_options: Array<{ id: string; name: string }>
  offline_couriers: Array<{
    id: string
    label: string
    active_jobs: number
    is_online: boolean
    last_location_at: string | null
  }>
  fleet: DispatchBoardCourier[]
  jobs: DispatchBoardJob[]
}

export async function saveLogisticsOnboarding(input: {
  step: number
  legal_name?: string
  trade_name?: string
  rccm_number?: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  fleet_size_range?: string
  vehicle_types?: string[]
  commune_ids?: string[]
  sla_eta_default_minutes?: number
  auto_dispatch_default?: boolean
  payout_method?: string
  payout_number?: string
}): Promise<{ settings: LogisticsPartnerSettings | null; error?: string }> {
  const res = await authApiFetch('/logistics/me/onboarding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { settings: null, error: await parseError(res) }
  return { settings: await res.json() as LogisticsPartnerSettings }
}

export async function fetchFleetInviteLink(): Promise<{
  url: string
  slug: string
  partner_name: string
} | null> {
  const res = await authApiFetch('/logistics/me/fleet/invite-link')
  if (!res.ok) return null
  return res.json() as Promise<{ url: string; slug: string; partner_name: string }>
}

export async function fetchPartnerDispatchBoard(communeId?: string): Promise<PartnerDispatchBoard | null> {
  const qs = communeId ? `?commune_id=${encodeURIComponent(communeId)}` : ''
  const res = await authApiFetch(`/logistics/me/dispatch-board${qs}`)
  if (!res.ok) return null
  return res.json() as Promise<PartnerDispatchBoard>
}

export async function releasePartnerJob(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/logistics/me/jobs/${jobId}/release`, { method: 'PATCH' })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}

export interface PartnerFinancesPayout {
  id: string
  period_start: string
  period_end: string
  amount: number
  status: string
  reference: string | null
  paid_at: string | null
  created_at: string
}

export interface PartnerFinances {
  month: string
  summary: {
    total_jobs: number
    delivery_fees_total: number
    partner_commission: number
    courier_payouts: number
    platform_share: number
    commission_rate: number
  }
  by_shop: Array<{ shop_id: string; shop_name: string; jobs: number; fees: number; commission: number }>
  by_courier: Array<{ courier_id: string; name: string; jobs: number; earnings: number }>
  ledger: Array<{
    job_id: string
    delivered_at: string | null
    shop_name: string
    courier_name: string | null
    delivery_fee: number
    partner_commission: number
    courier_payout: number
    platform_share: number
  }>
  payouts: PartnerFinancesPayout[]
}

export async function fetchPartnerFinances(month?: string): Promise<PartnerFinances | null> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : ''
  const res = await authApiFetch(`/logistics/me/finances${qs}`)
  if (!res.ok) return null
  return res.json() as Promise<PartnerFinances>
}

export async function downloadPartnerFinancesCsv(
  month?: string,
): Promise<{ ok: boolean; error?: string }> {
  const qs = month ? `?month=${encodeURIComponent(month)}` : ''
  const res = await authApiFetch(`/logistics/me/finances/export${qs}`)
  if (!res.ok) return { ok: false, error: await parseError(res) }
  const blob = await res.blob()
  const stamp = month ?? new Date().toISOString().slice(0, 7)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finances-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
  return { ok: true }
}

export interface PartnerQuality {
  summary: {
    open_disputes: number
    sla_breach_rate_30d: number
    sla_breach_alert: boolean
    underperforming_couriers: number
    resolved_disputes_30d: number
  }
  disputes: {
    open: Array<{
      id: string
      reason: string
      description: string | null
      status: string
      created_at: string
      client_name: string
      shop_name: string | null
      order_id: string
      job_id: string | null
      courier_id: string | null
      courier_name: string | null
      proof_photo_url: string | null
    }>
    resolved: Array<{
      id: string
      reason: string
      status: string
      admin_note: string | null
      created_at: string
      resolved_at: string | null
      shop_name: string | null
      order_id: string
      job_id: string | null
      courier_name: string | null
    }>
  }
  sla: {
    breach_rate_30d: number
    threshold_exceeded: boolean
    delivered_count_30d: number
    breaches: Array<{
      job_id: string
      shop_name: string
      courier_name: string | null
      sla_minutes: number
      delay_minutes: number
      delivered_at: string
    }>
  }
  underperforming_couriers: Array<{
    id: string
    name: string
    status: string
    rating_avg: number
    rating_count: number
    cancellation_rate: number
    issues: string[]
    severity: 'alert' | 'incident'
  }>
}

export async function fetchPartnerQuality(): Promise<PartnerQuality | null> {
  const res = await authApiFetch('/logistics/me/quality')
  if (!res.ok) return null
  return res.json() as Promise<PartnerQuality>
}
