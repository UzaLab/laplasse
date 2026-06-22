import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { PLAN_PRICES } from '../common/plan-limits'
import { SubscriptionPlan } from '../../generated/prisma/client'
import { generatePaymentReference } from '../bookings/booking-payment.util'

const PLAN_ORDER: SubscriptionPlan[] = ['FREE', 'STARTER', 'GROWTH', 'PREMIUM']

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly loyalty: LoyaltyService,
  ) {}

  private async resolveMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  private generateReference() {
    return generatePaymentReference()
  }

  async initSubscription(userId: string, plan: SubscriptionPlan, merchantId?: string) {
    if (plan === 'FREE') throw new BadRequestException('Le plan gratuit ne nécessite pas de paiement')

    const merchant = await this.resolveMerchant(userId, merchantId)
    const amount = PLAN_PRICES[plan]

    if (PLAN_ORDER.indexOf(plan) <= PLAN_ORDER.indexOf(merchant.subscription_plan)) {
      throw new BadRequestException('Ce plan est inférieur ou égal à votre plan actuel')
    }

    const payment = await this.prisma.paymentTransaction.create({
      data: {
        user_id: userId,
        merchant_id: merchant.id,
        plan,
        amount,
        reference: this.generateReference(),
        metadata: { simulator: true, billing_cycle: 'monthly' },
      },
      select: {
        id: true,
        reference: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        created_at: true,
      },
    })

    return {
      ...payment,
      provider: 'SIMULATOR',
      instructions: 'Utilisez simulateResult success ou failure pour confirmer le paiement.',
    }
  }

  async confirmSubscription(
    userId: string,
    paymentId: string,
    simulateResult: 'success' | 'failure',
  ) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: paymentId, user_id: userId, purpose: 'SUBSCRIPTION' },
    })
    if (!payment) throw new NotFoundException('Paiement introuvable')
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Ce paiement a déjà été traité')
    }
    if (!payment.merchant_id) {
      throw new BadRequestException('Paiement abonnement invalide')
    }

    if (simulateResult === 'failure') {
      const failed = await this.prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: 'FAILED', metadata: { ...(payment.metadata as object ?? {}), failed_reason: 'simulator_declined' } },
      })
      return { status: failed.status, message: 'Paiement refusé par le simulateur.' }
    }

    const plan = payment.plan!
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    const [updatedPayment, merchant] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', paid_at: now },
      }),
      this.prisma.merchant.update({
        where: { id: payment.merchant_id },
        data: { subscription_plan: plan },
        select: { id: true, business_name: true, subscription_plan: true, owner_id: true },
      }),
      this.prisma.subscription.upsert({
        where: { merchant_id: payment.merchant_id },
        create: {
          merchant_id: payment.merchant_id,
          plan,
          status: 'ACTIVE',
          billing_cycle: 'monthly',
          started_at: now,
          expires_at: expiresAt,
        },
        update: {
          plan,
          status: 'ACTIVE',
          billing_cycle: 'monthly',
          started_at: now,
          expires_at: expiresAt,
        },
      }),
    ])

    await this.notificationQueue.enqueuePush({
      userId: merchant.owner_id,
      type: 'subscription_upgraded',
      title: `Plan ${plan} activé`,
      body: `Votre abonnement ${plan} est actif pour ${merchant.business_name}. Merci pour votre confiance !`,
      data: { merchant_id: merchant.id, plan, reference: payment.reference },
    })

    return {
      status: updatedPayment.status,
      merchant,
      reference: payment.reference,
      message: 'Paiement simulé avec succès. Votre plan a été mis à jour.',
    }
  }

  async getHistory(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    return this.prisma.paymentTransaction.findMany({
      where: { merchant_id: merchant.id, user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        id: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        reference: true,
        provider: true,
        created_at: true,
        paid_at: true,
      },
    })
  }

  async getBookingPayment(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, user_id: userId },
      include: {
        merchant: { select: { business_name: true } },
        payment: true,
      },
    })
    if (!booking) throw new NotFoundException('Réservation introuvable')
    if (!booking.payment) {
      return { payment_required: false, booking_id: booking.id }
    }
    if (booking.payment.status !== 'PENDING') {
      throw new BadRequestException('Aucun paiement en attente pour cette réservation')
    }
    return {
      payment_required: true,
      booking_id: booking.id,
      merchant_name: booking.merchant.business_name,
      payment: {
        id: booking.payment.id,
        reference: booking.payment.reference,
        amount: booking.payment.amount,
        currency: booking.payment.currency,
        provider: 'SIMULATOR',
        instructions: 'Confirmez avec simulateResult success ou failure.',
      },
    }
  }

  async confirmBookingPayment(
    userId: string,
    bookingId: string,
    paymentId: string,
    simulateResult: 'success' | 'failure',
  ) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        id: paymentId,
        user_id: userId,
        purpose: 'BOOKING',
        booking_id: bookingId,
      },
      include: {
        booking: {
          include: {
            merchant: { select: { id: true, business_name: true, owner_id: true } },
          },
        },
      },
    })
    if (!payment?.booking) throw new NotFoundException('Paiement introuvable')
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Ce paiement a déjà été traité')
    }

    if (simulateResult === 'failure') {
      await this.prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as object ?? {}),
            failed_reason: 'simulator_declined',
          },
        },
      })
      return { status: 'FAILED', message: 'Paiement refusé par le simulateur.' }
    }

    const now = new Date()
    const booking = payment.booking
    const shouldConfirm = booking.status === 'PENDING'

    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', paid_at: now },
      }),
      ...(shouldConfirm
        ? [
            this.prisma.booking.update({
              where: { id: booking.id },
              data: { status: 'CONFIRMED' },
            }),
          ]
        : []),
    ])

    await this.loyalty.earnPoints(userId, 'booking_payment', {
      booking_id: booking.id,
      amount: payment.amount,
    }).catch(() => {})

    await this.notificationQueue.enqueuePush({
      userId: booking.merchant.owner_id,
      type: 'booking_paid',
      title: 'Réservation payée',
      body: `${booking.guest_name} — ${payment.amount.toLocaleString('fr-CI')} FCFA reçus (simulateur).`,
      data: { booking_id: booking.id, payment_id: payment.id },
    })

    await this.notificationQueue.enqueuePush({
      userId,
      type: 'booking_payment_success',
      title: 'Paiement confirmé',
      body: `Votre réservation chez ${booking.merchant.business_name} est confirmée.`,
      data: { booking_id: booking.id, payment_id: payment.id },
    })

    return {
      status: 'SUCCESS',
      booking_id: booking.id,
      message: 'Paiement simulé avec succès. Votre réservation est confirmée.',
    }
  }
}
