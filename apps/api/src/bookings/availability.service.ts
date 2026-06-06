import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BookingType } from '../../generated/prisma/client'
import { getCategoryBookingConfig } from '../common/booking-config'

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

  async getAvailableSlots(
    merchantId: string,
    dateStr: string,
    opts?: { serviceId?: string; staffId?: string; bookingType?: BookingType; excludeBookingId?: string },
  ): Promise<AvailabilityResponse> {
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
    if (!catConfig.enabled || !catConfig.type) {
      return { slots: [], closed: true, reason: 'Réservations non disponibles pour cette catégorie' }
    }

    const settings = merchant.booking_settings ?? await this.getSettings(merchantId)
    const bookingType = opts?.bookingType ?? catConfig.type

    const date = new Date(`${dateStr}T12:00:00`)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide')
    }

    const now = new Date()
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + settings.booking_window_days)
    if (date < new Date(now.toISOString().slice(0, 10))) {
      return { slots: [], closed: true, reason: 'Date passée' }
    }
    if (date > maxDate) {
      return { slots: [], closed: true, reason: `Réservation max ${settings.booking_window_days} jours à l'avance` }
    }

    const dayOfWeek = date.getDay()
    const hourRow = merchant.hours.find(h => h.day === dayOfWeek)
    if (!hourRow || hourRow.is_closed || !hourRow.open_time || !hourRow.close_time) {
      return { slots: [], closed: true, reason: 'Fermé ce jour' }
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

    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const existing = await this.prisma.booking.findMany({
      where: {
        merchant_id: merchantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        booked_at: { gte: dayStart, lt: dayEnd },
        ...(opts?.staffId ? { staff_id: opts.staffId } : {}),
        ...(opts?.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: { booked_at: true, check_out_at: true, party_size: true, booking_type: true, staff_id: true },
    })

    const slots: SlotResult[] = []
    for (let min = openMin; min + slotDuration <= closeMin; min += slotDuration) {
      const slotStart = new Date(`${dateStr}T${this.minutesToTime(min)}:00`)
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000)

      if (slotStart <= now) continue

      let available = true
      let remaining: number | undefined

      if (bookingType === 'TABLE') {
        const concurrent = existing.filter(b => {
          const bStart = b.booked_at
          const bEnd = new Date(bStart.getTime() + slotDuration * 60_000)
          return bStart < slotEnd && bEnd > slotStart
        })
        const used = concurrent.reduce((s, b) => s + b.party_size, 0)
        remaining = Math.max(0, settings.max_capacity - used)
        available = remaining > 0
      } else if (bookingType === 'ROOM') {
        available = !existing.some(b => {
          if (b.booking_type !== 'ROOM') return false
          const out = b.check_out_at ?? new Date(b.booked_at.getTime() + 24 * 60 * 60_000)
          return b.booked_at < slotEnd && out > slotStart
        })
        remaining = available ? 1 : 0
      } else {
        available = !existing.some(b => {
          const bEnd = new Date(b.booked_at.getTime() + slotDuration * 60_000)
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
    const dateStr = bookedAt.toISOString().slice(0, 10)
    const timeStr = bookedAt.toTimeString().slice(0, 5)
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

    if (opts.bookingType === 'ROOM' && opts.checkOutAt) {
      if (opts.checkOutAt <= bookedAt) {
        throw new BadRequestException('La date de départ doit être après l\'arrivée')
      }
      const overlap = await this.prisma.booking.count({
        where: {
          merchant_id: merchantId,
          booking_type: 'ROOM',
          status: { in: ['PENDING', 'CONFIRMED'] },
          ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
          booked_at: { lt: opts.checkOutAt },
          OR: [
            { check_out_at: { gt: bookedAt } },
            { check_out_at: null, booked_at: { gte: bookedAt } },
          ],
        },
      })
      if (overlap > 0) {
        throw new BadRequestException('Chambre indisponible pour ces dates')
      }
    }

    if (opts.bookingType === 'TABLE' && slot.remaining !== undefined && opts.partySize > slot.remaining) {
      throw new BadRequestException(`Places insuffisantes (${slot.remaining} restantes)`)
    }
  }
}
