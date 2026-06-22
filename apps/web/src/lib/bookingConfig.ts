export type BookingType = 'TABLE' | 'APPOINTMENT' | 'ROOM' | 'CONSULTATION' | 'VENUE'

export interface MerchantServiceConfig {
  id: string
  slug?: string
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
  max_guests?: number | null
  surface_sqm?: number | null
  service_kind?: string
  image_urls?: string[]
  bedrooms?: number | null
  bathrooms?: number | null
  beds?: number | null
  property_type?: string | null
  unit_type?: string | null
  amenities?: string[]
  highlights?: string[]
  staff_id?: string | null
  staff?: { id: string; name: string } | null
}

export interface BookingSettingsConfig {
  max_capacity: number
  slot_duration_min: number
  buffer_min: number
  booking_window_days: number
  auto_confirm: boolean
  require_payment?: boolean
  deposit_percent?: number
  cancellation_policy?: string | null
  no_show_policy?: string | null
}

export interface StaffMemberConfig {
  id: string
  name: string
  role?: string | null
  max_concurrent_slots?: number
  max_daily_bookings?: number | null
  service_ids?: string[]
}

export interface BookingConfig {
  enabled: boolean
  booking_type: BookingType | null
  label: string
  cta: string
  category_slug: string
  services: MerchantServiceConfig[]
  staff: StaffMemberConfig[]
  room_types: string[]
  room_services?: MerchantServiceConfig[]
  booking_settings?: BookingSettingsConfig
}

export function staffForService(staff: StaffMemberConfig[], serviceId: string): StaffMemberConfig[] {
  if (!serviceId) return staff
  return staff.filter(s => s.service_ids?.includes(serviceId))
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
