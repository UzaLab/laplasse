export type BookingType = 'TABLE' | 'APPOINTMENT' | 'ROOM' | 'CONSULTATION' | 'VENUE'

export interface BookingConfig {
  enabled: boolean
  booking_type: BookingType | null
  label: string
  cta: string
  category_slug: string
  services: Array<{ id: string; name: string; duration_min: number; price: number | null }>
  staff: Array<{ id: string; name: string; role: string | null }>
  room_types: string[]
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  TABLE: 'Table',
  APPOINTMENT: 'Rendez-vous',
  ROOM: 'Chambre',
  CONSULTATION: 'Consultation',
  VENUE: 'Événement',
}
