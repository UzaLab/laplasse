import { authApiFetch } from './authFetch'

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null
  try { return await res.json() as T } catch { return null }
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

export interface DeliveryCourier {
  id: string
  full_name: string
  phone: string | null
  vehicle: string | null
  city: string | null
  country: string
}

export interface DeliveryJobSummary {
  id: string
  status: string
  tracking_token: string
  eta_minutes: number | null
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  courier: {
    id?: string
    full_name: string
    phone: string | null
    vehicle: string | null
  } | null
}

export async function fetchDeliveryCouriers(
  country?: string,
  city?: string,
): Promise<DeliveryCourier[]> {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  if (city) params.set('city', city)
  const qs = params.toString()
  const res = await authApiFetch(`/delivery/couriers${qs ? `?${qs}` : ''}`)
  const data = await parseJson<DeliveryCourier[]>(res)
  return data ?? []
}

export async function dispatchDeliveryOrder(
  orderId: string,
  options: {
    fulfilment_mode?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'
    courier_profile_id?: string
    logistics_partner_id?: string
    /** @deprecated legacy DeliveryCourier id */
    courier_id?: string
  } = {},
): Promise<{ job: DeliveryJobSummary | null; error?: string }> {
  const body: Record<string, string> = {}
  if (options.fulfilment_mode) body.fulfilment_mode = options.fulfilment_mode
  if (options.courier_profile_id) body.courier_profile_id = options.courier_profile_id
  if (options.logistics_partner_id) body.logistics_partner_id = options.logistics_partner_id
  if (options.courier_id) body.courier_id = options.courier_id

  const res = await authApiFetch(`/delivery/orders/${orderId}/dispatch`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) return { job: null, error: await parseError(res) }
  const job = await res.json() as DeliveryJobSummary
  return { job }
}

export function deliveryTrackingPath(token: string): string {
  return `/delivery/track/${token}`
}
