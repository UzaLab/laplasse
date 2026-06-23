import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPlanLimits } from '../common/plan-limits'
import { AuditService } from '../audit/audit.service'
import { AD_CAMPAIGN_PRICES, AD_DURATION_OPTIONS, computeCampaignAmount } from './ad-pricing'
import { CreateAdCampaignDto } from './dto/ad.dto'
import { AdPlacement, AdTargetType } from '../../generated/prisma/client'
import {
  ALL_AD_PLACEMENTS,
  DEFAULT_PLACEMENT_CAPACITY,
} from './ad-capacity'
import {
  assertPlacementForTarget,
  discoveryPlacement,
  PLACEMENT_LABELS,
  PLACEMENTS_BY_TARGET,
} from './ad-placements'

type ResolvedTarget = {
  ownerId: string
  merchantId: string | null
  shopId: string | null
  productId: string | null
  targetType: AdTargetType
}

export type PlacementAvailability = {
  placement: AdPlacement
  capacity: number
  active: number
  waitlist: number
  available_slots: number
  is_saturated: boolean
}


@Injectable()
export class AdsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdsService.name)
  private expireTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    const pollMs = 60 * 60 * 1000
    void this.expireCampaigns().catch(err => {
      this.logger.warn(`Expire campaigns on boot failed: ${(err as Error).message}`)
    })
    this.expireTimer = setInterval(() => {
      void this.expireCampaigns().catch(err => {
        this.logger.warn(`Expire campaigns poll failed: ${(err as Error).message}`)
      })
    }, pollMs)
  }

  onModuleDestroy() {
    if (this.expireTimer) clearInterval(this.expireTimer)
  }

  private activeCampaignWhere(placement: AdPlacement, now = new Date()) {
    return {
      placement,
      status: 'ACTIVE' as const,
      starts_at: { lte: now },
      ends_at: { gte: now },
    }
  }

  async getPlacementCapacity(placement: AdPlacement): Promise<number> {
    if (placement === 'MARKETPLACE') {
      const row = await this.prisma.platformSetting.findUnique({
        where: { key: 'marketplace_spotlight_limit' },
      })
      const parsed = Number(row?.value ?? DEFAULT_PLACEMENT_CAPACITY.MARKETPLACE)
      if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_PLACEMENT_CAPACITY.MARKETPLACE
      return Math.min(Math.floor(parsed), 20)
    }
    return DEFAULT_PLACEMENT_CAPACITY[placement]
  }

  async getPlacementAvailability(placement: AdPlacement): Promise<PlacementAvailability> {
    await this.expireCampaigns()
    const now = new Date()
    const capacity = await this.getPlacementCapacity(placement)
    const [active, waitlist] = await Promise.all([
      this.prisma.adCampaign.count({ where: this.activeCampaignWhere(placement, now) }),
      this.prisma.adCampaign.count({
        where: { placement, status: 'WAITLISTED' },
      }),
    ])
    const available_slots = Math.max(0, capacity - active)
    return {
      placement,
      capacity,
      active,
      waitlist,
      available_slots,
      is_saturated: available_slots <= 0,
    }
  }

  async getAllPlacementAvailability(): Promise<Record<AdPlacement, PlacementAvailability>> {
    const entries = await Promise.all(
      ALL_AD_PLACEMENTS.map(async p => [p, await this.getPlacementAvailability(p)] as const),
    )
    return Object.fromEntries(entries) as Record<AdPlacement, PlacementAvailability>
  }

  private async refreshWaitlistPositions(placement: AdPlacement) {
    const rows = await this.prisma.adCampaign.findMany({
      where: { placement, status: 'WAITLISTED' },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    })
    await Promise.all(
      rows.map((row, index) =>
        this.prisma.adCampaign.update({
          where: { id: row.id },
          data: { waitlist_position: index + 1 },
        }),
      ),
    )
  }

  private async promoteWaitlistForPlacement(placement: AdPlacement) {
    const capacity = await this.getPlacementCapacity(placement)
    let availability = await this.getPlacementAvailability(placement)

    while (availability.available_slots > 0) {
      const next = await this.prisma.adCampaign.findFirst({
        where: { placement, status: 'WAITLISTED' },
        orderBy: { created_at: 'asc' },
      })
      if (!next) break

      const reference = `LP-AD-${Date.now().toString(36).toUpperCase()}`
      const startsAt = new Date()
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + next.duration_days)

      const payment = await this.prisma.paymentTransaction.create({
        data: {
          user_id: next.owner_id,
          merchant_id: next.merchant_id,
          shop_id: next.shop_id,
          purpose: 'AD_CAMPAIGN',
          amount: next.amount,
          reference,
          metadata: {
            placement: next.placement,
            target_type: next.target_type,
            duration_days: next.duration_days,
            product_id: next.product_id,
            from_waitlist: true,
          },
        },
      })

      await this.prisma.adCampaign.update({
        where: { id: next.id },
        data: {
          status: 'PENDING_PAYMENT',
          payment_id: payment.id,
          waitlist_position: null,
          starts_at: startsAt,
          ends_at: endsAt,
        },
      })

      this.logger.log(
        `Campagne ${next.id} promue depuis la file (${PLACEMENT_LABELS[placement]}) → paiement ${payment.reference}`,
      )

      availability = await this.getPlacementAvailability(placement)
      if (availability.active >= capacity) break
    }

    await this.refreshWaitlistPositions(placement)
  }

  private async promoteWaitlist() {
    for (const placement of ALL_AD_PLACEMENTS) {
      await this.promoteWaitlistForPlacement(placement)
    }
  }

  private async assertAdsPlan(userId: string, merchantId?: string | null, shopId?: string | null) {
    if (merchantId) {
      const merchant = await this.prisma.merchant.findFirst({
        where: { id: merchantId, owner_id: userId },
      })
      if (merchant && getPlanLimits(merchant.subscription_plan).adsSelfService) {
        return merchant
      }
    }

    if (shopId) {
      const shop = await this.prisma.shop.findFirst({
        where: {
          id: shopId,
          owner_id: userId,
          merchant_id: null,
          status: 'ACTIVE',
          is_active: true,
        },
      })
      if (shop) return shop
    }

    const merchants = await this.prisma.merchant.findMany({
      where: { owner_id: userId },
      select: { subscription_plan: true },
    })
    const allowed = merchants.some(m => getPlanLimits(m.subscription_plan).adsSelfService)
    if (!allowed) {
      throw new ForbiddenException('Les campagnes publicitaires nécessitent le plan Growth ou supérieur.')
    }
    return merchants[0] ?? null
  }

  async getPricing() {
    const placement_availability = await this.getAllPlacementAvailability()
    return {
      prices: AD_CAMPAIGN_PRICES,
      durations: AD_DURATION_OPTIONS,
      placements_by_target: PLACEMENTS_BY_TARGET,
      placement_availability,
    }
  }

  async getEligibility(userId: string, merchantId?: string, shopId?: string) {
    await this.assertAdsPlan(userId, merchantId, shopId)

    const merchant = merchantId
      ? await this.prisma.merchant.findFirst({
          where: { id: merchantId, owner_id: userId },
          select: {
            id: true,
            business_name: true,
            slug: true,
            verification_status: true,
            is_active: true,
            logo: true,
          },
        })
      : shopId
        ? null
        : await this.prisma.merchant.findFirst({
            where: { owner_id: userId },
            select: {
              id: true,
              business_name: true,
              slug: true,
              verification_status: true,
              is_active: true,
              logo: true,
            },
          })

    const shops = await this.prisma.shop.findMany({
      where: {
        owner_id: userId,
        ...(shopId ? { id: shopId } : {}),
        ...(merchantId && !shopId ? { merchant_id: merchantId } : {}),
        ...(shopId && !merchantId ? { merchant_id: null } : {}),
        status: 'ACTIVE',
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        merchant_id: true,
        _count: { select: { products: { where: { status: 'ACTIVE', stock_quantity: { gt: 0 } } } } },
      },
    })

    const shopIds = shops.map(s => s.id)
    const products = shopIds.length
      ? await this.prisma.product.findMany({
          where: {
            shop_id: { in: shopIds },
            status: 'ACTIVE',
            stock_quantity: { gt: 0 },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            currency: true,
            image_url: true,
            shop_id: true,
            shop: { select: { name: true, slug: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 100,
        })
      : []

    const merchantPayload = merchant
      ? {
          ...merchant,
          eligible: merchant.is_active && merchant.verification_status === 'VERIFIED',
        }
      : null

    const shopsPayload = shops.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      merchant_id: s.merchant_id,
      active_products: s._count.products,
      eligible: s._count.products > 0,
    }))

    const productsPayload = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      currency: p.currency,
      image_url: p.image_url,
      shop_id: p.shop_id,
      shop_name: p.shop.name,
      shop_slug: p.shop.slug,
    }))

    const suggestions = await this.buildSuggestions(
      userId,
      merchantPayload,
      shopsPayload,
      productsPayload,
    )

    return {
      merchant: merchantPayload,
      shops: shopsPayload,
      products: productsPayload,
      suggestions,
      placement_availability: await this.getAllPlacementAvailability(),
    }
  }

  private async buildSuggestions(
    userId: string,
    merchant: { id: string; business_name: string; eligible: boolean } | null,
    shops: Array<{ id: string; name: string; eligible: boolean }>,
    products: Array<{ id: string; name: string }>,
  ) {
    const now = new Date()
    const active = await this.prisma.adCampaign.findMany({
      where: {
        owner_id: userId,
        OR: [
          { status: 'WAITLISTED' },
          { status: 'PENDING_PAYMENT' },
          { status: 'ACTIVE', ends_at: { gte: now } },
        ],
      },
      select: {
        target_type: true,
        placement: true,
        shop_id: true,
        product_id: true,
        merchant_id: true,
      },
    })

    type Suggestion = {
      target_type: AdTargetType
      placement: AdPlacement
      target_id: string
      label: string
      message: string
    }

    const suggestions: Suggestion[] = []

    const hasCampaign = (
      targetType: AdTargetType,
      placement: AdPlacement,
      targetId: string,
    ) =>
      active.some(c => {
        if (c.placement !== placement || c.target_type !== targetType) return false
        if (targetType === 'MERCHANT') return c.merchant_id === targetId
        if (targetType === 'SHOP') return c.shop_id === targetId
        return c.product_id === targetId
      })

    if (
      merchant?.eligible &&
      !hasCampaign('MERCHANT', 'SEARCH', merchant.id)
    ) {
      suggestions.push({
        target_type: 'MERCHANT',
        placement: 'SEARCH',
        target_id: merchant.id,
        label: merchant.business_name,
        message: 'Apparaissez en tête des résultats de recherche.',
      })
    }

    for (const shop of shops.filter(s => s.eligible)) {
      if (!hasCampaign('SHOP', 'MARKETPLACE', shop.id)) {
        suggestions.push({
          target_type: 'SHOP',
          placement: 'MARKETPLACE',
          target_id: shop.id,
          label: shop.name,
          message: 'Intégrez votre boutique au carousel « Boutiques à la une ».',
        })
      }
    }

    for (const product of products) {
      if (!hasCampaign('PRODUCT', 'MARKETPLACE_FEATURED_PRODUCTS', product.id)) {
        suggestions.push({
          target_type: 'PRODUCT',
          placement: 'MARKETPLACE_FEATURED_PRODUCTS',
          target_id: product.id,
          label: product.name,
          message: `Mettez « ${product.name} » en avant sur la homepage marketplace.`,
        })
      }
      if (suggestions.length >= 5) break
    }

    return suggestions.slice(0, 5)
  }

  async listCampaigns(userId: string, merchantId?: string, shopId?: string) {
    await this.expireCampaigns()
    const or: Array<Record<string, string>> = [{ owner_id: userId }]
    if (merchantId) or.push({ merchant_id: merchantId })
    if (shopId) or.push({ shop_id: shopId })

    return this.prisma.adCampaign.findMany({
      where: { OR: or },
      orderBy: { created_at: 'desc' },
      include: {
        shop: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, name: true, slug: true, image_url: true } },
        merchant: { select: { id: true, business_name: true, slug: true } },
      },
    })
  }

  async getCampaignStats(userId: string, merchantId?: string, shopId?: string) {
    const campaigns = await this.listCampaigns(userId, merchantId, shopId)
    const scoped = campaigns

    const totals = scoped.reduce(
      (acc, c) => {
        acc.impressions += c.impressions
        acc.clicks += c.clicks
        if (c.status === 'ACTIVE') acc.active += 1
        if (c.status === 'WAITLISTED') acc.waitlisted += 1
        if (['ACTIVE', 'EXPIRED', 'PENDING_PAYMENT'].includes(c.status)) {
          acc.spent += c.amount
        }
        return acc
      },
      { impressions: 0, clicks: 0, active: 0, waitlisted: 0, spent: 0, campaigns: scoped.length },
    )

    const ctr =
      totals.impressions > 0
        ? Number(((totals.clicks / totals.impressions) * 100).toFixed(1))
        : null

    const by_placement = ALL_AD_PLACEMENTS.reduce(
      (acc, placement) => {
        const rows = scoped.filter(c => c.placement === placement)
        acc[placement] = {
          campaigns: rows.length,
          active: rows.filter(c => c.status === 'ACTIVE').length,
          waitlisted: rows.filter(c => c.status === 'WAITLISTED').length,
          impressions: rows.reduce((s, c) => s + c.impressions, 0),
          clicks: rows.reduce((s, c) => s + c.clicks, 0),
        }
        return acc
      },
      {} as Record<
        AdPlacement,
        { campaigns: number; active: number; waitlisted: number; impressions: number; clicks: number }
      >,
    )

    return {
      totals: { ...totals, ctr },
      by_placement,
      campaigns: scoped.map(c => ({
        id: c.id,
        status: c.status,
        placement: c.placement,
        target_type: c.target_type,
        impressions: c.impressions,
        clicks: c.clicks,
        ctr: c.impressions > 0 ? Number(((c.clicks / c.impressions) * 100).toFixed(1)) : null,
        amount: c.amount,
        waitlist_position: c.waitlist_position,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
      })),
    }
  }

  private async resolveTarget(
    userId: string,
    dto: CreateAdCampaignDto,
    merchantId?: string,
    shopId?: string,
  ): Promise<ResolvedTarget> {
    const targetType = dto.target_type ?? 'MERCHANT'
    try {
      assertPlacementForTarget(targetType, dto.placement)
    } catch {
      throw new BadRequestException('Emplacement incompatible avec le type de cible')
    }

    if (targetType === 'MERCHANT') {
      const merchant = await this.prisma.merchant.findFirst({
        where: merchantId
          ? { id: merchantId, owner_id: userId }
          : dto.target_id
            ? { id: dto.target_id, owner_id: userId }
            : { owner_id: userId },
      })
      if (!merchant) throw new NotFoundException('Établissement introuvable')
      if (!getPlanLimits(merchant.subscription_plan).adsSelfService) {
        throw new ForbiddenException('Plan Growth requis pour les campagnes publicitaires.')
      }
      if (!merchant.is_active) throw badRequest('Établissement inactif')
      if (merchant.verification_status !== 'VERIFIED') {
        throw new BadRequestException('Votre établissement doit être vérifié pour sponsoriser votre fiche.')
      }
      return {
        ownerId: userId,
        merchantId: merchant.id,
        shopId: null,
        productId: null,
        targetType,
      }
    }

    await this.assertAdsPlan(userId, merchantId, shopId)

    if (targetType === 'SHOP') {
      const id = dto.target_id ?? shopId
      if (!id) throw new BadRequestException('Boutique requise')
      const shop = await this.prisma.shop.findFirst({
        where: { id, owner_id: userId },
        include: {
          _count: { select: { products: { where: { status: 'ACTIVE', stock_quantity: { gt: 0 } } } } },
        },
      })
      if (!shop) throw new NotFoundException('Boutique introuvable')
      if (shop.status !== 'ACTIVE' || !shop.is_active) {
        throw new BadRequestException('La boutique doit être active')
      }
      if (shop._count.products < 1) {
        throw new BadRequestException('Ajoutez au moins un produit actif en stock')
      }
      return {
        ownerId: userId,
        merchantId: shop.merchant_id,
        shopId: shop.id,
        productId: null,
        targetType,
      }
    }

    const productId = dto.target_id
    if (!productId) throw new BadRequestException('Produit requis')
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
        stock_quantity: { gt: 0 },
        shop: { owner_id: userId, status: 'ACTIVE', is_active: true },
      },
      include: { shop: { select: { id: true, merchant_id: true } } },
    })
    if (!product) throw new NotFoundException('Produit introuvable ou indisponible')
    return {
      ownerId: userId,
      merchantId: product.shop.merchant_id,
      shopId: product.shop.id,
      productId: product.id,
      targetType,
    }
  }

  private async assertNoConflictingCampaign(target: ResolvedTarget, placement: AdPlacement) {
    const now = new Date()
    const targetFilter: Record<string, unknown> = {
      placement,
      target_type: target.targetType,
      OR: [
        { status: 'WAITLISTED' as const },
        { status: 'PENDING_PAYMENT' as const },
        { status: 'ACTIVE' as const, ends_at: { gte: now } },
      ],
    }
    if (target.targetType === 'MERCHANT') targetFilter.merchant_id = target.merchantId
    if (target.targetType === 'SHOP') targetFilter.shop_id = target.shopId
    if (target.targetType === 'PRODUCT') targetFilter.product_id = target.productId

    const existing = await this.prisma.adCampaign.count({ where: targetFilter as never })
    if (existing > 0) {
      throw new ConflictException(
        'Une campagne active, en attente de paiement ou en file d\'attente existe déjà pour cette cible et cet emplacement.',
      )
    }
  }

  async createCampaign(
    userId: string,
    dto: CreateAdCampaignDto,
    merchantId?: string,
    shopId?: string,
  ) {
    const target = await this.resolveTarget(userId, dto, merchantId, shopId)
    await this.assertNoConflictingCampaign(target, dto.placement)

    const amount = computeCampaignAmount(target.targetType, dto.placement, dto.duration_days)
    if (!amount) throw new BadRequestException('Durée ou placement invalide')

    const mode = dto.mode ?? 'immediate'
    const availability = await this.getPlacementAvailability(dto.placement)

    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + dto.duration_days)

    if (mode === 'waitlist') {
      const campaign = await this.prisma.adCampaign.create({
        data: {
          owner_id: target.ownerId,
          merchant_id: target.merchantId,
          shop_id: target.shopId,
          product_id: target.productId,
          target_type: target.targetType,
          placement: dto.placement,
          status: 'WAITLISTED',
          amount,
          duration_days: dto.duration_days,
          starts_at: startsAt,
          ends_at: endsAt,
        },
      })
      await this.refreshWaitlistPositions(dto.placement)
      const updated = await this.prisma.adCampaign.findUnique({ where: { id: campaign.id } })
      const refreshedAvailability = await this.getPlacementAvailability(dto.placement)
      return {
        campaign: updated ?? campaign,
        waitlist: true,
        waitlist_position: updated?.waitlist_position ?? null,
        availability: refreshedAvailability,
      }
    }

    if (availability.is_saturated) {
      throw new ConflictException({
        code: 'PLACEMENT_SATURATED',
        message: `L'emplacement « ${PLACEMENT_LABELS[dto.placement]} » est complet (${availability.active}/${availability.capacity} places). Rejoignez la file d'attente pour être prévenu dès qu'une place se libère.`,
        availability,
      })
    }

    const reference = `LP-AD-${Date.now().toString(36).toUpperCase()}`

    const [campaign, payment] = await this.prisma.$transaction([
      this.prisma.adCampaign.create({
        data: {
          owner_id: target.ownerId,
          merchant_id: target.merchantId,
          shop_id: target.shopId,
          product_id: target.productId,
          target_type: target.targetType,
          placement: dto.placement,
          status: 'PENDING_PAYMENT',
          amount,
          duration_days: dto.duration_days,
          starts_at: startsAt,
          ends_at: endsAt,
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          user_id: userId,
          merchant_id: target.merchantId,
          shop_id: target.shopId,
          purpose: 'AD_CAMPAIGN',
          amount,
          reference,
          metadata: {
            placement: dto.placement,
            target_type: target.targetType,
            duration_days: dto.duration_days,
            product_id: target.productId,
          },
        },
      }),
    ])

    await this.prisma.adCampaign.update({
      where: { id: campaign.id },
      data: { payment_id: payment.id },
    })

    return {
      campaign: { ...campaign, payment_id: payment.id },
      payment: { id: payment.id, reference: payment.reference, amount: payment.amount },
      availability,
    }
  }

  async cancelWaitlist(userId: string, campaignId: string) {
    const campaign = await this.prisma.adCampaign.findFirst({
      where: { id: campaignId, owner_id: userId, status: 'WAITLISTED' },
    })
    if (!campaign) throw new NotFoundException('Campagne en file d\'attente introuvable')

    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED', waitlist_position: null },
    })
    await this.refreshWaitlistPositions(campaign.placement)
    return { ok: true }
  }

  async confirmAdPayment(userId: string, paymentId: string, simulateResult: 'success' | 'failure') {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: paymentId, user_id: userId, purpose: 'AD_CAMPAIGN' },
    })
    if (!payment) throw new NotFoundException('Paiement introuvable')
    if (payment.status !== 'PENDING') throw new BadRequestException('Paiement déjà traité')

    const campaign = await this.prisma.adCampaign.findFirst({
      where: { payment_id: paymentId },
    })
    if (!campaign) throw new NotFoundException('Campagne introuvable')

    if (simulateResult === 'failure') {
      await this.prisma.$transaction([
        this.prisma.paymentTransaction.update({ where: { id: paymentId }, data: { status: 'FAILED' } }),
        this.prisma.adCampaign.update({ where: { id: campaign.id }, data: { status: 'CANCELLED' } }),
      ])
      await this.refreshWaitlistPositions(campaign.placement)
      await this.promoteWaitlistForPlacement(campaign.placement)
      return { status: 'FAILED' }
    }

    const availability = await this.getPlacementAvailability(campaign.placement)
    if (availability.is_saturated) {
      throw new ConflictException({
        code: 'PLACEMENT_SATURATED',
        message: 'L\'emplacement est devenu complet avant validation du paiement. Réessayez plus tard ou contactez le support.',
        availability,
      })
    }

    const now = new Date()
    const startsAt = new Date()
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + campaign.duration_days)

    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: paymentId },
        data: { status: 'SUCCESS', paid_at: now },
      }),
      this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'ACTIVE',
          starts_at: startsAt,
          ends_at: endsAt,
          waitlist_position: null,
        },
      }),
    ])

    if (campaign.merchant_id && discoveryPlacement(campaign.placement)) {
      await this.syncDiscoverySponsored(campaign.merchant_id)
    }

    await this.audit.log({
      userId,
      action: 'PAYMENT',
      entityType: 'AdCampaign',
      entityId: campaign.id,
      payload: {
        amount: payment.amount,
        placement: campaign.placement,
        target_type: campaign.target_type,
      },
    })

    return { status: 'SUCCESS', campaign }
  }

  async recordEvent(campaignId: string, event: 'impression' | 'click') {
    const campaign = await this.prisma.adCampaign.findFirst({
      where: { id: campaignId, status: 'ACTIVE', ends_at: { gte: new Date() } },
    })
    if (!campaign) return { ok: false }

    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: event === 'click' ? { clicks: { increment: 1 } } : { impressions: { increment: 1 } },
    })
    return { ok: true }
  }

  private async syncDiscoverySponsored(merchantId: string) {
    const now = new Date()
    const hasDiscovery = await this.prisma.adCampaign.count({
      where: {
        merchant_id: merchantId,
        status: 'ACTIVE',
        ends_at: { gte: now },
        placement: { in: ['SEARCH', 'FEATURED', 'CATEGORY'] },
      },
    })
    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { is_sponsored: hasDiscovery > 0 },
    })
  }

  async expireCampaigns() {
    const now = new Date()
    const expired = await this.prisma.adCampaign.findMany({
      where: { status: 'ACTIVE', ends_at: { lt: now } },
      select: { id: true, merchant_id: true, placement: true },
    })
    for (const c of expired) {
      await this.prisma.adCampaign.update({ where: { id: c.id }, data: { status: 'EXPIRED' } })
      if (c.merchant_id && discoveryPlacement(c.placement)) {
        await this.syncDiscoverySponsored(c.merchant_id)
      }
    }
    if (expired.length > 0) {
      await this.promoteWaitlist()
    }
  }

  async getActiveCampaignTargets(placement: AdPlacement) {
    await this.expireCampaigns()
    const now = new Date()
    return this.prisma.adCampaign.findMany({
      where: this.activeCampaignWhere(placement, now),
      select: {
        id: true,
        target_type: true,
        merchant_id: true,
        shop_id: true,
        product_id: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async getActiveMerchantIdsForPlacement(placement: AdPlacement): Promise<Set<string>> {
    await this.expireCampaigns()
    const now = new Date()
    const rows = await this.prisma.adCampaign.findMany({
      where: {
        ...this.activeCampaignWhere(placement, now),
        target_type: 'MERCHANT',
        merchant_id: { not: null },
      },
      select: { merchant_id: true },
    })
    return new Set(rows.map(r => r.merchant_id!).filter(Boolean))
  }

  async getActiveShopIdsForPlacement(placement: AdPlacement): Promise<Set<string>> {
    await this.expireCampaigns()
    const now = new Date()
    const rows = await this.prisma.adCampaign.findMany({
      where: {
        ...this.activeCampaignWhere(placement, now),
        target_type: 'SHOP',
        shop_id: { not: null },
      },
      select: { shop_id: true },
    })
    return new Set(rows.map(r => r.shop_id!).filter(Boolean))
  }

  async getActiveProductIdsForPlacement(placement: AdPlacement): Promise<string[]> {
    await this.expireCampaigns()
    const now = new Date()
    const capacity = await this.getPlacementCapacity(placement)
    const rows = await this.prisma.adCampaign.findMany({
      where: {
        ...this.activeCampaignWhere(placement, now),
        target_type: 'PRODUCT',
        product_id: { not: null },
      },
      select: { product_id: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: capacity,
    })
    return rows.map(r => r.product_id!).filter(Boolean)
  }

  /** @deprecated Utiliser getActiveMerchantIdsForPlacement */
  async getActiveSponsoredMerchantIds(): Promise<Set<string>> {
    return this.getActiveMerchantIdsForPlacement('SEARCH')
  }
}

function badRequest(message: string): BadRequestException {
  return new BadRequestException(message)
}
