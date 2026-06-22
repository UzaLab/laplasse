/** Charge praticien — chevauchements et plafond journalier */

export interface StaffCapacityProfile {
  id: string
  max_concurrent_slots: number
  max_daily_bookings: number | null
}

export interface BookingSlotRef {
  booked_at: Date
  check_out_at: Date | null
  staff_id: string | null
}

export function bookingEndAt(
  booking: BookingSlotRef,
  slotDurationMin: number,
): Date {
  return booking.check_out_at
    ?? new Date(booking.booked_at.getTime() + slotDurationMin * 60_000)
}

export function bookingOverlapsWindow(
  booking: BookingSlotRef,
  windowStart: Date,
  windowEnd: Date,
  slotDurationMin: number,
): boolean {
  const end = bookingEndAt(booking, slotDurationMin)
  return booking.booked_at < windowEnd && end > windowStart
}

export function countStaffOverlappingBookings(
  staffId: string,
  bookings: BookingSlotRef[],
  windowStart: Date,
  windowEnd: Date,
  slotDurationMin: number,
): number {
  return bookings.filter(
    b => b.staff_id === staffId
      && bookingOverlapsWindow(b, windowStart, windowEnd, slotDurationMin),
  ).length
}

export function countStaffDailyBookings(
  staffId: string,
  bookings: BookingSlotRef[],
  dayStart: Date,
  dayEnd: Date,
): number {
  return bookings.filter(
    b => b.staff_id === staffId
      && b.booked_at >= dayStart
      && b.booked_at < dayEnd,
  ).length
}

/** Créneaux simultanés encore disponibles pour un praticien sur une plage horaire. */
export function staffRemainingInSlot(
  staff: StaffCapacityProfile,
  bookings: BookingSlotRef[],
  windowStart: Date,
  windowEnd: Date,
  slotDurationMin: number,
  dayStart: Date,
  dayEnd: Date,
): number {
  if (staff.max_daily_bookings != null) {
    const daily = countStaffDailyBookings(staff.id, bookings, dayStart, dayEnd)
    if (daily >= staff.max_daily_bookings) return 0
  }
  const concurrent = countStaffOverlappingBookings(
    staff.id,
    bookings,
    windowStart,
    windowEnd,
    slotDurationMin,
  )
  return Math.max(0, staff.max_concurrent_slots - concurrent)
}

export function staffCanTakeSlot(
  staff: StaffCapacityProfile,
  bookings: BookingSlotRef[],
  windowStart: Date,
  windowEnd: Date,
  slotDurationMin: number,
  dayStart: Date,
  dayEnd: Date,
): boolean {
  return staffRemainingInSlot(
    staff,
    bookings,
    windowStart,
    windowEnd,
    slotDurationMin,
    dayStart,
    dayEnd,
  ) > 0
}

/** Choisit le praticien le moins chargé pouvant prendre le créneau. */
export function pickStaffForSlot(
  candidates: StaffCapacityProfile[],
  bookings: BookingSlotRef[],
  windowStart: Date,
  windowEnd: Date,
  slotDurationMin: number,
  dayStart: Date,
  dayEnd: Date,
): string | null {
  let best: { id: string; remaining: number } | null = null
  for (const staff of candidates) {
    const remaining = staffRemainingInSlot(
      staff,
      bookings,
      windowStart,
      windowEnd,
      slotDurationMin,
      dayStart,
      dayEnd,
    )
    if (remaining <= 0) continue
    if (!best || remaining > best.remaining) {
      best = { id: staff.id, remaining }
    }
  }
  return best?.id ?? null
}
