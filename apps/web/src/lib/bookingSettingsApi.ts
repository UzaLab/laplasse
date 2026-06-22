/** Champs acceptés par PATCH /merchants/me/booking-settings (UpdateBookingSettingsDto). */
export interface BookingSettingsPayload {
  max_capacity?: number
  slot_duration_min?: number
  buffer_min?: number
  booking_window_days?: number
  auto_confirm?: boolean
  cancellation_policy?: string | null
  no_show_policy?: string | null
  require_payment?: boolean
  deposit_percent?: number
}

export type MerchantBookingSettings = BookingSettingsPayload & {
  merchant_id?: string
}

/** Exclut merchant_id et champs read-only — requis car l'API rejette les propriétés inconnues. */
export function toBookingSettingsPatch(
  settings: MerchantBookingSettings,
): BookingSettingsPayload {
  return {
    max_capacity: settings.max_capacity,
    slot_duration_min: settings.slot_duration_min,
    buffer_min: settings.buffer_min,
    booking_window_days: settings.booking_window_days,
    auto_confirm: settings.auto_confirm,
    cancellation_policy: settings.cancellation_policy ?? undefined,
    no_show_policy: settings.no_show_policy ?? undefined,
    require_payment: settings.require_payment,
    deposit_percent: settings.deposit_percent,
  }
}
