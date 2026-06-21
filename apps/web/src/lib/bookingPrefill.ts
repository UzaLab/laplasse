/** Pré-remplissage formulaire #reservation depuis onglets chambres / prestations */

export type BookingPrefillDetail = {
  serviceId?: string
  roomType?: string
  checkIn?: string
  checkOut?: string
}

export const BOOKING_PREFILL_EVENT = 'laplasse:booking-prefill'

export function dispatchBookingPrefill(detail: BookingPrefillDetail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BOOKING_PREFILL_EVENT, { detail }))
}

export function scrollToReservation() {
  document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function openBookingWithPrefill(detail: BookingPrefillDetail) {
  dispatchBookingPrefill(detail)
  scrollToReservation()
}
