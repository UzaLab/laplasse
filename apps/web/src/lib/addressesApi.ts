import { authApiFetch } from '@/lib/authFetch'

export interface UserAddress {
  id: string
  label: string | null
  city_id: string
  commune_id: string
  district: string
  address_detail: string | null
  latitude: number | null
  longitude: number | null
  is_default: boolean
  city: { id: string; name: string; slug: string; country: string; latitude?: number | null; longitude?: number | null }
  commune: { id: string; name: string; slug: string; latitude?: number | null; longitude?: number | null }
}

export interface CreateUserAddressInput {
  label?: string
  city_id: string
  commune_id: string
  district: string
  address_detail?: string
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] }
    const msg = body.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (msg) return msg
  } catch {
    /* ignore */
  }
  return `Erreur ${res.status}`
}

export async function fetchMyAddresses(): Promise<UserAddress[]> {
  const res = await authApiFetch('/addresses')
  if (!res.ok) return []
  return (await res.json()) as UserAddress[]
}

export async function createUserAddress(
  input: CreateUserAddressInput,
): Promise<{ address: UserAddress | null; error?: string }> {
  const res = await authApiFetch('/addresses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { address: null, error: await parseError(res) }
  const address = (await res.json()) as UserAddress
  return { address }
}

export async function deleteUserAddress(addressId: string): Promise<boolean> {
  const res = await authApiFetch(`/addresses/${addressId}`, { method: 'DELETE' })
  return res.ok
}

export async function updateUserAddress(
  addressId: string,
  input: Partial<CreateUserAddressInput>,
): Promise<{ address: UserAddress | null; error?: string }> {
  const res = await authApiFetch(`/addresses/${addressId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (!res.ok) return { address: null, error: await parseError(res) }
  const address = (await res.json()) as UserAddress
  return { address }
}

export async function setDefaultUserAddress(addressId: string): Promise<boolean> {
  const res = await authApiFetch(`/addresses/${addressId}/default`, { method: 'PATCH' })
  return res.ok
}

export function formatUserAddressLine(addr: UserAddress): string {
  return [addr.district, addr.commune.name, addr.city.name, addr.address_detail]
    .filter(Boolean)
    .join(', ')
}
