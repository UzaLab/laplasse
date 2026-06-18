import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPlanLimits } from '../common/plan-limits'
import { AuditService } from '../audit/audit.service'
import { AD_CAMPAIGN_PRICES, AD_DURATION_OPTIONS } from './ad-pricing'
import { CreateAdCampaignDto } from './dto/ad.dto'
import { AdPlacement } from '../../generated/prisma/client'

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async resolveMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    if (!getPlanLimits(merchant.subscription_plan).adsSelfService) {
      throw new ForbiddenException('Les campagnes publicitaires nécessitent le plan Growth ou supérieur.')
    }
    return merchant
  }

  getPricing() {
    return { prices: AD_CAMPAIGN_PRICES, durations: AD_DURATION_OPTIONS }
  }

  async listCampaigns(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    await this.expireCampaigns()
    return this.prisma.adCampaign.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { created_at: 'desc' },
    })
  }

  async createCampaign(userId: string, dto: CreateAdCampaignDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    const amount = AD_CAMPAIGN_PRICES[dto.placement]?.[dto.duration_days]
    if (!amount) throw new BadRequestException('Durée ou placement invalide')

    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + dto.duration_days)

    const reference = `LP-AD-${Date.now().toString(36).toUpperCase()}`

    const [campaign, payment] = await this.prisma.$transaction([
      this.prisma.adCampaign.create({
        data: {
          merchant_id: merchant.id,
          placement: dto.placement,
          status: 'PENDING_PAYMENT',
          amount,
          starts_at: startsAt,
          ends_at: endsAt,
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          merchant_id: merchant.id,
          purpose: 'AD_CAMPAIGN',
          amount,
          reference,
          metadata: { placement: dto.placement, duration_days: dto.duration_days },
        },
      }),
    ])

    await this.prisma.adCampaign.update({
      where: { id: campaign.id },
      data: { payment_id: payment.id },
    })

    return {
      campaign,
      payment: { id: payment.id, reference: payment.reference, amount: payment.amount },
    }
  }

  async confirmAdPayment(userId: string, paymentId: string, simulateResult: 'success' | 'failure') {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: paymentId, user_id: userId, purpose: 'AD_CAMPAIGN' },
    })
    if (!payment) throw new NotFoundException('Paiement introuvable')
    if (payment.status !== 'PENDING') throw new BadRequestException('Paiement déjà traité')
    if (!payment.merchant_id) throw new BadRequestException('Paiement publicité invalide')

    const campaign = await this.prisma.adCampaign.findFirst({
      where: { payment_id: paymentId, merchant_id: payment.merchant_id },
    })
    if (!campaign) throw new NotFoundException('Campagne introuvable')

    if (simulateResult === 'failure') {
      await this.prisma.$transaction([
        this.prisma.paymentTransaction.update({ where: { id: paymentId }, data: { status: 'FAILED' } }),
        this.prisma.adCampaign.update({ where: { id: campaign.id }, data: { status: 'CANCELLED' } }),
      ])
      return { status: 'FAILED' }
    }

    const now = new Date()
    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: paymentId },
        data: { status: 'SUCCESS', paid_at: now },
      }),
      this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: { status: 'ACTIVE' },
      }),
      this.prisma.merchant.update({
        where: { id: payment.merchant_id },
        data: { is_sponsored: true },
      }),
    ])

    await this.audit.log({
      userId,
      action: 'PAYMENT',
      entityType: 'AdCampaign',
      entityId: campaign.id,
      payload: { amount: payment.amount, placement: campaign.placement },
    })

    return { status: 'SUCCESS', campaign }
  }

  async expireCampaigns() {
    const now = new Date()
    const expired = await this.prisma.adCampaign.findMany({
      where: { status: 'ACTIVE', ends_at: { lt: now } },
      select: { id: true, merchant_id: true },
    })
    for (const c of expired) {
      const otherActive = await this.prisma.adCampaign.count({
        where: {
          merchant_id: c.merchant_id,
          status: 'ACTIVE',
          ends_at: { gte: now },
          id: { not: c.id },
        },
      })
      await this.prisma.adCampaign.update({ where: { id: c.id }, data: { status: 'EXPIRED' } })
      if (otherActive === 0) {
        await this.prisma.merchant.update({
          where: { id: c.merchant_id },
          data: { is_sponsored: false },
        })
      }
    }
  }

  async getActiveSponsoredMerchantIds(): Promise<Set<string>> {
    await this.expireCampaigns()
    const active = await this.prisma.adCampaign.findMany({
      where: { status: 'ACTIVE', ends_at: { gte: new Date() } },
      select: { merchant_id: true },
    })
    return new Set(active.map(a => a.merchant_id))
  }
}
