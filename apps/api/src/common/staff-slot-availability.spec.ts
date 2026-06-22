import {
  countStaffDailyBookings,
  countStaffOverlappingBookings,
  pickStaffForSlot,
  staffRemainingInSlot,
  type BookingSlotRef,
  type StaffCapacityProfile,
} from './staff-slot-availability'

const staffA: StaffCapacityProfile = { id: 'a', max_concurrent_slots: 1, max_daily_bookings: null }
const staffB: StaffCapacityProfile = { id: 'b', max_concurrent_slots: 2, max_daily_bookings: null }

function at(iso: string): Date {
  return new Date(iso)
}

describe('staff-slot-availability', () => {
  const dayStart = at('2026-06-22T00:00:00')
  const dayEnd = at('2026-06-23T00:00:00')
  const slotStart = at('2026-06-22T10:00:00')
  const slotEnd = at('2026-06-22T11:00:00')
  const duration = 60

  it('compte les chevauchements par praticien', () => {
    const bookings: BookingSlotRef[] = [{
      booked_at: at('2026-06-22T10:00:00'),
      check_out_at: null,
      staff_id: 'a',
    }]
    expect(countStaffOverlappingBookings('a', bookings, slotStart, slotEnd, duration)).toBe(1)
    expect(countStaffOverlappingBookings('b', bookings, slotStart, slotEnd, duration)).toBe(0)
  })

  it('applique max_concurrent_slots', () => {
    const bookings: BookingSlotRef[] = [{
      booked_at: at('2026-06-22T10:00:00'),
      check_out_at: null,
      staff_id: 'b',
    }]
    expect(staffRemainingInSlot(staffB, bookings, slotStart, slotEnd, duration, dayStart, dayEnd)).toBe(1)
    bookings.push({
      booked_at: at('2026-06-22T10:15:00'),
      check_out_at: null,
      staff_id: 'b',
    })
    expect(staffRemainingInSlot(staffB, bookings, slotStart, slotEnd, duration, dayStart, dayEnd)).toBe(0)
  })

  it('applique max_daily_bookings', () => {
    const capped: StaffCapacityProfile = { id: 'c', max_concurrent_slots: 3, max_daily_bookings: 1 }
    const bookings: BookingSlotRef[] = [{
      booked_at: at('2026-06-22T08:00:00'),
      check_out_at: null,
      staff_id: 'c',
    }]
    expect(countStaffDailyBookings('c', bookings, dayStart, dayEnd)).toBe(1)
    expect(staffRemainingInSlot(capped, bookings, slotStart, slotEnd, duration, dayStart, dayEnd)).toBe(0)
  })

  it('choisit le praticien avec le plus de marge', () => {
    const bookings: BookingSlotRef[] = [{
      booked_at: at('2026-06-22T10:00:00'),
      check_out_at: null,
      staff_id: 'a',
    }]
    const picked = pickStaffForSlot(
      [staffA, staffB],
      bookings,
      slotStart,
      slotEnd,
      duration,
      dayStart,
      dayEnd,
    )
    expect(picked).toBe('b')
  })
})
