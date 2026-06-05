import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

export const LOYALTY_TIERS = {
  EXPLORER: { min: 0, label: 'Explorateur' },
  LOCAL: { min: 100, label: 'Local' },
  INSIDER: { min: 300, label: 'Insider' },
  AMBASSADOR: { min: 700, label: 'Ambassadeur' },
} as const

export type LoyaltyTierKey = keyof typeof LOYALTY_TIERS

const POINTS_TABLE: Record<string, number> = {
  review: 20,
  favorite: 5,
  share: 10,
  signup_merchant: 50,
  referral_invite: 30,
  daily_visit: 2,
}

function computeTier(points: number): LoyaltyTierKey {
  if (points >= LOYALTY_TIERS.AMBASSADOR.min) return 'AMBASSADOR'
  if (points >= LOYALTY_TIERS.INSIDER.min) return 'INSIDER'
  if (points >= LOYALTY_TIERS.LOCAL.min) return 'LOCAL'
  return 'EXPLORER'
}

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrCreateAccount(userId: string) {
    const existing = await this.prisma.loyaltyAccount.findUnique({ where: { user_id: userId } })
    if (existing) return existing
    return this.prisma.loyaltyAccount.create({
      data: { user_id: userId, points: 0, tier: 'EXPLORER', total_earned: 0, updated_at: new Date() },
    })
  }

  async getAccount(userId: string) {
    const account = await this.getOrCreateAccount(userId)
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { account_id: account.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    })
    const currentTierKey = account.tier as LoyaltyTierKey
    const tiers = Object.entries(LOYALTY_TIERS).map(([key, t]) => ({
      key,
      label: t.label,
      min: t.min,
      active: key === currentTierKey,
    }))
    const nextTierEntry = Object.entries(LOYALTY_TIERS).find(([, t]) => t.min > account.points)
    const pointsToNext = nextTierEntry ? nextTierEntry[1].min - account.points : null
    return { account, transactions, tiers, pointsToNext }
  }

  async earnPoints(userId: string, reason: string, metadata?: Record<string, unknown>) {
    const points = POINTS_TABLE[reason] ?? 0
    if (points === 0) return null

    const account = await this.getOrCreateAccount(userId)
    const prevTier = account.tier as LoyaltyTierKey

    const [, updatedAccount] = await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: { account_id: account.id, points, reason, metadata },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          total_earned: { increment: points },
          updated_at: new Date(),
        },
      }),
    ])

    const newTier = computeTier(updatedAccount.points)
    if (newTier !== prevTier) {
      await this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { tier: newTier, updated_at: new Date() },
      })
      if (newTier !== 'EXPLORER') {
        await this.notifications.sendLoyaltyLevelUp(userId, newTier, updatedAccount.points)
      }
      this.logger.log(`User ${userId} leveled up: ${prevTier} → ${newTier}`)
    }

    return { points, reason, newTier }
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.loyaltyAccount.findMany({
      orderBy: { points: 'desc' },
      take: limit,
      include: { user: { select: { full_name: true, avatar: true } } },
    })
  }
}
