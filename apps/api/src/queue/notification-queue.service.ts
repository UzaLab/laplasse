import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue, Worker, Job } from 'bullmq'
import type { PushSubscription } from 'web-push'
import { PrismaService } from '../prisma/prisma.service'
import { WebPushService } from '../push/web-push.service'

export interface PushNotificationJob {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown> | null
}

export interface BookingReminderJob {
  bookingId: string
  title: string
  body: string
  merchantName: string
  userId?: string
  guestPhone?: string
  reminderKind?: 'checkin' | 'checkout'
}

type QueueJob = PushNotificationJob | BookingReminderJob

const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name)
  private queue: Queue<QueueJob> | null = null
  private worker: Worker<QueueJob> | null = null
  private useQueue = false

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL')
    if (!redisUrl) {
      this.logger.warn('REDIS_URL absent — notifications push en mode synchrone')
      return
    }

    try {
      const connection = { url: redisUrl }
      this.queue = new Queue<QueueJob>('notifications', { connection })
      this.worker = new Worker<QueueJob>(
        'notifications',
        async (job: Job<QueueJob>) => {
          if (job.name === 'reminder') {
            await this.processReminder(job.data as BookingReminderJob)
          } else {
            await this.processPush(job.data as PushNotificationJob)
          }
        },
        { connection },
      )
      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job?.name} ${job?.id} failed: ${err.message}`)
      })
      this.useQueue = true
      this.logger.log('BullMQ notification queue ready')
    } catch (err) {
      this.logger.warn(`BullMQ indisponible — fallback synchrone: ${(err as Error).message}`)
    }
  }

  async onModuleDestroy() {
    await this.worker?.close()
    await this.queue?.close()
  }

  async enqueuePush(payload: PushNotificationJob) {
    if (this.useQueue && this.queue) {
      await this.queue.add('push', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
      })
      return
    }
    await this.processPush(payload)
  }

  async scheduleBookingReminder(payload: BookingReminderJob & { remindAt: Date }) {
    const delay = payload.remindAt.getTime() - Date.now()
    if (delay <= 0) return

    const { remindAt: _r, ...job } = payload
    if (this.useQueue && this.queue) {
      await this.queue.add('reminder', job, {
        delay,
        attempts: 2,
        removeOnComplete: 50,
      })
      return
    }
    this.logger.log(
      `Rappel booking ${payload.bookingId} planifié (Redis requis pour exécution différée — cron fallback actif)`,
    )
  }

  /** Rattrapage si Redis indisponible ou job perdu — appelé par cron externe. */
  async processDueBookingReminders(): Promise<{ processed: number; skipped: number }> {
    const now = new Date()
    let processed = 0
    let skipped = 0

    const checkInBookings = await this.prisma.booking.findMany({
      where: {
        reminder_sent_at: null,
        status: { in: ['PENDING', 'CONFIRMED'] },
        booked_at: { gt: now },
      },
      include: {
        merchant: { select: { business_name: true } },
        user: { select: { id: true, phone: true } },
      },
      take: 200,
    })

    for (const booking of checkInBookings) {
      const remindAt = new Date(booking.booked_at.getTime() - REMINDER_LEAD_MS)
      if (remindAt > now) {
        skipped++
        continue
      }

      const merchantName = booking.merchant.business_name
      const isRoom = booking.booking_type === 'ROOM'
      await this.processReminder({
        bookingId: booking.id,
        userId: booking.user_id ?? undefined,
        guestPhone: booking.user_id ? undefined : booking.guest_phone,
        title: isRoom ? 'Rappel d\'arrivée' : 'Rappel de réservation',
        body: isRoom
          ? `Rappel : votre arrivée chez ${merchantName} approche.`
          : `Rappel : votre réservation chez ${merchantName} approche.`,
        merchantName,
        reminderKind: 'checkin',
      })
      processed++
    }

    const checkoutBookings = await this.prisma.booking.findMany({
      where: {
        booking_type: 'ROOM',
        checkout_reminder_sent_at: null,
        check_out_at: { gt: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        merchant: { select: { business_name: true } },
        user: { select: { id: true, phone: true } },
      },
      take: 200,
    })

    for (const booking of checkoutBookings) {
      if (!booking.check_out_at) continue
      const remindAt = new Date(booking.check_out_at.getTime() - REMINDER_LEAD_MS)
      if (remindAt > now) {
        skipped++
        continue
      }

      const merchantName = booking.merchant.business_name
      await this.processReminder({
        bookingId: booking.id,
        userId: booking.user_id ?? undefined,
        guestPhone: booking.user_id ? undefined : booking.guest_phone,
        title: 'Rappel de départ',
        body: `Rappel : votre départ de ${merchantName} approche.`,
        merchantName,
        reminderKind: 'checkout',
      })
      processed++
    }

    return { processed, skipped }
  }

  private async processPush(payload: PushNotificationJob) {
    await this.prisma.notification.create({
      data: {
        user_id: payload.userId,
        type: payload.type,
        channel: 'push',
        title: payload.title,
        body: payload.body,
        data: (payload.data ?? undefined) as never,
        status: 'SENT',
        sent_at: new Date(),
      },
    })

    const devices = await this.prisma.deviceToken.findMany({
      where: { user_id: payload.userId },
    })

    let delivered = 0

    if (this.webPush.isConfigured()) {
      for (const device of devices) {
        if (!device.push_subscription) continue
        try {
          await this.webPush.send(
            device.push_subscription as unknown as PushSubscription,
            {
              title: payload.title,
              body: payload.body,
              type: payload.type,
              data: payload.data ?? undefined,
            },
          )
          delivered++
          this.logger.log(`Web Push [${payload.type}] → ${device.token.slice(0, 48)}…`)
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.deviceToken.delete({ where: { id: device.id } }).catch(() => {})
            this.logger.warn(`Subscription expirée supprimée (${device.token.slice(0, 32)}…)`)
          } else {
            this.logger.warn(`Web Push échec: ${(err as Error).message}`)
          }
        }
      }
    }

    const fcmKey = this.config.get<string>('FCM_SERVER_KEY')
    const fcmTokens = devices.filter(d => !d.push_subscription && d.platform !== 'web_push')

    if (fcmKey && fcmTokens.length > 0) {
      for (const { token } of fcmTokens) {
        try {
          await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `key=${fcmKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: { title: payload.title, body: payload.body },
              data: payload.data ?? {},
            }),
          })
          delivered++
          this.logger.log(`FCM envoyé [${payload.type}] → ${token.slice(0, 12)}…`)
        } catch (err) {
          this.logger.warn(`FCM échec: ${(err as Error).message}`)
        }
      }
    }

    if (delivered === 0) {
      this.logger.log(
        `Push in-app seulement [${payload.type}] → user:${payload.userId} (aucun appareil Web Push / FCM actif)`,
      )
    }
  }

  private async processReminder(payload: BookingReminderJob) {
    const kind = payload.reminderKind ?? 'checkin'
    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      select: {
        status: true,
        reminder_sent_at: true,
        checkout_reminder_sent_at: true,
        booked_at: true,
        check_out_at: true,
        guest_phone: true,
        user_id: true,
      },
    })
    if (!booking) return
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return
    if (kind === 'checkout') {
      if (booking.checkout_reminder_sent_at || !booking.check_out_at) return
    } else if (booking.reminder_sent_at) {
      return
    }

    const userId = payload.userId ?? booking.user_id ?? undefined
    const guestPhone = payload.guestPhone ?? (userId ? undefined : booking.guest_phone)

    if (userId) {
      await this.processPush({
        userId,
        type: kind === 'checkout' ? 'booking_checkout_reminder' : 'booking_reminder',
        title: payload.title,
        body: payload.body,
        data: { booking_id: payload.bookingId },
      })
    }

    const when = kind === 'checkout' && booking.check_out_at
      ? booking.check_out_at.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : booking.booked_at.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    const reminderText = `${payload.body} ${kind === 'checkout' ? 'Départ le' : 'Rendez-vous le'} ${when}.`

    if (guestPhone) {
      const waUrl = this.buildWhatsAppReminderUrl(guestPhone, reminderText)
      this.logger.log(
        `WhatsApp rappel ${kind} booking ${payload.bookingId} → ${guestPhone} (${waUrl})`,
      )
      this.logger.log(`SMS simulé [booking_${kind}_reminder] → ${guestPhone}: ${reminderText}`)
    }

    await this.prisma.booking.update({
      where: { id: payload.bookingId },
      data: kind === 'checkout'
        ? { checkout_reminder_sent_at: new Date() }
        : { reminder_sent_at: new Date() },
    })
  }

  private buildWhatsAppReminderUrl(phone: string, text: string): string {
    let digits = phone.replace(/\D/g, '')
    if (digits.startsWith('0') && digits.length === 10) {
      digits = `225${digits.slice(1)}`
    }
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
  }
}
