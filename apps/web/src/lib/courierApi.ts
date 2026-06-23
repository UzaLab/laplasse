import { authApiFetch } from './authFetch'

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
}

async function parseError(res: Response): Promise<string> {
  if (res.status === 429) {
    return 'Synchronisation GPS temporairement limitée — réessayez dans un instant'
  }
  try {
    const body = await res.json() as { message?: string | string[] }
    const msg = body.message
    return Array.isArray(msg) ? msg.join(', ') : msg ?? `Erreur ${res.status}`
  } catch {
    return `Erreur ${res.status}`
  }
}

export async function registerCourier(payload: {
  city: string
  phone: string
  country_code?: string
  vehicle?: string
  plate_number?: string
  partner_ref?: string
}): Promise<{ profile: CourierProfileSummary; role: string } | { error: string }> {
  const res = await authApiFetch('/couriers/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { error: await parseError(res) }
  return res.json() as Promise<{ profile: CourierProfileSummary; role: string }>
}

export async function fetchCourierProfile(): Promise<CourierProfileSummary | null> {
  const res = await authApiFetch('/couriers/me')
  if (!res.ok) return null
  return res.json() as Promise<CourierProfileSummary>
}

export async function setCourierOnline(
  isOnline: boolean,
): Promise<{ profile: CourierProfileSummary | null; error?: string }> {
  const res = await authApiFetch('/couriers/me/online', {
    method: 'PATCH',
    body: JSON.stringify({ is_online: isOnline }),
  })
  if (!res.ok) return { profile: null, error: await parseError(res) }
  const profile = await res.json() as CourierProfileSummary
  return { profile }
}

export async function updateCourierLocation(
  latitude: number,
  longitude: number,
): Promise<{ profile: CourierProfileSummary | null; error?: string }> {
  const res = await authApiFetch('/couriers/me/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  })
  if (!res.ok) return { profile: null, error: await parseError(res) }
  const profile = await res.json() as CourierProfileSummary
  return { profile }
}

export interface CourierServiceZoneRow {
  id: string
  all_communes: boolean
  is_active: boolean
  city: { id: string; name: string; slug: string; country: string }
  communes: Array<{ commune: { id: string; name: string; slug: string } }>
}

export async function fetchCourierZones(): Promise<CourierServiceZoneRow[]> {
  const res = await authApiFetch('/couriers/me/zones')
  if (!res.ok) return []
  return res.json() as Promise<CourierServiceZoneRow[]>
}

export async function upsertCourierZone(payload: {
  city_id: string
  all_communes: boolean
  commune_ids?: string[]
}): Promise<{ zone: CourierServiceZoneRow | null; error?: string }> {
  const res = await authApiFetch('/couriers/me/zones', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { zone: null, error: await parseError(res) }
  const zone = await res.json() as CourierServiceZoneRow
  return { zone }
}

export async function deleteCourierZone(zoneId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authApiFetch(`/couriers/me/zones/${zoneId}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, error: await parseError(res) }
  return { ok: true }
}
