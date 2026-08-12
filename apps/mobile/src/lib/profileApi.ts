import type { MyBooking, MyBookingsPage } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { isBookingUpcoming, normalizeBookingsResponse } from '@/src/lib/bookingDisplay'

export async function fetchMyBookings(
  tab: 'upcoming' | 'history',
  page = 1,
  limit = 10,
): Promise<{ items: MyBooking[]; total: number; totalPages: number }> {
  const raw = await getApiClient().getMyBookings({ tab, page, limit })
  if (Array.isArray(raw)) {
    const filtered = raw.filter(b =>
      tab === 'upcoming' ? isBookingUpcoming(b) : !isBookingUpcoming(b),
    )
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)
    return {
      items,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    }
  }
  const data = raw as MyBookingsPage
  return {
    items: data.items ?? [],
    total: data.total ?? 0,
    totalPages: data.totalPages ?? 1,
  }
}

export async function fetchUpcomingBookings(limit = 20): Promise<MyBooking[]> {
  const raw = await getApiClient().getMyBookings({ tab: 'upcoming', limit })
  return normalizeBookingsResponse(raw).filter(isBookingUpcoming)
}
