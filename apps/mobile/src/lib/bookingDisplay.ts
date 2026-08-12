import { formatPrice } from '@laplasse/shared-config'
import type { BookingType, MyBooking } from '@laplasse/api-client'

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absent',
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  TABLE: 'Table',
  APPOINTMENT: 'Rendez-vous',
  ROOM: 'Chambre',
  CONSULTATION: 'Consultation',
  VENUE: 'Événement',
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
}

export function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', DATE_OPTS)
}

export function formatBookingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', TIME_OPTS)
}

export function countRoomNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn.slice(0, 10)}T12:00:00`)
  const end = new Date(`${checkOut.slice(0, 10)}T12:00:00`)
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

export function isBookingUpcoming(booking: MyBooking): boolean {
  const now = new Date()
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
  if (booking.booking_type === 'ROOM' && booking.check_out_at) {
    return new Date(booking.check_out_at) > now
  }
  return new Date(booking.booked_at) >= now
}

export function getBookingWhenDisplay(booking: MyBooking): {
  headline: string
  subline?: string
} {
  if (booking.booking_type === 'ROOM') {
    const checkIn = formatBookingDate(booking.booked_at)
    if (booking.check_out_at) {
      const nights = countRoomNights(booking.booked_at, booking.check_out_at)
      return {
        headline: `${checkIn} → ${formatBookingDate(booking.check_out_at)}`,
        subline: nights > 0 ? `${nights} nuit${nights > 1 ? 's' : ''}` : undefined,
      }
    }
    return { headline: `Arrivée · ${checkIn}` }
  }
  return {
    headline: formatBookingDate(booking.booked_at),
    subline: formatBookingTime(booking.booked_at),
  }
}

export function getBookingCardMeta(booking: MyBooking): string[] {
  const meta: string[] = []
  if (booking.service?.name) meta.push(booking.service.name)
  if (booking.party_size > 1) meta.push(`${booking.party_size} pers.`)
  if (booking.service?.duration_min) meta.push(`${booking.service.duration_min} min`)
  return meta
}

export function getBookingPricingSummary(booking: MyBooking): string | null {
  if (
    (booking.booking_type === 'APPOINTMENT' || booking.booking_type === 'CONSULTATION')
    && booking.service?.price
  ) {
    return formatPrice(booking.service.price, 'XOF')
  }
  return null
}

export function normalizeBookingsResponse(
  raw: MyBooking[] | { items?: MyBooking[] },
): MyBooking[] {
  if (Array.isArray(raw)) return raw
  return raw.items ?? []
}
