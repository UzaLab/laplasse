import { formatLocalDate } from './date-local'

/**
 * Modèle nuit hôtel / Airbnb :
 * la nuit `nightDateStr` = séjour du soir de ce jour au lendemain matin.
 * Occupée si check-in ≤ nightDateStr < check-out (date de départ exclusive).
 */
export function bookingOccupiesNight(
  bookedAt: Date,
  checkOutAt: Date | null,
  nightDateStr: string,
): boolean {
  const checkIn = formatLocalDate(bookedAt)
  if (!checkOutAt) {
    return checkIn === nightDateStr
  }
  const checkOut = formatLocalDate(checkOutAt)
  return checkIn <= nightDateStr && checkOut > nightDateStr
}

/** Nuits à facturer / bloquer pour un séjour [checkIn, checkOut). */
export function listStayNights(checkIn: Date, checkOut: Date): string[] {
  const nights: string[] = []
  const cursor = new Date(checkIn)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(checkOut)
  end.setHours(0, 0, 0, 0)
  while (cursor < end) {
    nights.push(formatLocalDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return nights
}

export function roomNamesMatch(a: string, b: string): boolean {
  const na = a.trim().toLowerCase()
  const nb = b.trim().toLowerCase()
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function bookingMatchesRoomService(
  booking: { service_id: string | null; room_type: string | null },
  serviceId: string,
  serviceName: string,
): boolean {
  if (booking.service_id === serviceId) return true
  if (booking.service_id) return false
  if (!booking.room_type?.trim()) return false
  return roomNamesMatch(booking.room_type, serviceName)
}

export function resolveRoomStockCapacity(capacity: number | null | undefined): number {
  if (capacity != null && capacity > 0) return capacity
  return 1
}

export function resolveRoomMaxGuests(
  maxGuests: number | null | undefined,
  capacity: number | null | undefined,
  isResidence: boolean,
): number | null {
  if (maxGuests != null && maxGuests > 0) return maxGuests
  if (isResidence && capacity != null && capacity > 0) return capacity
  return null
}
