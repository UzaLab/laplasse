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
import { AvailabilityService } from './availability.service'
import { FraudService } from '../fraud/fraud.service'
import { AuditService } from '../audit/audit.service'
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto'
import { BookingStatus, BookingType } from '../../generated/prisma/client'

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly availability: AvailabilityService,
    private readonly fraud: FraudService,
    private readonly audit: AuditService,
  ) {}

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

    return {
      enabled,
      booking_type: catConfig.type,
      label: catConfig.label,
      cta: catConfig.cta,
      category_slug: merchant.category.slug,
      services: merchant.services,
      staff: merchant.staff,
      room_types: ['Single', 'Double', 'Suite', 'Family'],
    }
  }

  async getAvailability(
    merchantId: string,
    date: string,
    serviceId?: string,
    staffId?: string,
  ) {
    const config = await this.getMerchantConfig(merchantId)
    if (!config.enabled || !config.booking_type) {
      return { slots: [], closed: true, reason: 'Réservations non activées' }
    }
    return this.availability.getAvailableSlots(merchantId, date, {
      serviceId,
      staffId,
      bookingType: config.booking_type,
    })
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

    if (bookedAt <= new Date()) {
      throw new BadRequestException('La date de réservation doit être dans le futur')
    }

    if (bookingType === 'APPOINTMENT' && !dto.service_id) {
      throw new BadRequestException('Veuillez sélectionner une prestation')
    }
    if (bookingType === 'ROOM' && !checkOutAt) {
      throw new BadRequestException('Veuillez indiquer la date de départ')
    }

    await this.availability.assertSlotAvailable(merchantId, bookedAt, {
      bookingType,
      partySize: dto.party_size ?? 1,
      checkOutAt,
      serviceId: dto.service_id,
      staffId: dto.staff_id,
    })

    const autoConfirm = merchant.booking_settings?.auto_confirm && limits.advancedBooking
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
        title: status === 'CONFIRMED' ? 'Réservation confirmée' : 'Demande envoyée',
        body: status === 'CONFIRMED'
          ? `Votre réservation chez ${merchant.business_name} est confirmée.`
          : `Votre demande chez ${merchant.business_name} est en attente.`,
        data: { booking_id: booking.id },
      })
    }

    await this.notificationQueue.scheduleBookingReminder({
      bookingId: booking.id,
      userId: userId ?? merchant.owner_id,
      remindAt: new Date(bookedAt.getTime() - 24 * 60 * 60 * 1000),
      title: 'Rappel de réservation',
      body: `Rappel : réservation demain chez ${merchant.business_name}.`,
    })

    return booking
  }

  async listMerchantBookings(userId: string, merchantId?: string, status?: BookingStatus) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    return this.prisma.booking.findMany({
      where: {
        merchant_id: merchant.id,
        ...(status ? { status } : {}),
      },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
      },
      orderBy: { booked_at: 'asc' },
      take: 100,
    })
  }

  async listMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { user_id: userId },
      orderBy: { booked_at: 'desc' },
      take: 50,
      include: {
        merchant: { select: { id: true, business_name: true, slug: true } },
        service: { select: { name: true } },
      },
    })
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
