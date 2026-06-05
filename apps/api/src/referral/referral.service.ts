import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { NotificationsService } from '../notifications/notifications.service'

const REFERRAL_POINTS = 30
const REFERRER_POINTS = 30

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyalty: LoyaltyService,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findUnique({ where: { user_id: userId } })
    if (existing) return existing
    const code = this.generateCode(userId)
    return this.prisma.referralCode.create({ data: { user_id: userId, code } })
  }

  async applyReferralCode(code: string, invitedUserId: string) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code } })
    if (!referralCode) throw new BadRequestException('Code de parrainage invalide')
    if (referralCode.user_id === invitedUserId) {
      throw new BadRequestException('Vous ne pouvez pas utiliser votre propre code')
    }

    const alreadyUsed = await this.prisma.referral.findUnique({ where: { invited_user_id: invitedUserId } })
    if (alreadyUsed) throw new BadRequestException('Vous avez déjà utilisé un code de parrainage')

    await this.prisma.$transaction([
      this.prisma.referral.create({
        data: {
          referral_code_id: referralCode.id,
          invited_user_id: invitedUserId,
          rewarded: true,
        },
      }),
      this.prisma.referralCode.update({
        where: { id: referralCode.id },
        data: { uses_count: { increment: 1 } },
      }),
    ])

    await Promise.all([
      this.loyalty.earnPoints(invitedUserId, 'referral_invite', { code }),
      this.loyalty.earnPoints(referralCode.user_id, 'referral_invite', { invited_user_id: invitedUserId }),
      this.notifications.sendReferralReward(referralCode.user_id, REFERRER_POINTS),
    ])

    this.logger.log(`Referral applied: code=${code}, invited=${invitedUserId}, referrer=${referralCode.user_id}`)
    return { success: true, pointsEarned: REFERRAL_POINTS }
  }

  async getStats(userId: string) {
    const code = await this.getOrCreateCode(userId)
    const referrals = await this.prisma.referral.findMany({
      where: { referral_code_id: code.id },
      include: { invited_user: { select: { full_name: true, created_at: true } } },
      orderBy: { created_at: 'desc' },
    })
    return {
      code: code.code,
      uses_count: code.uses_count,
      total_points_earned: code.uses_count * REFERRER_POINTS,
      referrals,
    }
  }

  private generateCode(userId: string): string {
    const suffix = userId.slice(-4).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `LP-${rand}${suffix}`
  }
}
