export type DeliveryJobStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'

export interface CourierProfileSummary {
  id: string
  status: string
  city: string
  country: string
  phone?: string
  vehicle: string
  plate_number?: string | null
  is_online?: boolean
  current_latitude?: number | null
  current_longitude?: number | null
  last_location_at?: string | null
  rating_avg?: number
  rating_count?: number
  completed_jobs?: number
  id_document_url?: string | null
}

export interface CourierServiceZoneRow {
  id: string
  all_communes: boolean
  is_active: boolean
  city: { id: string; name: string; slug: string; country: string }
  communes: Array<{ commune: { id: string; name: string; slug: string } }>
}

export interface CourierJobRow {
  id: string
  status: DeliveryJobStatus
  tracking_token: string
  pickup_address: string | null
  dropoff_address: string | null
  eta_minutes: number | null
  required_vehicle: string | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  proof_photo_url: string | null
  created_at: string
  offered_to_me: boolean
  offer_expires_at: string | null
  offer_seconds_left: number | null
  order: {
    id: string
    status: string
    total: number
    delivery_fee: number
    delivery_address: string | null
    delivery_district: string | null
    customer_phone: string | null
    customer_name: string | null
    customer_note: string | null
    food_cash_exact: boolean | null
    food_cash_tender_amount: number | null
    item_count: number
    shop_name: string
    shop_address: string | null
    created_at: string
  }
}

export interface CourierWalletSummary {
  balance: number
  today: number
  week: number
  month: number
  total_earned: number
  completed_paid_jobs: number
}

export interface CourierWalletEntry {
  id: string
  job_id: string | null
  amount: number
  type: string
  label: string | null
  created_at: string
}

export interface CourierWalletEntriesPage {
  items: CourierWalletEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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
  onboarding_step?: number
  logo?: string | null
  _count: { couriers: number; contracts: number }
}

export interface LogisticsPartnerSettings {
  legal_name: string
  trade_name: string | null
  rccm_number: string | null
  city: string
  country: string
  phone: string
  email: string | null
  fleet_size_range: string | null
  vehicle_types: string[]
  sla_eta_default_minutes: number | null
  auto_dispatch_default: boolean
  payout_method: string | null
  payout_number: string | null
  kyc_document_url: string | null
  onboarding_step: number
  address: string | null
  commune_ids: string[]
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
