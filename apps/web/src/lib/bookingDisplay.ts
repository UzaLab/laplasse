import type { BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS, formatPrice } from '@/lib/bookingConfig'

export interface BookingServiceInfo {
  id: string
  name: string
  price?: number | null
  nightly_rate?: number | null
  duration_min?: number | null
}

export interface BookingDisplaySource {
  id: string
  booking_type: BookingType
  booked_at: string
  check_out_at?: string | null
  party_size: number
  status: string
  guest_name: string
  guest_phone: string
  guest_email?: string | null
  notes?: string | null
  room_type?: string | null
  service?: BookingServiceInfo | null
  staff?: { id: string; name: string } | null
  merchant?: { business_name: string; slug: string; cover_image?: string | null }
  created_at?: string
  updated_at?: string
  user_id?: string | null
  user?: { id: string; full_name: string | null; email: string | null } | null
}

export interface BookingPricing {
  nightlyRate: number | null
  nights: number
  unitLabel: string
  total: number | null
  formattedTotal: string | null
  formattedUnit: string | null
  summary: string | null
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absent',
}

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border-slate-200',
  NO_SHOW: 'bg-red-50 text-red-700 border-red-200',
}

export const BOOKING_TYPE_STYLES: Record<BookingType, string> = {
  TABLE: 'bg-orange-50 text-orange-700 border-orange-200',
  APPOINTMENT: 'bg-violet-50 text-violet-700 border-violet-200',
  ROOM: 'bg-sky-50 text-sky-700 border-sky-200',
  CONSULTATION: 'bg-teal-50 text-teal-700 border-teal-200',
  VENUE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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

/** Tarification indicative selon le vertical (hôtel, prestations payantes…). */
export function getBookingPricing(booking: BookingDisplaySource): BookingPricing | null {
  const svc = booking.service

  if (booking.booking_type === 'ROOM') {
    const nightlyRate = svc?.nightly_rate ?? svc?.price ?? null
    if (nightlyRate == null) return null
    const nights = booking.check_out_at
      ? countRoomNights(booking.booked_at, booking.check_out_at)
      : 0
    const total = nights > 0 ? nightlyRate * nights : null
    const formattedUnit = `${formatPrice(nightlyRate)}/nuit`
    const formattedTotal = total != null ? formatPrice(total) : null
    const summary = total != null && nights > 0
      ? `${formatPrice(nightlyRate)}/nuit × ${nights} nuit${nights > 1 ? 's' : ''} = ${formatPrice(total)}`
      : formattedUnit
    return {
      nightlyRate,
      nights,
      unitLabel: 'nuit',
      total,
      formattedTotal,
      formattedUnit,
      summary,
    }
  }

  if (
    (booking.booking_type === 'APPOINTMENT' || booking.booking_type === 'CONSULTATION')
    && svc?.price != null
    && svc.price > 0
  ) {
    return {
      nightlyRate: null,
      nights: 0,
      unitLabel: 'prestation',
      total: svc.price,
      formattedTotal: formatPrice(svc.price),
      formattedUnit: formatPrice(svc.price),
      summary: formatPrice(svc.price),
    }
  }

  return null
}

export function isBookingUpcoming(booking: BookingDisplaySource): boolean {
  const now = new Date()
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
  if (booking.booking_type === 'ROOM' && booking.check_out_at) {
    return new Date(booking.check_out_at) > now
  }
  return new Date(booking.booked_at) >= now
}

export function canManageBooking(booking: BookingDisplaySource, tab: 'upcoming' | 'history') {
  const ok = tab === 'upcoming' && ['PENDING', 'CONFIRMED'].includes(booking.status)
  return { canEdit: ok, canCancel: ok }
}

export interface BookingWhenDisplay {
  headline: string
  subline?: string
  showTime: boolean
}

/** Libellé principal date/heure selon le vertical. */
export function getBookingWhenDisplay(booking: BookingDisplaySource): BookingWhenDisplay {
  const start = booking.booked_at

  if (booking.booking_type === 'ROOM') {
    const checkIn = formatBookingDate(start)
    if (booking.check_out_at) {
      const nights = countRoomNights(start, booking.check_out_at)
      return {
        headline: `${checkIn} → ${formatBookingDate(booking.check_out_at)}`,
        subline: nights > 0 ? `${nights} nuit${nights > 1 ? 's' : ''}` : undefined,
        showTime: false,
      }
    }
    return { headline: `Arrivée · ${checkIn}`, showTime: false }
  }

  return {
    headline: formatBookingDate(start),
    subline: formatBookingTime(start),
    showTime: true,
  }
}

export interface BookingDetailRow {
  label: string
  value: string
}

/** Lignes de détail pour la fiche complète. */
export function getBookingDetailRows(booking: BookingDisplaySource): BookingDetailRow[] {
  const rows: BookingDetailRow[] = []
  const when = getBookingWhenDisplay(booking)

  rows.push({ label: 'Type', value: BOOKING_TYPE_LABELS[booking.booking_type] })
  rows.push({ label: 'Statut', value: BOOKING_STATUS_LABELS[booking.status] ?? booking.status })

  if (booking.booking_type === 'ROOM') {
    rows.push({ label: 'Arrivée', value: formatBookingDate(booking.booked_at) })
    if (booking.check_out_at) {
      rows.push({ label: 'Départ', value: formatBookingDate(booking.check_out_at) })
      const nights = countRoomNights(booking.booked_at, booking.check_out_at)
      if (nights > 0) rows.push({ label: 'Durée', value: `${nights} nuit${nights > 1 ? 's' : ''}` })
    }
  } else {
    rows.push({ label: 'Date', value: when.headline })
    rows.push({ label: 'Heure', value: when.subline ?? formatBookingTime(booking.booked_at) })
  }

  const offering = booking.service?.name ?? booking.room_type
  if (offering) {
    const label =
      booking.booking_type === 'ROOM' ? 'Chambre / logement'
      : booking.booking_type === 'CONSULTATION' ? 'Consultation'
      : booking.booking_type === 'APPOINTMENT' ? 'Prestation'
      : booking.booking_type === 'TABLE' ? 'Formule'
      : 'Prestation'
    rows.push({ label, value: offering })
  }

  if (booking.staff?.name) {
    rows.push({ label: 'Avec', value: booking.staff.name })
  }

  if (booking.booking_type === 'TABLE' || booking.booking_type === 'ROOM') {
    rows.push({
      label: booking.booking_type === 'ROOM' ? 'Voyageurs' : 'Convives',
      value: `${booking.party_size} personne${booking.party_size > 1 ? 's' : ''}`,
    })
  }

  const pricing = getBookingPricing(booking)
  if (pricing) {
    if (booking.booking_type === 'ROOM' && pricing.formattedUnit) {
      rows.push({ label: 'Tarif / nuit', value: pricing.formattedUnit })
    }
    if (pricing.formattedTotal) {
      rows.push({
        label: booking.booking_type === 'ROOM' ? 'Total séjour' : 'Tarif',
        value: pricing.summary ?? pricing.formattedTotal,
      })
    }
  }

  if (booking.service?.duration_min && booking.booking_type !== 'ROOM') {
    rows.push({ label: 'Durée', value: `${booking.service.duration_min} min` })
  }

  rows.push({ label: 'Nom', value: booking.guest_name })
  rows.push({ label: 'Téléphone', value: booking.guest_phone })
  if (booking.guest_email) rows.push({ label: 'E-mail', value: booking.guest_email })
  if (booking.notes) rows.push({ label: 'Notes', value: booking.notes })

  return rows
}

/** Résumé court pour la carte liste. */
export function getBookingCardMeta(booking: BookingDisplaySource): string[] {
  const lines: string[] = []
  const offering = booking.service?.name ?? booking.room_type
  if (offering) lines.push(offering)
  if (booking.staff?.name) lines.push(`Avec ${booking.staff.name}`)
  if (booking.booking_type === 'TABLE' || booking.booking_type === 'ROOM') {
    lines.push(`${booking.party_size} pers.`)
  }
  const pricing = getBookingPricing(booking)
  if (pricing?.formattedTotal && booking.booking_type !== 'ROOM') {
    lines.push(pricing.formattedTotal)
  }
  return lines
}

export type MerchantBookingStatusAction = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface MerchantBookingAction {
  status: MerchantBookingStatusAction
  label: string
  variant: 'primary' | 'danger' | 'neutral'
}

/** Actions disponibles pour le marchand selon le statut actuel. */
export function getMerchantBookingActions(status: string): MerchantBookingAction[] {
  switch (status) {
    case 'PENDING':
      return [
        { status: 'CONFIRMED', label: 'Confirmer', variant: 'primary' },
        { status: 'CANCELLED', label: 'Refuser', variant: 'danger' },
      ]
    case 'CONFIRMED':
      return [
        { status: 'COMPLETED', label: 'Marquer terminée', variant: 'primary' },
        { status: 'NO_SHOW', label: 'Absent', variant: 'neutral' },
        { status: 'CANCELLED', label: 'Annuler', variant: 'danger' },
      ]
    default:
      return []
  }
}

export function isMerchantBookingHistory(status: string): boolean {
  return ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status)
}

export function getStatusHint(status: string): string | null {
  switch (status) {
    case 'PENDING':
      return 'En attente de confirmation par l\'établissement.'
    case 'CONFIRMED':
      return 'Votre réservation est confirmée.'
    case 'CANCELLED':
      return 'Cette réservation a été annulée.'
    case 'COMPLETED':
      return 'Séjour ou rendez-vous terminé.'
    case 'NO_SHOW':
      return 'Marquée comme absence.'
    default:
      return null
  }
}
