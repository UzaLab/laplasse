import {
  bookingMatchesRoomService,
  bookingOccupiesNight,
  listStayNights,
  resolveRoomStockCapacity,
} from './room-night-availability'

describe('bookingOccupiesNight', () => {
  it('occupe les nuits entre arrivée et départ (départ exclusif)', () => {
    const checkIn = new Date('2026-06-10T14:00:00')
    const checkOut = new Date('2026-06-13T11:00:00')

    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-09')).toBe(false)
    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-10')).toBe(true)
    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-11')).toBe(true)
    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-12')).toBe(true)
    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-13')).toBe(false)
  })

  it('libère le jour de départ pour un nouveau check-in (turnover)', () => {
    const checkIn = new Date('2026-06-10T14:00:00')
    const checkOut = new Date('2026-06-12T11:00:00')
    expect(bookingOccupiesNight(checkIn, checkOut, '2026-06-12')).toBe(false)
  })

  it('sans check-out = une seule nuit', () => {
    const checkIn = new Date('2026-06-10T14:00:00')
    expect(bookingOccupiesNight(checkIn, null, '2026-06-10')).toBe(true)
    expect(bookingOccupiesNight(checkIn, null, '2026-06-11')).toBe(false)
  })
})

describe('listStayNights', () => {
  it('aligne les nuits facturées avec le modèle Airbnb', () => {
    expect(
      listStayNights(
        new Date('2026-06-10T14:00:00'),
        new Date('2026-06-13T11:00:00'),
      ),
    ).toEqual(['2026-06-10', '2026-06-11', '2026-06-12'])
  })
})

describe('bookingMatchesRoomService', () => {
  it('match par service_id ou legacy room_type', () => {
    expect(
      bookingMatchesRoomService(
        { service_id: 'svc-1', room_type: null },
        'svc-1',
        'Deluxe',
      ),
    ).toBe(true)
    expect(
      bookingMatchesRoomService(
        { service_id: null, room_type: 'Chambre Deluxe Lagune' },
        'svc-1',
        'Deluxe Lagune',
      ),
    ).toBe(true)
    expect(
      bookingMatchesRoomService(
        { service_id: 'svc-2', room_type: 'Suite' },
        'svc-1',
        'Deluxe',
      ),
    ).toBe(false)
  })
})

describe('resolveRoomStockCapacity', () => {
  it('défaut à 1 si stock absent', () => {
    expect(resolveRoomStockCapacity(null)).toBe(1)
    expect(resolveRoomStockCapacity(5)).toBe(5)
  })
})
