import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { getPlanLimits } from '../common/plan-limits'
import { getCategoryBookingConfig } from '../common/booking-config'
import { formatLocalDate } from '../common/date-local'
import { assertMinStay, getNightlyRateForDate } from '../common/room-pricing'
import { AvailabilityService } from './availability.service'
import { FraudService } from '../fraud/fraud.service'
import { AuditService } from '../audit/audit.service'
import { CreateBookingDto, UpdateBookingStatusDto, UpdateMyBookingDto } from './dto/booking.dto'
import { phoneMatchTail } from '../common/phone-match'
import { BookingStatus, BookingType } from '../../generated/prisma/client'
import {
  computeBookingBaseAmount,
  computeDepositAmount,
  generatePaymentReference,
} from './booking-payment.util'

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly availability: AvailabilityService,
    private readonly fraud: FraudService,
    private readonly audit: AuditService,
  ) {}

  private readonly roomServiceSelect = {
    id: true,
    name: true,
    price: true,
    nightly_rate: true,
    weekend_nightly_rate: true,
    peak_nightly_rate: true,
    peak_months: true,
    min_stay_nights: true,
    duration_min: true,
    merchant_id: true,
  } as const

  private async enrichRoomBookings<
    T extends {
      booking_type: BookingType
      merchant_id: string
      room_type: string | null
      service: Record<string, unknown> | null
    },
  >(bookings: T[]): Promise<T[]> {
    const missing = bookings.filter(
      b => b.booking_type === 'ROOM' && !b.service && b.room_type?.trim(),
    )
    if (!missing.length) return bookings

    const merchantIds = [...new Set(missing.map(b => b.merchant_id))]
    const services = await this.prisma.merchantService.findMany({
      where: {
        merchant_id: { in: merchantIds },
        service_kind: 'ROOM_TYPE',
        is_active: true,
      },
      select: this.roomServiceSelect,
    })

    const byKey = new Map<string, (typeof services)[number]>()
    for (const service of services) {
      byKey.set(`${service.merchant_id}:${service.name.trim().toLowerCase()}`, service)
    }

    return bookings.map(booking => {
      if (booking.booking_type !== 'ROOM' || booking.service || !booking.room_type?.trim()) {
        return booking
      }

      const normalized = booking.room_type.trim().toLowerCase()
      const key = `${booking.merchant_id}:${normalized}`
      const matched =
        byKey.get(key)
        ?? services.find(
          s =>
            s.merchant_id === booking.merchant_id
            && (
              s.name.trim().toLowerCase().includes(normalized)
              || normalized.includes(s.name.trim().toLowerCase())
            ),
        )

      if (!matched) return booking

      const { merchant_id: _merchantId, ...service } = matched
      return { ...booking, service }
    })
  }

  private async resolveMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  async getMerchantConfig(merchantId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, is_active: true },
      include: {
        category: { select: { slug: true, name: true } },
        services: { where: { is_active: true }, orderBy: { name: 'asc' } },
        staff: { where: { is_active: true }, orderBy: { name: 'asc' } },
      },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    const limits = getPlanLimits(merchant.subscription_plan)
    const catConfig = getCategoryBookingConfig(merchant.category.slug)
    const enabled = limits.booking && catConfig.enabled && !!catConfig.type

    const settings = await this.prisma.merchantBookingSettings.upsert({
      where: { merchant_id: merchantId },
      create: { merchant_id: merchantId },
      update: {},
    })

    const roomServices = merchant.services.filter(s => s.service_kind === 'ROOM_TYPE')
    const roomTypes = roomServices.length
      ? roomServices.map(s => s.name)
      : ['Single', 'Double', 'Suite', 'Family']

    return {
      enabled,
      booking_type: catConfig.type,
      label: catConfig.label,
      cta: catConfig.cta,
      category_slug: merchant.category.slug,
      services: merchant.services,
      staff: merchant.staff,
      room_types: roomTypes,
      room_services: roomServices,
      booking_settings: settings,
    }
  }

  async getAvailability(
    merchantId: string,
    date: string,
    serviceId?: string,
    staffId?: string,
    excludeBookingId?: string,
  ) {
    const config = await this.getMerchantConfig(merchantId)
    if (!config.enabled || !config.booking_type) {
      return { slots: [], closed: true, reason: 'Réservations non activées' }
    }
    return this.availability.getAvailableSlots(merchantId, date, {
      serviceId,
      staffId,
      bookingType: config.booking_type,
      excludeBookingId,
    })
  }

  async getRoomCalendar(
    merchantId: string,
    from: string,
    to: string,
    serviceId?: string,
  ) {
    const config = await this.getMerchantConfig(merchantId)
    if (config.booking_type !== 'ROOM') {
      return { days: [], message: 'Calendrier chambres non disponible pour cet établissement' }
    }

    const roomService = serviceId
      ? config.room_services.find(s => s.id === serviceId)
      : config.room_services[0]

    const start = new Date(`${from}T12:00:00`)
    const end = new Date(`${to}T12:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      throw new BadRequestException('Plage de dates invalide')
    }

    const days: Array<{
      date: string
      available: boolean
      nightly_rate: number | null
      room_type: string | null
    }> = []

    for (let cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
      const dateStr = formatLocalDate(cursor)
      const night = await this.availability.getRoomNightAvailability(merchantId, dateStr, {
        serviceId: roomService?.id,
      })
      days.push({
        date: dateStr,
        available: !night.closed && night.available,
        nightly_rate: roomService
          ? getNightlyRateForDate(roomService, dateStr)
          : null,
        room_type: roomService?.name ?? null,
      })
    }

    return {
      from,
      to,
      room_service: roomService
        ? {
            id: roomService.id,
            name: roomService.name,
            nightly_rate: roomService.nightly_rate ?? roomService.price ?? null,
            capacity: roomService.capacity,
          }
        : null,
      days,
    }
  }

  async createForMerchant(merchantId: string, dto: CreateBookingDto, userId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, is_active: true },
      include: { category: { select: { slug: true } }, booking_settings: true },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    const limits = getPlanLimits(merchant.subscription_plan)
    const catConfig = getCategoryBookingConfig(merchant.category.slug)
    if (!limits.booking || !catConfig.enabled || !catConfig.type) {
      throw new ForbiddenException('Les réservations ne sont pas activées pour cet établissement.')
    }

    const fraudCheck = await this.fraud.checkBookingAbuse(dto.guest_phone, merchantId)
    if (fraudCheck.blocked) {
      throw new ForbiddenException(fraudCheck.reason)
    }

    const bookingType: BookingType = dto.booking_type ?? catConfig.type!
    const bookedAt = new Date(dto.booked_at)
    const checkOutAt = dto.check_out_at ? new Date(dto.check_out_at) : undefined

    if (bookingType === 'ROOM') {
      const checkInDay = new Date(bookedAt)
      checkInDay.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (checkInDay < today) {
        throw new BadRequestException('La date d\'arrivée doit être aujourd\'hui ou plus tard')
      }
    } else if (bookedAt <= new Date()) {
      throw new BadRequestException('La date de réservation doit être dans le futur')
    }

    if (bookingType === 'APPOINTMENT' && !dto.service_id) {
      throw new BadRequestException('Veuillez sélectionner une prestation')
    }
    if (bookingType === 'CONSULTATION' && !dto.service_id) {
      throw new BadRequestException('Veuillez sélectionner une consultation')
    }
    if (bookingType === 'ROOM' && !checkOutAt) {
      throw new BadRequestException('Veuillez indiquer la date de départ')
    }

    if (bookingType === 'ROOM' && checkOutAt && dto.service_id) {
      const roomService = await this.prisma.merchantService.findFirst({
        where: { id: dto.service_id, merchant_id: merchantId, is_active: true, service_kind: 'ROOM_TYPE' },
      })
      if (roomService) {
        const minStayMsg = assertMinStay(
          roomService,
          formatLocalDate(bookedAt),
          formatLocalDate(checkOutAt),
        )
        if (minStayMsg) throw new BadRequestException(minStayMsg)
      }
    }

    await this.availability.assertSlotAvailable(merchantId, bookedAt, {
      bookingType,
      partySize: dto.party_size ?? 1,
      checkOutAt,
      serviceId: dto.service_id,
      staffId: dto.staff_id,
    })

    let serviceForPayment = null as Awaited<
      ReturnType<typeof this.prisma.merchantService.findFirst>
    > | null
    if (dto.service_id) {
      serviceForPayment = await this.prisma.merchantService.findFirst({
        where: { id: dto.service_id, merchant_id: merchantId, is_active: true },
      })
    }

    const settings = merchant.booking_settings
    const baseAmount = computeBookingBaseAmount(
      bookingType,
      serviceForPayment,
      bookedAt,
      checkOutAt,
    )
    const depositPercent = settings?.deposit_percent ?? 100
    const paymentAmount = settings?.require_payment
      ? computeDepositAmount(baseAmount, depositPercent)
      : 0

    if (paymentAmount > 0 && !userId) {
      throw new BadRequestException(
        'Connectez-vous pour finaliser le paiement de votre réservation.',
      )
    }

    const autoConfirm =
      paymentAmount === 0
      && settings?.auto_confirm
      && limits.advancedBooking
    const status: BookingStatus = autoConfirm ? 'CONFIRMED' : 'PENDING'

    const booking = await this.prisma.booking.create({
      data: {
        merchant_id: merchantId,
        user_id: userId ?? null,
        booking_type: bookingType,
        guest_name: dto.guest_name,
        guest_phone: dto.guest_phone,
        guest_email: dto.guest_email ?? null,
        booked_at: bookedAt,
        check_out_at: checkOutAt ?? null,
        party_size: dto.party_size ?? 1,
        service_id: dto.service_id ?? null,
        staff_id: dto.staff_id ?? null,
        room_type: dto.room_type ?? null,
        notes: dto.notes ?? null,
        status,
      },
      include: {
        service: { select: { name: true } },
      },
    })

    let paymentPayload: {
      id: string
      reference: string
      amount: number
      currency: string
      provider: string
      instructions: string
    } | null = null

    if (paymentAmount > 0 && userId) {
      const payment = await this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          merchant_id: merchantId,
          purpose: 'BOOKING',
          booking_id: booking.id,
          amount: paymentAmount,
          reference: generatePaymentReference(),
          metadata: {
            simulator: true,
            booking_id: booking.id,
            base_amount: baseAmount,
            deposit_percent: depositPercent,
          },
        },
      })
      paymentPayload = {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        provider: 'SIMULATOR',
        instructions: 'Confirmez avec simulateResult success ou failure.',
      }
    }

    await this.audit.log({
      userId,
      action: 'CREATE',
      entityType: 'Booking',
      entityId: booking.id,
      payload: { merchant_id: merchantId, booking_type: bookingType, status },
    })

    await this.notificationQueue.enqueuePush({
      userId: merchant.owner_id,
      type: 'booking_created',
      title: 'Nouvelle réservation',
      body: `${dto.guest_name} — ${catConfig.cta} pour ${bookedAt.toLocaleString('fr-FR')}.`,
      data: { booking_id: booking.id, merchant_id: merchantId },
    })

    if (userId) {
      await this.notificationQueue.enqueuePush({
        userId,
        type: 'booking_confirmed',
        title: paymentPayload
          ? 'Paiement requis'
          : status === 'CONFIRMED'
            ? 'Réservation confirmée'
            : 'Demande envoyée',
        body: paymentPayload
          ? `Finalisez le paiement pour confirmer votre réservation chez ${merchant.business_name}.`
          : status === 'CONFIRMED'
            ? `Votre réservation chez ${merchant.business_name} est confirmée.`
            : `Votre demande chez ${merchant.business_name} est en attente.`,
        data: { booking_id: booking.id, payment_id: paymentPayload?.id },
      })
    }

    const checkInRemindAt = new Date(bookedAt.getTime() - 24 * 60 * 60 * 1000)
    if (checkInRemindAt.getTime() > Date.now()) {
      const isRoom = bookingType === 'ROOM'
      await this.notificationQueue.scheduleBookingReminder({
        bookingId: booking.id,
        userId: userId ?? undefined,
        guestPhone: userId ? undefined : dto.guest_phone,
        remindAt: checkInRemindAt,
        title: isRoom ? 'Rappel d\'arrivée' : 'Rappel de réservation',
        body: isRoom
          ? `Rappel : votre arrivée chez ${merchant.business_name} demain.`
          : `Rappel : réservation demain chez ${merchant.business_name}.`,
        merchantName: merchant.business_name,
        reminderKind: 'checkin',
      })
    }

    if (bookingType === 'ROOM' && checkOutAt) {
      const nights = Math.ceil((checkOutAt.getTime() - bookedAt.getTime()) / (24 * 60 * 60 * 1000))
      const checkoutRemindAt = new Date(checkOutAt.getTime() - 24 * 60 * 60 * 1000)
      if (nights > 1 && checkoutRemindAt.getTime() > Date.now()) {
        await this.notificationQueue.scheduleBookingReminder({
          bookingId: booking.id,
          userId: userId ?? undefined,
          guestPhone: userId ? undefined : dto.guest_phone,
          remindAt: checkoutRemindAt,
          title: 'Rappel de départ',
          body: `Rappel : votre départ de ${merchant.business_name} demain.`,
          merchantName: merchant.business_name,
          reminderKind: 'checkout',
        })
      }
    }

    return {
      ...booking,
      payment_required: Boolean(paymentPayload),
      payment: paymentPayload,
      pricing: baseAmount > 0
        ? { base_amount: baseAmount, deposit_percent: depositPercent, due_now: paymentAmount }
        : null,
    }
  }

  async listMerchantBookings(userId: string, merchantId?: string, status?: BookingStatus) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    const bookings = await this.prisma.booking.findMany({
      where: {
        merchant_id: merchant.id,
        ...(status ? { status } : {}),
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            nightly_rate: true,
            weekend_nightly_rate: true,
            peak_nightly_rate: true,
            peak_months: true,
            min_stay_nights: true,
            duration_min: true,
          },
        },
        staff: { select: { id: true, name: true } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { booked_at: 'asc' },
      take: 100,
    })
    return this.enrichRoomBookings(bookings)
  }

  private myBookingsUpcomingWhere(userId: string, now: Date) {
    return {
      user_id: userId,
      status: { in: ['PENDING', 'CONFIRMED'] as BookingStatus[] },
      OR: [
        { booked_at: { gte: now } },
        { booking_type: 'ROOM' as BookingType, check_out_at: { gt: now } },
      ],
    }
  }

  async listMyBookings(
    userId: string,
    opts: { page: number; limit: number; tab: 'upcoming' | 'history' },
  ) {
    const now = new Date()
    const where =
      opts.tab === 'upcoming'
        ? this.myBookingsUpcomingWhere(userId, now)
        : {
            user_id: userId,
            NOT: this.myBookingsUpcomingWhere(userId, now),
          }

    const [rawItems, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { booked_at: opts.tab === 'upcoming' ? 'asc' : 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        include: {
          merchant: {
            select: { id: true, business_name: true, slug: true, cover_image: true },
          },
          service: {
          select: {
            id: true,
            name: true,
            price: true,
            nightly_rate: true,
            weekend_nightly_rate: true,
            peak_nightly_rate: true,
            peak_months: true,
            min_stay_nights: true,
            duration_min: true,
          },
        },
          staff: { select: { id: true, name: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ])

    const items = await this.enrichRoomBookings(rawItems)

    return {
      items,
      total,
      page: opts.page,
      limit: opts.limit,
      totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    }
  }

  /** Rattache les réservations invité (user_id null) au compte si le téléphone correspond. */
  async linkGuestBookingsByPhone(userId: string, phone?: string | null): Promise<{ linked: number }> {
    const tail = phone ? phoneMatchTail(phone) : null
    if (!tail) return { linked: 0 }

    const result = await this.prisma.booking.updateMany({
      where: {
        user_id: null,
        guest_phone: { contains: tail },
        status: { not: 'CANCELLED' },
      },
      data: { user_id: userId },
    })

    if (result.count > 0) {
      await this.audit.log({
        userId,
        action: 'UPDATE',
        entityType: 'Booking',
        entityId: userId,
        payload: { linked: result.count, phone_tail: tail, kind: 'guest_claim' },
      })
    }

    return { linked: result.count }
  }

  async claimGuestBookings(userId: string): Promise<{ linked: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    })
    return this.linkGuestBookingsByPhone(userId, user?.phone)
  }

  async cancelMyBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, user_id: userId },
    })
    if (!booking) throw new NotFoundException('Réservation introuvable')
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new BadRequestException('Cette réservation ne peut plus être annulée')
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    })
  }

  async updateMyBooking(userId: string, bookingId: string, dto: UpdateMyBookingDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, user_id: userId },
      include: {
        merchant: {
          include: { category: { select: { slug: true } } },
        },
      },
    })
    if (!booking) throw new NotFoundException('Réservation introuvable')

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Cette réservation ne peut plus être modifiée')
    }
    if (booking.booked_at <= new Date()) {
      throw new BadRequestException('Impossible de modifier une réservation passée')
    }

    const bookedAt = dto.booked_at ? new Date(dto.booked_at) : booking.booked_at
    const checkOutAt = dto.check_out_at !== undefined
      ? (dto.check_out_at ? new Date(dto.check_out_at) : null)
      : booking.check_out_at
    const partySize = dto.party_size ?? booking.party_size
    const serviceId = dto.service_id !== undefined ? (dto.service_id || null) : booking.service_id
    const staffId = dto.staff_id !== undefined ? (dto.staff_id || null) : booking.staff_id
    const roomType = dto.room_type !== undefined ? (dto.room_type || null) : booking.room_type

    if (bookedAt <= new Date()) {
      throw new BadRequestException('La date de réservation doit être dans le futur')
    }

    if (booking.booking_type === 'APPOINTMENT' && !serviceId) {
      throw new BadRequestException('Veuillez sélectionner une prestation')
    }
    if (booking.booking_type === 'ROOM' && !checkOutAt) {
      throw new BadRequestException('Veuillez indiquer la date de départ')
    }

    await this.availability.assertSlotAvailable(booking.merchant_id, bookedAt, {
      bookingType: booking.booking_type,
      partySize,
      checkOutAt: checkOutAt ?? undefined,
      serviceId: serviceId ?? undefined,
      staffId: staffId ?? undefined,
      excludeBookingId: bookingId,
    })

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        guest_name: dto.guest_name ?? booking.guest_name,
        guest_phone: dto.guest_phone ?? booking.guest_phone,
        guest_email: dto.guest_email !== undefined ? (dto.guest_email || null) : booking.guest_email,
        booked_at: bookedAt,
        check_out_at: checkOutAt,
        party_size: partySize,
        service_id: serviceId,
        staff_id: staffId,
        room_type: roomType,
        notes: dto.notes !== undefined ? (dto.notes || null) : booking.notes,
        status: 'PENDING',
      },
      include: {
        merchant: { select: { id: true, business_name: true, slug: true, cover_image: true } },
        service: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    })

    const catConfig = getCategoryBookingConfig(booking.merchant.category.slug)

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entityType: 'Booking',
      entityId: bookingId,
      payload: { previous_status: booking.status, new_status: 'PENDING' },
    })

    await this.notificationQueue.enqueuePush({
      userId: booking.merchant.owner_id,
      type: 'booking_updated',
      title: 'Modification de réservation',
      body: `${updated.guest_name} a modifié sa demande pour ${bookedAt.toLocaleString('fr-FR')}. Validation requise.`,
      data: { booking_id: bookingId, merchant_id: booking.merchant_id },
    })

    await this.notificationQueue.enqueuePush({
      userId,
      type: 'booking_updated',
      title: 'Demande mise à jour',
      body: `Votre modification chez ${booking.merchant.business_name} est en attente de validation.`,
      data: { booking_id: bookingId },
    })

    return {
      ...updated,
      message: 'Modification enregistrée. Le marchand doit valider votre nouvelle demande.',
      cta: catConfig.cta,
    }
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, merchant_id: merchant.id },
    })
    if (!booking) throw new NotFoundException('Réservation introuvable')

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status as BookingStatus },
    })

    await this.audit.log({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'Booking',
      entityId: bookingId,
      payload: { from: booking.status, to: dto.status },
    })

    if (booking.user_id) {
      const statusLabels: Record<string, string> = {
        CONFIRMED: 'confirmée',
        CANCELLED: 'annulée',
        COMPLETED: 'terminée',
        NO_SHOW: 'marquée absent',
      }
      await this.notificationQueue.enqueuePush({
        userId: booking.user_id,
        type: 'booking_status',
        title: 'Mise à jour de réservation',
        body: `Votre réservation a été ${statusLabels[dto.status] ?? 'mise à jour'}.`,
        data: { booking_id: bookingId, status: dto.status },
      })
    }

    return updated
  }

  async merchantBookingEnabled(merchantId: string) {
    const config = await this.getMerchantConfig(merchantId)
    return config
  }
}
