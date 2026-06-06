import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async checkBookingAbuse(guestPhone: string, merchantId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await this.prisma.booking.count({
      where: {
        guest_phone: guestPhone,
        merchant_id: merchantId,
        created_at: { gte: oneHourAgo },
      },
    })
    if (recentCount >= 3) {
      await this.createSignal('booking_spam', 'high', 'merchant', merchantId, {
        guest_phone: guestPhone,
        count: recentCount + 1,
      })
      return { blocked: true, reason: 'Trop de réservations récentes. Réessayez plus tard.' }
    }
    return { blocked: false }
  }

  async checkReviewSpam(userId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const count = await this.prisma.review.count({
      where: { user_id: userId, created_at: { gte: oneDayAgo } },
    })
    if (count >= 5) {
      await this.createSignal('review_spam', 'medium', 'user', userId, { count: count + 1 })
      return { flagged: true }
    }
    return { flagged: false }
  }

  private async createSignal(
    signalType: string,
    severity: string,
    entityType: string,
    entityId: string,
    details: Record<string, unknown>,
  ) {
    return this.prisma.fraudSignal.create({
      data: { signal_type: signalType, severity, entity_type: entityType, entity_id: entityId, details: details as never },
    })
  }

  async listUnresolved(limit = 50) {
    return this.prisma.fraudSignal.findMany({
      where: { resolved: false },
      orderBy: { created_at: 'desc' },
      take: limit,
    })
  }

  async resolve(id: string) {
    return this.prisma.fraudSignal.update({
      where: { id },
      data: { resolved: true },
    })
  }
}
