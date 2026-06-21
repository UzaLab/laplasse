import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BookingType } from '../../generated/prisma/client'
import { getCategoryBookingConfig } from '../common/booking-config'
import { formatLocalDate, formatLocalTime } from '../common/date-local'

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

  /** Disponibilité d'une nuit (hôtel / résidence) — indépendante des horaires d'ouverture. */
  async getRoomNightAvailability(
    merchantId: string,
    dateStr: string,
    opts?: { serviceId?: string; excludeBookingId?: string },
  ): Promise<{ available: boolean; remaining: number; closed: boolean; reason?: string }> {
    const { settings } = await this.loadMerchantContext(merchantId)
    const dateCheck = this.validateBookingDate(dateStr, settings.booking_window_days)
    if (dateCheck.closed) {
      return { available: false, remaining: 0, closed: true, reason: dateCheck.reason }
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

    const blocked = blocks.some(b => {
      if (b.staff_id) return false
      if (b.service_id && opts?.serviceId && b.service_id !== opts.serviceId) return false
      if (b.service_id && !opts?.serviceId) return false
      if (!b.all_day) return false
      return !b.service_id || b.service_id === opts?.serviceId
    })
    if (blocked) {
      return { available: false, remaining: 0, closed: true, reason: 'Indisponible ce jour' }
    }

    let roomCapacity = 1
    if (opts?.serviceId) {
      const roomService = await this.prisma.merchantService.findFirst({
        where: { id: opts.serviceId, merchant_id: merchantId, is_active: true, service_kind: 'ROOM_TYPE' },
      })
      if (roomService?.capacity) roomCapacity = roomService.capacity
    }

    const overlap = await this.prisma.booking.count({
      where: {
        merchant_id: merchantId,
        booking_type: 'ROOM',
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(opts?.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
        ...(opts?.serviceId ? { service_id: opts.serviceId } : {}),
        booked_at: { lt: dayEnd },
        OR: [
          { check_out_at: { gt: dayStart } },
          { check_out_at: null, booked_at: { gte: dayStart, lt: dayEnd } },
        ],
      },
    })

    const remaining = Math.max(0, roomCapacity - overlap)
    return { available: remaining > 0, remaining, closed: false }
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
    if (opts?.serviceId) {
      const service = await this.prisma.merchantService.findFirst({
        where: { id: opts.serviceId, merchant_id: merchantId, is_active: true },
      })
      if (service) slotDuration = service.duration_min + settings.buffer_min
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
        ...(opts?.staffId ? { staff_id: opts.staffId } : {}),
        ...(opts?.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: { booked_at: true, check_out_at: true, party_size: true, booking_type: true, staff_id: true, service_id: true },
    })

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
      } else {
        available = !existing.some(b => {
          if (b.booking_type === 'ROOM') return false
          const bEnd = b.check_out_at ?? new Date(b.booked_at.getTime() + slotDuration * 60_000)
          return b.booked_at < slotEnd && bEnd > slotStart
        })
        remaining = available ? 1 : 0
      }

      slots.push({
        time: this.minutesToTime(min),
        available,
        remaining,
      })
    }

    return { slots, closed: false }
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
      if (opts.checkOutAt <= bookedAt) {
        throw new BadRequestException('La date de départ doit être après l\'arrivée')
      }

      const cursor = new Date(bookedAt)
      cursor.setHours(0, 0, 0, 0)
      const end = new Date(opts.checkOutAt)
      end.setHours(0, 0, 0, 0)

      while (cursor < end) {
        const dateStr = formatLocalDate(cursor)
        const night = await this.getRoomNightAvailability(merchantId, dateStr, {
          serviceId: opts.serviceId,
          excludeBookingId: opts.excludeBookingId,
        })
        if (night.closed || !night.available) {
          throw new BadRequestException(
            night.reason ?? `Chambre indisponible la nuit du ${dateStr}`,
          )
        }
        cursor.setDate(cursor.getDate() + 1)
      }
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
