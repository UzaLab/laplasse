import { countryRequestHeaders } from '@/lib/country'
import { ensureAuthSession, waitForAuthHydration } from '@/lib/authSession'

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

/** Création réservation — invité ou connecté (JWT optionnel via cookies). */
export async function createMerchantBooking(
  merchantId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  await waitForAuthHydration()
  await ensureAuthSession()

  return fetch(`${apiBase()}/bookings/merchant/${merchantId}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
    body: JSON.stringify(body),
  })
}
