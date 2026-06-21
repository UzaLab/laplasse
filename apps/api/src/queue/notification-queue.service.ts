import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue, Worker, Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'

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
    const bookings = await this.prisma.booking.findMany({
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

    let processed = 0
    let skipped = 0

    for (const booking of bookings) {
      const remindAt = new Date(booking.booked_at.getTime() - REMINDER_LEAD_MS)
      if (remindAt > now) {
        skipped++
        continue
      }

      const merchantName = booking.merchant.business_name
      const title = 'Rappel de réservation'
      const body = `Rappel : votre réservation chez ${merchantName} approche.`

      await this.processReminder({
        bookingId: booking.id,
        userId: booking.user_id ?? undefined,
        guestPhone: booking.user_id ? undefined : booking.guest_phone,
        title,
        body,
        merchantName,
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

    const fcmKey = this.config.get<string>('FCM_SERVER_KEY')
    const tokens = await this.prisma.deviceToken.findMany({
      where: { user_id: payload.userId },
      select: { token: true },
    })

    if (fcmKey && tokens.length > 0) {
      for (const { token } of tokens) {
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
          this.logger.log(`FCM envoyé [${payload.type}] → ${token.slice(0, 12)}…`)
        } catch (err) {
          this.logger.warn(`FCM échec: ${(err as Error).message}`)
        }
      }
    } else {
      this.logger.log(`Push simulé [${payload.type}] → user:${payload.userId}`)
    }
  }

  private async processReminder(payload: BookingReminderJob) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      select: { status: true, reminder_sent_at: true, booked_at: true },
    })
    if (!booking || booking.reminder_sent_at) return
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') return

    if (payload.userId) {
      await this.processPush({
        userId: payload.userId,
        type: 'booking_reminder',
        title: payload.title,
        body: payload.body,
        data: { booking_id: payload.bookingId },
      })
    }

    const when = booking.booked_at.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
    const reminderText = `${payload.body} Rendez-vous le ${when}.`

    if (payload.guestPhone) {
      const waUrl = this.buildWhatsAppReminderUrl(payload.guestPhone, reminderText)
      this.logger.log(
        `WhatsApp rappel booking ${payload.bookingId} → ${payload.guestPhone} (${waUrl})`,
      )
      this.logger.log(`SMS simulé [booking_reminder] → ${payload.guestPhone}: ${reminderText}`)
    }

    await this.prisma.booking.update({
      where: { id: payload.bookingId },
      data: { reminder_sent_at: new Date() },
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
