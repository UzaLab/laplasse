import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WebPushService } from '../push/web-push.service'

export type NotificationType =
  | 'review_approved'
  | 'review_rejected'
  | 'merchant_verified'
  | 'merchant_pending'
  | 'loyalty_level_up'
  | 'referral_reward'
  | 'promotion_created'
  | 'welcome'
  | 'subscription_upgraded'
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_status'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
  ) {}

  async send(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown> | null,
    channel: 'in_app' | 'email' = 'in_app',
  ) {
    try {
      const notif = await this.prisma.notification.create({
        data: { user_id: userId, type, channel, title, body, data: (data ?? undefined) as never, status: 'SENT', sent_at: new Date() },
      })
      this.logger.log(`Notification sent [${type}] → user:${userId}`)
      return notif
    } catch (err) {
      this.logger.error(`Failed to send notification [${type}] → user:${userId}`, err)
    }
  }

  async getUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId, read: false },
      orderBy: { created_at: 'desc' },
      take: 30,
    })
  }

  async getPage(
    userId: string,
    opts: { page: number; limit: number; unreadOnly?: boolean },
  ) {
    const page = Math.max(1, opts.page)
    const limit = Math.min(50, Math.max(1, opts.limit))
    const where = {
      user_id: userId,
      ...(opts.unreadOnly ? { read: false } : {}),
    }

    const [items, total, totalAll, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { user_id: userId } }),
      this.prisma.notification.count({ where: { user_id: userId, read: false } }),
    ])

    return {
      items,
      total,
      totalAll,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadCount,
    }
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    })
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { user_id: userId, read: false } })
  }

  getWebPushPublicKey(): string | null {
    return this.webPush.getPublicKey()
  }

  async registerWebPushSubscription(
    userId: string,
    subscription: Record<string, unknown>,
  ) {
    const endpoint = typeof subscription.endpoint === 'string' ? subscription.endpoint : null
    if (!endpoint) throw new BadRequestException('Subscription invalide')

    await this.prisma.deviceToken.upsert({
      where: { token: endpoint },
      update: {
        user_id: userId,
        platform: 'web_push',
        push_subscription: subscription as never,
      },
      create: {
        user_id: userId,
        token: endpoint,
        platform: 'web_push',
        push_subscription: subscription as never,
      },
    })

    this.logger.log(`Web Push enregistré → user:${userId}`)
    return { ok: true }
  }

  async unregisterWebPushSubscription(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.prisma.deviceToken.deleteMany({
        where: { user_id: userId, token: endpoint },
      })
    } else {
      await this.prisma.deviceToken.deleteMany({
        where: { user_id: userId, platform: 'web_push' },
      })
    }
    return { ok: true }
  }

  // ─── Helpers métier ───────────────────────────────────────────────────────

  sendReviewApproved(userId: string, merchantName: string) {
    return this.send(
      userId,
      'review_approved',
      'Votre avis a été publié',
      `Votre avis sur ${merchantName} est maintenant visible par tous.`,
      { merchant_name: merchantName },
    )
  }

  sendMerchantVerified(userId: string, businessName: string) {
    return this.send(
      userId,
      'merchant_verified',
      `${businessName} est maintenant vérifié ✓`,
      'Votre établissement a été validé. Le badge de confiance est activé.',
      { business_name: businessName },
    )
  }

  sendMerchantPending(userId: string, businessName: string) {
    return this.send(
      userId,
      'merchant_pending',
      'Votre dossier est en cours de vérification',
      `Nous examinons ${businessName}. Vous serez notifié sous 24–48h.`,
      { business_name: businessName },
    )
  }

  sendLoyaltyLevelUp(userId: string, tier: string, points: number) {
    const tierLabels: Record<string, string> = {
      LOCAL: 'Local',
      INSIDER: 'Insider',
      AMBASSADOR: 'Ambassadeur',
    }
    return this.send(
      userId,
      'loyalty_level_up',
      `Nouveau niveau — ${tierLabels[tier] ?? tier} 🎉`,
      `Bravo ! Vous avez atteint le niveau ${tierLabels[tier] ?? tier} avec ${points} points.`,
      { tier, points },
    )
  }

  sendReferralReward(userId: string, points: number) {
    return this.send(
      userId,
      'referral_reward',
      `+${points} points d'invitation`,
      `Un ami a rejoint LaPlasse avec votre code ! Vous gagnez ${points} points.`,
      { points },
    )
  }

  sendWelcome(userId: string, fullName?: string) {
    return this.send(
      userId,
      'welcome',
      `Bienvenue sur LaPlasse${fullName ? `, ${fullName}` : ''} !`,
      'Découvrez les meilleurs établissements d\'Abidjan et gagnez des points à chaque interaction.',
    )
  }
}
