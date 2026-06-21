export type BookingType = 'TABLE' | 'APPOINTMENT' | 'ROOM' | 'CONSULTATION' | 'VENUE'

export interface MerchantServiceConfig {
  id: string
  name: string
  duration_min: number
  price: number | null
  nightly_rate?: number | null
  weekend_nightly_rate?: number | null
  peak_nightly_rate?: number | null
  peak_months?: unknown
  min_stay_nights?: number | null
  description?: string | null
  capacity?: number | null
  service_kind?: string
  image_urls?: string[]
  bedrooms?: number | null
  bathrooms?: number | null
  beds?: number | null
  property_type?: string | null
  unit_type?: string | null
  amenities?: string[]
  highlights?: string[]
}

export interface BookingSettingsConfig {
  max_capacity: number
  slot_duration_min: number
  buffer_min: number
  booking_window_days: number
  auto_confirm: boolean
}

export interface BookingConfig {
  enabled: boolean
  booking_type: BookingType | null
  label: string
  cta: string
  category_slug: string
  services: MerchantServiceConfig[]
  staff: Array<{ id: string; name: string; role: string | null }>
  room_types: string[]
  room_services?: MerchantServiceConfig[]
  booking_settings?: BookingSettingsConfig
}

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  TABLE: 'Table',
  APPOINTMENT: 'Rendez-vous',
  ROOM: 'Chambre',
  CONSULTATION: 'Consultation',
  VENUE: 'Événement',
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return ''
  return `${price.toLocaleString('fr-FR')} F`
}
