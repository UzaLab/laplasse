import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BookingType, Prisma } from '../../generated/prisma/client'
import { getCategoryBookingConfig } from '../common/booking-config'
import { formatLocalDate, formatLocalTime } from '../common/date-local'
import {
  pickStaffForSlot,
  staffRemainingInSlot,
  type StaffCapacityProfile,
  type BookingSlotRef,
} from '../common/staff-slot-availability'
import {
  bookingMatchesRoomService,
  bookingOccupiesNight,
  listStayNights,
  resolveRoomStockCapacity,
} from '../common/room-night-availability'

export interface SlotResult {
  time: string
  available: boolean
  remaining?: number
}

export interface AvailabilityResponse {
  slots: SlotResult[]
  closed: boolean
  reason?: string
}

type Db = PrismaService | Prisma.TransactionClient

interface RoomServiceRef {
  id: string
  name: string
  capacity: number | null
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m ?? 0)
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  async getSettings(merchantId: string) {
    return this.prisma.merchantBookingSettings.upsert({
      where: { merchant_id: merchantId },
      create: { merchant_id: merchantId },
      update: {},
    })
  }

  private async loadMerchantContext(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        category: { select: { slug: true } },
        hours: true,
        booking_settings: true,
      },
    })
    if (!merchant) throw new BadRequestException('Établissement introuvable')
    const catConfig = getCategoryBookingConfig(merchant.category.slug)
    const settings = merchant.booking_settings ?? await this.getSettings(merchantId)
    return { merchant, catConfig, settings }
  }

  private validateBookingDate(dateStr: string, bookingWindowDays: number) {
    const date = new Date(`${dateStr}T12:00:00`)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide')
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + bookingWindowDays)
    if (date < today) {
      return { closed: true as const, reason: 'Date passée' }
    }
    if (date > maxDate) {
      return { closed: true as const, reason: `Réservation max ${bookingWindowDays} jours à l'avance` }
    }
    return { closed: false as const, date }
  }

  /** Disponibilité d'une nuit (hôtel / résidence) — modèle Airbnb (départ exclusif). */
  async getRoomNightAvailability(
    merchantId: string,
    dateStr: string,
    opts?: { serviceId?: string; excludeBookingId?: string },
    db: Db = this.prisma,
  ): Promise<{ available: boolean; remaining: number; closed: boolean; reason?: string }> {
    const { settings } = await this.loadMerchantContext(merchantId)
    const dateCheck = this.validateBookingDate(dateStr, settings.booking_window_days)
    if (dateCheck.closed) {
      return { available: false, remaining: 0, closed: true, reason: dateCheck.reason }
    }

    if (!opts?.serviceId) {
      return {
        available: false,
        remaining: 0,
        closed: true,
        reason: 'Type de chambre non spécifié',
      }
    }

    const roomService = await this.loadRoomService(merchantId, opts.serviceId, db)
    if (!roomService) {
      return { available: false, remaining: 0, closed: true, reason: 'Chambre introuvable' }
    }

    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const blocks = await db.merchantAvailabilityBlock.findMany({
      where: {
        merchant_id: merchantId,
        starts_at: { lt: dayEnd },
        ends_at: { gt: dayStart },
      },
    })

    const blocked = blocks.some(b => {
      if (b.staff_id) return false
      if (b.service_id && b.service_id !== opts.serviceId) return false
      if (!b.all_day) return false
      return !b.service_id || b.service_id === opts.serviceId
    })
    if (blocked) {
      return { available: false, remaining: 0, closed: true, reason: 'Indisponible ce jour' }
    }

    const roomCapacity = resolveRoomStockCapacity(roomService.capacity)
    const overlap = await this.countRoomNightOverlap(
      merchantId,
      dateStr,
      roomService,
      opts.excludeBookingId,
      db,
    )

    const remaining = Math.max(0, roomCapacity - overlap)
    return { available: remaining > 0, remaining, closed: false }
  }

  private async loadRoomService(
    merchantId: string,
    serviceId: string,
    db: Db,
  ): Promise<RoomServiceRef | null> {
    return db.merchantService.findFirst({
      where: {
        id: serviceId,
        merchant_id: merchantId,
        is_active: true,
        service_kind: 'ROOM_TYPE',
      },
      select: { id: true, name: true, capacity: true },
    })
  }

  /** Compte les réservations actives occupant la nuit (service_id ou legacy room_type). */
  private async countRoomNightOverlap(
    merchantId: string,
    nightDateStr: string,
    roomService: RoomServiceRef,
    excludeBookingId?: string,
    db: Db = this.prisma,
  ): Promise<number> {
    const dayStart = new Date(`${nightDateStr}T00:00:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const candidates = await db.booking.findMany({
      where: {
        merchant_id: merchantId,
        booking_type: 'ROOM',
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        booked_at: { lt: dayEnd },
        OR: [
          { check_out_at: { gt: dayStart } },
          { check_out_at: null },
        ],
      },
      select: {
        service_id: true,
        room_type: true,
        booked_at: true,
        check_out_at: true,
      },
    })

    return candidates.filter(
      b =>
        bookingMatchesRoomService(b, roomService.id, roomService.name)
        && bookingOccupiesNight(b.booked_at, b.check_out_at, nightDateStr),
    ).length
  }

  /**
   * Vérifie la disponibilité de tout un séjour chambre (appelé dans une transaction Serializable).
   */
  async assertRoomStayAvailable(
    merchantId: string,
    checkIn: Date,
    checkOut: Date,
    opts: { serviceId: string; excludeBookingId?: string },
    db: Db = this.prisma,
  ): Promise<void> {
    if (checkOut <= checkIn) {
      throw new BadRequestException('La date de départ doit être après l\'arrivée')
    }

    const roomService = await this.loadRoomService(merchantId, opts.serviceId, db)
    if (!roomService) {
      throw new BadRequestException('Chambre introuvable ou inactive')
    }

    const nights = listStayNights(checkIn, checkOut)
    for (const nightDateStr of nights) {
      const night = await this.getRoomNightAvailability(
        merchantId,
        nightDateStr,
        { serviceId: opts.serviceId, excludeBookingId: opts.excludeBookingId },
        db,
      )
      if (night.closed || !night.available) {
        throw new BadRequestException(
          night.reason
            ?? `Plus de disponibilité pour « ${roomService.name} » la nuit du ${nightDateStr.split('-').reverse().join('/')}`,
        )
      }
    }
  }

  async getAvailableSlots(
    merchantId: string,
    dateStr: string,
    opts?: { serviceId?: string; staffId?: string; bookingType?: BookingType; excludeBookingId?: string },
  ): Promise<AvailabilityResponse> {
    const { merchant, catConfig, settings } = await this.loadMerchantContext(merchantId)
    if (!catConfig.enabled || !catConfig.type) {
      return { slots: [], closed: true, reason: 'Réservations non disponibles pour cette catégorie' }
    }

    const bookingType = opts?.bookingType ?? catConfig.type

    if (bookingType === 'ROOM') {
      const night = await this.getRoomNightAvailability(merchantId, dateStr, {
        serviceId: opts?.serviceId,
        excludeBookingId: opts?.excludeBookingId,
      })
      return {
        closed: night.closed,
        reason: night.reason,
        slots: [{ time: '14:00', available: night.available, remaining: night.remaining }],
      }
    }

    const dateCheck = this.validateBookingDate(dateStr, settings.booking_window_days)
    if (dateCheck.closed) {
      return { slots: [], closed: true, reason: dateCheck.reason }
    }

    const dayOfWeek = dateCheck.date.getDay()
    const hourRow = merchant.hours.find(h => h.day === dayOfWeek)
    if (!hourRow || hourRow.is_closed || !hourRow.open_time || !hourRow.close_time) {
      return { slots: [], closed: true, reason: 'Fermé ce jour — horaires non renseignés' }
    }

    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const blocks = await this.prisma.merchantAvailabilityBlock.findMany({
      where: {
        merchant_id: merchantId,
        starts_at: { lt: dayEnd },
        ends_at: { gt: dayStart },
      },
    })

    const merchantWideAllDay = blocks.some(
      b => b.all_day && !b.staff_id && !b.service_id
        && b.starts_at <= dayStart && b.ends_at >= dayEnd,
    )
    if (merchantWideAllDay) {
      return { slots: [], closed: true, reason: 'Journée indisponible' }
    }

    let slotDuration = settings.slot_duration_min
    let serviceCapacity = 1
    if (opts?.serviceId) {
      const service = await this.prisma.merchantService.findFirst({
        where: { id: opts.serviceId, merchant_id: merchantId, is_active: true },
      })
      if (service) {
        slotDuration = service.duration_min + settings.buffer_min
        serviceCapacity = Math.max(1, service.capacity ?? 1)
      }
    }

    const openMin = this.parseTimeToMinutes(hourRow.open_time)
    let closeMin = this.parseTimeToMinutes(hourRow.close_time)
    if (closeMin <= openMin) closeMin += 24 * 60

    const existing = await this.prisma.booking.findMany({
      where: {
        merchant_id: merchantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        booked_at: { lt: dayEnd },
        OR: [
          { check_out_at: { gt: dayStart } },
          { check_out_at: null, booked_at: { gte: dayStart } },
        ],
        ...(opts?.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: {
        booked_at: true,
        check_out_at: true,
        party_size: true,
        booking_type: true,
        staff_id: true,
        service_id: true,
      },
    })

    const bookingRefs: BookingSlotRef[] = existing

    let eligibleStaff: StaffCapacityProfile[] = []
    if (bookingType !== 'TABLE' && opts?.serviceId) {
      const links = await this.prisma.merchantStaffService.findMany({
        where: {
          service_id: opts.serviceId,
          staff: { merchant_id: merchantId, is_active: true },
        },
        include: { staff: true },
      })
      eligibleStaff = links.map(l => ({
        id: l.staff.id,
        max_concurrent_slots: Math.max(1, l.staff.max_concurrent_slots),
        max_daily_bookings: l.staff.max_daily_bookings,
      }))
    }

    if (opts?.staffId && eligibleStaff.length > 0) {
      eligibleStaff = eligibleStaff.filter(s => s.id === opts.staffId)
    } else if (opts?.staffId && eligibleStaff.length === 0) {
      const staffRow = await this.prisma.merchantStaff.findFirst({
        where: { id: opts.staffId, merchant_id: merchantId, is_active: true },
      })
      if (staffRow) {
        eligibleStaff = [{
          id: staffRow.id,
          max_concurrent_slots: Math.max(1, staffRow.max_concurrent_slots),
          max_daily_bookings: staffRow.max_daily_bookings,
        }]
      }
    }

    const isBlocked = (slotStart: Date, slotEnd: Date) => {
      for (const b of blocks) {
        if (b.staff_id && opts?.staffId && b.staff_id !== opts.staffId) continue
        if (b.staff_id && !opts?.staffId) continue
        if (b.service_id && opts?.serviceId && b.service_id !== opts.serviceId) continue
        if (b.service_id && !opts?.serviceId) continue
        if (b.all_day && !b.staff_id && !b.service_id) {
          if (b.starts_at <= dayStart && b.ends_at >= dayEnd) return true
          continue
        }
        if (b.starts_at < slotEnd && b.ends_at > slotStart) return true
      }
      return false
    }

    const now = new Date()
    const slots: SlotResult[] = []
    for (let min = openMin; min + slotDuration <= closeMin; min += slotDuration) {
      const slotStart = new Date(`${dateStr}T${this.minutesToTime(min)}:00`)
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000)

      if (slotStart <= now) continue
      if (isBlocked(slotStart, slotEnd)) {
        slots.push({ time: this.minutesToTime(min), available: false, remaining: 0 })
        continue
      }

      let available = true
      let remaining: number | undefined

      if (bookingType === 'TABLE') {
        const concurrent = existing.filter(b => {
          if (b.booking_type !== 'TABLE') return false
          const bStart = b.booked_at
          const bEnd = b.check_out_at ?? new Date(bStart.getTime() + slotDuration * 60_000)
          return bStart < slotEnd && bEnd > slotStart
        })
        const used = concurrent.reduce((s, b) => s + b.party_size, 0)
        remaining = Math.max(0, settings.max_capacity - used)
        available = remaining > 0
      } else if (eligibleStaff.length > 0) {
        if (opts?.staffId) {
          const staff = eligibleStaff[0]
          remaining = staffRemainingInSlot(
            staff,
            bookingRefs,
            slotStart,
            slotEnd,
            slotDuration,
            dayStart,
            dayEnd,
          )
          available = remaining > 0
        } else {
          remaining = eligibleStaff.reduce(
            (sum, staff) => sum + staffRemainingInSlot(
              staff,
              bookingRefs,
              slotStart,
              slotEnd,
              slotDuration,
              dayStart,
              dayEnd,
            ),
            0,
          )
          available = remaining > 0
        }
      } else {
        const parallelCapacity = opts?.staffId ? 1 : serviceCapacity
        const concurrent = existing.filter(b => {
          if (b.booking_type === 'ROOM') return false
          if (opts?.staffId && b.staff_id !== opts.staffId) return false
          if (opts?.serviceId && b.service_id && b.service_id !== opts.serviceId) return false
          const bEnd = b.check_out_at ?? new Date(b.booked_at.getTime() + slotDuration * 60_000)
          return b.booked_at < slotEnd && bEnd > slotStart
        })
        remaining = Math.max(0, parallelCapacity - concurrent.length)
        available = remaining > 0
      }

      slots.push({
        time: this.minutesToTime(min),
        available,
        remaining,
      })
    }

    return { slots, closed: false }
  }

  /** Attribue automatiquement le praticien le moins chargé pour un créneau. */
  async resolveStaffForBooking(
    merchantId: string,
    serviceId: string,
    bookedAt: Date,
    preferredStaffId?: string | null,
    excludeBookingId?: string,
  ): Promise<string | null> {
    const { settings } = await this.loadMerchantContext(merchantId)
    const service = await this.prisma.merchantService.findFirst({
      where: { id: serviceId, merchant_id: merchantId, is_active: true },
    })
    if (!service) return null

    const slotDuration = service.duration_min + settings.buffer_min
    const dateStr = formatLocalDate(bookedAt)
    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const slotStart = bookedAt
    const slotEnd = new Date(bookedAt.getTime() + slotDuration * 60_000)

    const links = await this.prisma.merchantStaffService.findMany({
      where: {
        service_id: serviceId,
        staff: { merchant_id: merchantId, is_active: true },
      },
      include: { staff: true },
    })

    let eligible: StaffCapacityProfile[] = links.map(l => ({
      id: l.staff.id,
      max_concurrent_slots: Math.max(1, l.staff.max_concurrent_slots),
      max_daily_bookings: l.staff.max_daily_bookings,
    }))

    if (preferredStaffId) {
      eligible = eligible.filter(s => s.id === preferredStaffId)
      if (eligible.length === 0) {
        const row = await this.prisma.merchantStaff.findFirst({
          where: { id: preferredStaffId, merchant_id: merchantId, is_active: true },
        })
        if (row) {
          eligible = [{
            id: row.id,
            max_concurrent_slots: Math.max(1, row.max_concurrent_slots),
            max_daily_bookings: row.max_daily_bookings,
          }]
        }
      }
    }

    if (eligible.length === 0) return preferredStaffId ?? null

    const bookings = await this.prisma.booking.findMany({
      where: {
        merchant_id: merchantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        booked_at: { lt: dayEnd },
        OR: [
          { check_out_at: { gt: dayStart } },
          { check_out_at: null, booked_at: { gte: dayStart } },
        ],
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { booked_at: true, check_out_at: true, staff_id: true },
    })

    if (preferredStaffId) {
      const staff = eligible.find(s => s.id === preferredStaffId)
      if (staff && staffRemainingInSlot(
        staff, bookings, slotStart, slotEnd, slotDuration, dayStart, dayEnd,
      ) > 0) {
        return preferredStaffId
      }
      return null
    }

    return pickStaffForSlot(
      eligible,
      bookings,
      slotStart,
      slotEnd,
      slotDuration,
      dayStart,
      dayEnd,
    )
  }

  async assertSlotAvailable(
    merchantId: string,
    bookedAt: Date,
    opts: {
      bookingType: BookingType
      partySize: number
      checkOutAt?: Date
      serviceId?: string
      staffId?: string
      excludeBookingId?: string
    },
  ) {
    if (opts.bookingType === 'ROOM') {
      if (!opts.checkOutAt) {
        throw new BadRequestException('Veuillez indiquer la date de départ')
      }
      if (!opts.serviceId) {
        throw new BadRequestException('Veuillez sélectionner une chambre')
      }
      await this.assertRoomStayAvailable(
        merchantId,
        bookedAt,
        opts.checkOutAt,
        { serviceId: opts.serviceId, excludeBookingId: opts.excludeBookingId },
      )
      return
    }

    const dateStr = formatLocalDate(bookedAt)
    const timeStr = formatLocalTime(bookedAt)
    const { slots, closed, reason } = await this.getAvailableSlots(merchantId, dateStr, {
      serviceId: opts.serviceId,
      staffId: opts.staffId,
      bookingType: opts.bookingType,
      excludeBookingId: opts.excludeBookingId,
    })

    if (closed) {
      throw new BadRequestException(reason ?? 'Créneau indisponible')
    }

    const slot = slots.find(s => s.time === timeStr)
    if (!slot?.available) {
      throw new BadRequestException('Ce créneau n\'est plus disponible')
    }

    if (opts.bookingType === 'TABLE' && slot.remaining !== undefined && opts.partySize > slot.remaining) {
      throw new BadRequestException(`Places insuffisantes (${slot.remaining} restantes)`)
    }
  }
}
