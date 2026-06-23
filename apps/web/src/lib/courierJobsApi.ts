import { authApiFetch } from './authFetch'

export type DeliveryJobStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'

export interface CourierJobRow {
  id: string
  status: DeliveryJobStatus
  tracking_token: string
  pickup_address: string | null
  dropoff_address: string | null
  eta_minutes: number | null
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

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json() as { message?: string | string[] }
    const msg = body.message
    return Array.isArray(msg) ? msg.join(', ') : msg ?? `Erreur ${res.status}`
  } catch {
    return `Erreur ${res.status}`
  }
}

export async function fetchAvailableJobs(): Promise<CourierJobRow[]> {
  const res = await authApiFetch('/couriers/me/jobs/available')
  if (!res.ok) return []
  return res.json() as Promise<CourierJobRow[]>
}

export async function fetchActiveJob(): Promise<CourierJobRow | null> {
  const res = await authApiFetch('/couriers/me/jobs/active')
  if (!res.ok) return null
  const data = await res.json()
  return data ?? null
}

export async function fetchJobHistory(): Promise<CourierJobRow[]> {
  const res = await authApiFetch('/couriers/me/jobs/history')
  if (!res.ok) return []
  return res.json() as Promise<CourierJobRow[]>
}

export async function acceptCourierJob(
  jobId: string,
): Promise<{ job: CourierJobRow | null; error?: string }> {
  const res = await authApiFetch(`/couriers/me/jobs/${jobId}/accept`, { method: 'POST' })
  if (!res.ok) return { job: null, error: await parseError(res) }
  const job = await res.json() as CourierJobRow
  return { job }
}

export async function rejectCourierJob(jobId: string): Promise<boolean> {
  const res = await authApiFetch(`/couriers/me/jobs/${jobId}/reject`, { method: 'POST' })
  return res.ok
}

export async function advanceCourierJob(
  jobId: string,
  status: DeliveryJobStatus,
  proofOtp?: string,
): Promise<{ job: CourierJobRow | null; error?: string }> {
  const res = await authApiFetch(`/couriers/me/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(proofOtp ? { proof_otp: proofOtp } : {}) }),
  })
  if (!res.ok) return { job: null, error: await parseError(res) }
  const job = await res.json() as CourierJobRow
  return { job }
}

export async function uploadCourierProofPhoto(
  jobId: string,
  file: File,
): Promise<{ proof_photo_url: string | null; error?: string }> {
  const body = new FormData()
  body.append('file', file)
  const res = await authApiFetch(`/couriers/me/jobs/${jobId}/proof-photo`, {
    method: 'POST',
    body,
  })
  if (!res.ok) return { proof_photo_url: null, error: await parseError(res) }
  const data = await res.json() as { proof_photo_url: string }
  return { proof_photo_url: data.proof_photo_url }
}

export async function fetchCourierWallet(): Promise<CourierWalletSummary | null> {
  const res = await authApiFetch('/couriers/me/wallet')
  if (!res.ok) return null
  return res.json() as Promise<CourierWalletSummary>
}

export async function fetchCourierWalletEntries(
  page = 1,
  limit = 15,
): Promise<CourierWalletEntriesPage> {
  const res = await authApiFetch(`/couriers/me/wallet/entries?page=${page}&limit=${limit}`)
  if (!res.ok) {
    return { items: [], total: 0, page: 1, pageSize: limit, totalPages: 1 }
  }
  return res.json() as Promise<CourierWalletEntriesPage>
}
