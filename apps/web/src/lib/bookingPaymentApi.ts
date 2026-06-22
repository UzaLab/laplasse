import { countryRequestHeaders } from '@/lib/country'
import { ensureAuthSession, waitForAuthHydration } from '@/lib/authSession'

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

export interface BookingPaymentSession {
  payment_required: boolean
  booking_id: string
  merchant_name?: string
  payment?: {
    id: string
    reference: string
    amount: number
    currency: string
    provider: string
    instructions: string
  }
}

export async function fetchBookingPayment(bookingId: string): Promise<BookingPaymentSession | null> {
  await waitForAuthHydration()
  await ensureAuthSession()
  const res = await fetch(`${apiBase()}/payments/bookings/${bookingId}`, {
    credentials: 'include',
    headers: countryRequestHeaders(),
  })
  if (!res.ok) return null
  return res.json()
}

export async function confirmBookingPayment(
  bookingId: string,
  paymentId: string,
  simulateResult: 'success' | 'failure',
): Promise<{ result: { status: string; message?: string } | null; error?: string }> {
  await waitForAuthHydration()
  await ensureAuthSession()
  const res = await fetch(`${apiBase()}/payments/bookings/${bookingId}/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...countryRequestHeaders(),
    },
    body: JSON.stringify({ paymentId, simulateResult }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
    return { result: null, error: msg ?? 'Erreur de paiement' }
  }
  return { result: data }
}
