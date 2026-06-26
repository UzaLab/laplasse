import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto'
import {
  getHighestPlan,
  getPlanLimits,
  planLimitMessage,
} from '../common/plan-limits'

const ORG_SELECT = {
  id: true,
  name: true,
  type: true,
  logo: true,
  created_at: true,
  updated_at: true,
  merchants: {
    select: {
      id: true,
      business_name: true,
      slug: true,
      verification_status: true,
      subscription_plan: true,
    },
    orderBy: { created_at: 'asc' as const },
  },
} as const

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOrgAllowed(userId: string) {
    const merchants = await this.prisma.merchant.findMany({
      where: { owner_id: userId },
      select: { subscription_plan: true },
    })
    const plan = getHighestPlan(merchants)
    const limits = getPlanLimits(plan)
    if (!limits.orgAllowed) {
      throw new ForbiddenException(planLimitMessage('organization', plan))
    }
    return plan
  }

  private async resolveOrg(userId: string, orgId?: string) {
    const org = await this.prisma.merchantOrganization.findFirst({
      where: orgId ? { id: orgId, owner_id: userId } : { owner_id: userId },
      select: ORG_SELECT,
    })
    if (!org) throw new NotFoundException('Organisation introuvable')
    return org
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    await this.assertOrgAllowed(userId)

    const existing = await this.prisma.merchantOrganization.findUnique({
      where: { owner_id: userId },
    })
    if (existing) {
      throw new BadRequestException('Vous avez déjà une organisation. Modifiez-la ou rattachez vos établissements.')
    }

    return this.prisma.merchantOrganization.create({
      data: {
        name: dto.name,
        type: dto.type,
        logo: dto.logo ?? null,
        owner_id: userId,
      },
      select: ORG_SELECT,
    })
  }

  async findMine(userId: string) {
    const org = await this.prisma.merchantOrganization.findUnique({
      where: { owner_id: userId },
      select: ORG_SELECT,
    })
    return org
  }

  async update(userId: string, orgId: string, dto: UpdateOrganizationDto) {
    await this.resolveOrg(userId, orgId)
    return this.prisma.merchantOrganization.update({
      where: { id: orgId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
      },
      select: ORG_SELECT,
    })
  }

  async attachMerchant(userId: string, orgId: string, merchantId: string) {
    await this.assertOrgAllowed(userId)
    const org = await this.resolveOrg(userId, orgId)

    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    if (merchant.organization_id && merchant.organization_id !== orgId) {
      throw new BadRequestException('Cet établissement appartient déjà à une autre organisation')
    }

    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: { organization_id: orgId },
      select: {
        id: true,
        business_name: true,
        slug: true,
        organization_id: true,
      },
    })
  }

  async detachMerchant(userId: string, orgId: string, merchantId: string) {
    await this.resolveOrg(userId, orgId)

    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, owner_id: userId, organization_id: orgId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable dans cette organisation')

    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: { organization_id: null },
      select: {
        id: true,
        business_name: true,
        slug: true,
        organization_id: true,
      },
    })
  }

  async getAnalytics(userId: string, orgId: string) {
    const org = await this.resolveOrg(userId, orgId)
    const merchantIds = org.merchants.map(m => m.id)

    if (!merchantIds.length) {
      return {
        organization: { id: org.id, name: org.name, type: org.type },
        totals: {
          views: 0,
          whatsapp_clicks: 0,
          call_clicks: 0,
          favorites: 0,
          reviews: { count: 0, avg_rating: null },
          interactions: [] as Array<{ event_type: string; count: number }>,
        },
        by_merchant: [],
      }
    }

    const [interactions, reviewStats, favoritesCount, perMerchant] = await Promise.all([
      this.prisma.merchantInteraction.groupBy({
        by: ['event_type'],
        where: { merchant_id: { in: merchantIds } },
        _count: { event_type: true },
      }),
      this.prisma.review.aggregate({
        where: { merchant_id: { in: merchantIds }, status: 'APPROVED' },
        _count: true,
        _avg: { rating: true },
      }),
      this.prisma.favorite.count({ where: { merchant_id: { in: merchantIds } } }),
      Promise.all(
        org.merchants.map(async m => {
          const [views, whatsapp, calls] = await Promise.all([
            this.prisma.merchantInteraction.count({
              where: { merchant_id: m.id, event_type: 'VIEW' },
            }),
            this.prisma.merchantInteraction.count({
              where: { merchant_id: m.id, event_type: 'WHATSAPP_CLICK' },
            }),
            this.prisma.merchantInteraction.count({
              where: { merchant_id: m.id, event_type: 'CALL_CLICK' },
            }),
          ])
          return {
            merchant_id: m.id,
            business_name: m.business_name,
            slug: m.slug,
            views,
            whatsapp_clicks: whatsapp,
            call_clicks: calls,
          }
        }),
      ),
    ])

    const views = interactions.find(i => i.event_type === 'VIEW')?._count.event_type ?? 0
    const whatsappClicks = interactions.find(i => i.event_type === 'WHATSAPP_CLICK')?._count.event_type ?? 0
    const callClicks = interactions.find(i => i.event_type === 'CALL_CLICK')?._count.event_type ?? 0

    return {
      organization: { id: org.id, name: org.name, type: org.type },
      totals: {
        views,
        whatsapp_clicks: whatsappClicks,
        call_clicks: callClicks,
        favorites: favoritesCount,
        reviews: {
          count: reviewStats._count,
          avg_rating: reviewStats._avg.rating
            ? Math.round(reviewStats._avg.rating * 10) / 10
            : null,
        },
        interactions: interactions.map(i => ({
          event_type: i.event_type,
          count: i._count.event_type,
        })),
      },
      by_merchant: perMerchant,
    }
  }

  async getAnalyticsChart(userId: string, orgId: string, days = 30, eventType = 'VIEW') {
    const org = await this.resolveOrg(userId, orgId)
    const merchantIds = org.merchants.map(m => m.id)
    if (!merchantIds.length) {
      const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? Math.floor(days) : 30
      const since = new Date()
      since.setDate(since.getDate() - safeDays + 1)
      since.setHours(0, 0, 0, 0)
      const emptyDays: Array<{ date: string; count: number }> = []
      for (let d = 0; d < safeDays; d++) {
        const dt = new Date(since)
        dt.setDate(since.getDate() + d)
        emptyDays.push({ date: dt.toISOString().slice(0, 10), count: 0 })
      }
      return {
        days: emptyDays,
        total: 0,
        period_days: safeDays,
        event_type: eventType,
      }
    }

    const validEvents = [
      'VIEW', 'CALL_CLICK', 'WHATSAPP_CLICK',
      'DIRECTION_CLICK', 'WEBSITE_CLICK', 'SAVE', 'REVIEW', 'SHARE',
    ]
    const event = validEvents.includes(eventType) ? eventType : 'VIEW'
    const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? Math.floor(days) : 30

    const since = new Date()
    since.setDate(since.getDate() - safeDays + 1)
    since.setHours(0, 0, 0, 0)

    const interactions = await this.prisma.merchantInteraction.findMany({
      where: {
        merchant_id: { in: merchantIds },
        event_type: event as never,
        created_at: { gte: since },
      },
      select: { created_at: true },
    })

    const byDay: Record<string, number> = {}
    for (let d = 0; d < safeDays; d++) {
      const dt = new Date(since)
      dt.setDate(since.getDate() + d)
      byDay[dt.toISOString().slice(0, 10)] = 0
    }
    for (const row of interactions) {
      const key = row.created_at.toISOString().slice(0, 10)
      if (key in byDay) byDay[key]++
    }

    return {
      days: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      total: interactions.length,
      period_days: safeDays,
      event_type: event,
    }
  }
}
