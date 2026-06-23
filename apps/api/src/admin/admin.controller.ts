import { Controller, Get, Patch, Post, Param, Body, UseGuards, Query, NotFoundException, BadRequestException } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { ComplaintsService } from '../complaints/complaints.service'
import { SearchService } from '../search/search.service'
import { MerchantsService } from '../merchants/merchants.service'
import { NotificationsService } from '../notifications/notifications.service'
import { AuditService } from '../audit/audit.service'
import { MarketplaceService } from '../marketplace/marketplace.service'
import { ProductCategoriesService } from '../marketplace/product-categories.service'
import { GeoService } from '../geo/geo.service'
import { AdminSeedService } from './admin-seed.service'
import { CourierReviewsService } from '../couriers/courier-reviews.service'
import { DeliveryDisputesService } from '../delivery/delivery-disputes.service'
import { DeliveryService } from '../delivery/delivery.service'
import { LogisticsPartnersService } from '../logistics/logistics-partners.service'
import { CourierStatus, DeliveryDisputeStatus } from '../../generated/prisma/client'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complaintsService: ComplaintsService,
    private readonly searchService: SearchService,
    private readonly merchantsService: MerchantsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly marketplace: MarketplaceService,
    private readonly productCategories: ProductCategoriesService,
    private readonly geo: GeoService,
    private readonly adminSeed: AdminSeedService,
    private readonly courierReviews: CourierReviewsService,
    private readonly deliveryDisputes: DeliveryDisputesService,
    private readonly deliveryService: DeliveryService,
    private readonly logisticsPartners: LogisticsPartnersService,
  ) {}

  // ── Stats globales ──────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const [merchantTotal, merchantPending, merchantVerified, users, reviewTotal, reviewPending, productReviewPending, complaintOpen, courierReviewPending, courierPendingKyc] =
      await Promise.all([
        this.prisma.merchant.count(),
        this.prisma.merchant.count({ where: { verification_status: 'PENDING' } }),
        this.prisma.merchant.count({ where: { verification_status: 'VERIFIED' } }),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.review.count(),
        this.prisma.review.count({ where: { status: 'PENDING' } }),
        this.prisma.productReview.count({ where: { status: 'PENDING' } }),
        this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
        this.prisma.courierReview.count({ where: { status: 'PENDING' } }),
        this.prisma.courierProfile.count({ where: { status: 'PENDING_REVIEW' } }),
      ])

    return {
      merchants: { total: merchantTotal, pending: merchantPending, verified: merchantVerified },
      users,
      reviews: { total: reviewTotal, pending: reviewPending },
      product_reviews: { pending: productReviewPending },
      courier_reviews: { pending: courierReviewPending },
      couriers: { pending_kyc: courierPendingKyc },
      complaints: { open: complaintOpen },
    }
  }

  // ── Marchands ───────────────────────────────────────────────────────────────

  @Get('merchants')
  getMerchants(
    @Query('filter') filter?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const where = filter === 'pending' ? { verification_status: 'PENDING' as const } : {}
    return this.prisma.merchant.findMany({
      where,
      select: {
        id: true, business_name: true, slug: true, verification_status: true,
        is_active: true, is_sponsored: true, subscription_plan: true,
        created_at: true, trust_score: true,
        category: { select: { name: true } },
        location: { select: { city: true, district: true } },
        owner: { select: { id: true, email: true, full_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: Number(limit ?? 20),
      skip: Number(offset ?? 0),
    })
  }

  @Patch('merchants/:id/verify')
  async verifyMerchant(
    @Param('id') id: string,
    @Body() body: { status: string; trust_score?: number },
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        verification_status: body.status as never,
        trust_score: body.trust_score ?? undefined,
        is_active: body.status === 'VERIFIED',
      },
      select: {
        id: true, business_name: true, verification_status: true, is_active: true,
        owner_id: true,
      },
    })
    // Sync Meilisearch après changement de statut
    this.searchService.syncMerchant(id).catch(() => {})
    // Notification au propriétaire
    if (body.status === 'VERIFIED') {
      this.notifications.sendMerchantVerified(merchant.owner_id, merchant.business_name).catch(() => {})
    } else if (body.status === 'PENDING') {
      this.notifications.sendMerchantPending(merchant.owner_id, merchant.business_name).catch(() => {})
    }
    return merchant
  }

  @Patch('merchants/:id/sponsor')
  async toggleSponsored(
    @Param('id') id: string,
    @Body() body: { is_sponsored: boolean; subscription_plan?: string },
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        is_sponsored: body.is_sponsored,
        ...(body.subscription_plan ? { subscription_plan: body.subscription_plan as never } : {}),
      },
      select: { id: true, business_name: true, is_sponsored: true, subscription_plan: true },
    })
    this.searchService.syncMerchant(id).catch(() => {})
    return merchant
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────

  @Get('reviews')
  getReviews(@Query('filter') filter?: string) {
    const where = filter === 'pending' ? { status: 'PENDING' as const } : {}
    return this.prisma.review.findMany({
      where,
      include: {
        merchant: { select: { id: true, business_name: true, slug: true } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('reviews/:id')
  moderateReview(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.prisma.review.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, status: true },
    })
  }

  @Patch('reviews/:id/moderate')
  async moderateReviewAction(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    if (body.action === 'delete') {
      await this.prisma.review.delete({ where: { id } })
      return { deleted: true }
    }
    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: body.action === 'approve' ? 'APPROVED' : 'REJECTED' },
      select: {
        id: true, status: true,
        user_id: true,
        merchant: { select: { business_name: true } },
      },
    })
    if (body.action === 'approve') {
      this.notifications.sendReviewApproved(updated.user_id, updated.merchant.business_name).catch(() => {})
    }
    return { id: updated.id, status: updated.status }
  }

  // ── Avis produits ───────────────────────────────────────────────────────────

  @Get('product-reviews')
  getProductReviews(@Query('filter') filter?: string) {
    const where = filter === 'pending' ? { status: 'PENDING' as const } : {}
    return this.prisma.productReview.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true, shop: { select: { slug: true, name: true } } } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('product-reviews/:id/moderate')
  moderateProductReview(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    if (body.action === 'delete') {
      return this.prisma.productReview.delete({ where: { id } }).then(() => ({ deleted: true }))
    }
    return this.prisma.productReview.update({
      where: { id },
      data: { status: body.action === 'approve' ? 'APPROVED' : 'REJECTED' },
      select: { id: true, status: true },
    })
  }

  // ── Signalements ────────────────────────────────────────────────────────────

  @Get('complaints')
  getComplaints(@Query('filter') filter?: string) {
    return this.complaintsService.findAll(filter)
  }

  @Patch('complaints/:id')
  moderateComplaint(
    @Param('id') id: string,
    @Body() body: { action: 'review' | 'resolve' | 'dismiss' },
  ) {
    return this.complaintsService.moderate(id, body.action)
  }

  // ── Utilisateurs ────────────────────────────────────────────────────────────

  @Get('users')
  getUsers(@Query('limit') limit?: string) {
    return this.prisma.user.findMany({
      select: {
        id: true, email: true, full_name: true, role: true,
        is_active: true, is_verified: true, created_at: true,
      },
      orderBy: { created_at: 'desc' },
      take: Number(limit ?? 50),
    })
  }

  @Post('users/set-password')
  async setUserPassword(@Body() body: { email: string; password: string }) {
    const email = body.email?.trim().toLowerCase()
    if (!email || !body.password?.trim()) {
      throw new BadRequestException('Email et mot de passe requis')
    }
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    const password_hash = await hash(body.password, 12)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash, is_verified: true, is_active: true },
    })
    return { ok: true, email: user.email }
  }

  @Post('sync-search')
  async syncSearch() {
    await this.searchService.syncAllMerchants()
    await this.searchService.syncAllProducts()
    return { ok: true, message: 'Meilisearch re-indexé (établissements + produits)' }
  }

  @Post('seed-marketplace')
  async seedMarketplace() {
    const result = await this.marketplace.seedDemoProducts()
    return { ok: true, ...result }
  }

  @Post('seed-multipays')
  async seedMultipays(@Query('country') country?: string) {
    const code = (country ?? 'ALL').toUpperCase()
    if (code !== 'ALL' && code !== 'BF' && code !== 'SN') {
      throw new BadRequestException('country doit être BF, SN ou ALL')
    }
    return this.adminSeed.seedMultipays(code as 'BF' | 'SN' | 'ALL')
  }

  // ── Trust Score ──────────────────────────────────────────────────────────────

  @Post('merchants/:id/trust-score/recalculate')
  async recalculateTrustScore(@Param('id') id: string) {
    const score = await this.merchantsService.recalculateTrustScore(id)
    return { id, trust_score: score }
  }

  @Post('trust-score/recalculate-all')
  async recalculateAllTrustScores() {
    const result = await this.merchantsService.recalculateAllTrustScores()
    return { ok: true, ...result }
  }

  // ── Growth Dashboard (KPIs) ──────────────────────────────────────────────────

  @Get('growth')
  async getGrowthKpis(@Query('days') days?: string) {
    const daysInt = Number(days ?? 30)
    const since = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000)

    const [
      newUsers, newMerchants, totalSearches, newReviews,
      activeMerchants, verifiedMerchants,
      dailyUsers, dailySearches,
    ] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: since } } }),
      this.prisma.merchant.count({ where: { created_at: { gte: since } } }),
      this.prisma.searchHistory.count({ where: { created_at: { gte: since } } }),
      this.prisma.review.count({ where: { created_at: { gte: since }, status: 'APPROVED' } }),
      this.prisma.merchant.count({ where: { is_active: true } }),
      this.prisma.merchant.count({ where: { verification_status: 'VERIFIED' } }),
      // New users per day
      this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE("created_at") as day, COUNT(*) as count
        FROM "User"
        WHERE "created_at" >= ${since}
        GROUP BY DATE("created_at")
        ORDER BY day ASC
      `,
      // Searches per day
      this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE("created_at") as day, COUNT(*) as count
        FROM "SearchHistory"
        WHERE "created_at" >= ${since}
        GROUP BY DATE("created_at")
        ORDER BY day ASC
      `,
    ])

    return {
      period_days: daysInt,
      kpis: {
        new_users: newUsers,
        new_merchants: newMerchants,
        total_searches: totalSearches,
        new_reviews: newReviews,
        active_merchants: activeMerchants,
        verified_merchants: verifiedMerchants,
      },
      charts: {
        daily_users: dailyUsers.map(r => ({ day: r.day, count: Number(r.count) })),
        daily_searches: dailySearches.map(r => ({ day: r.day, count: Number(r.count) })),
      },
    }
  }

  @Get('audit')
  getAuditLogs(@Query('limit') limit?: string) {
    return this.audit.listRecent(limit ? Number(limit) : 50)
  }

  // ── Marketplace spotlight ────────────────────────────────────────────────────

  @Get('marketplace/spotlight')
  async getMarketplaceSpotlightSettings() {
    const limit = await this.marketplace.getMarketplaceSpotlightLimit()
    const featured = await this.prisma.shop.findMany({
      where: { marketplace_featured: true },
      select: { id: true, name: true, slug: true, marketplace_featured: true },
      orderBy: { name: 'asc' },
    })
    return { marketplace_spotlight_limit: limit, featured_shops: featured }
  }

  @Patch('marketplace/spotlight/limit')
  async setMarketplaceSpotlightLimit(@Body() body: { limit: number }) {
    if (body.limit == null || !Number.isFinite(body.limit)) {
      throw new BadRequestException('Limite invalide')
    }
    return this.marketplace.setMarketplaceSpotlightLimit(body.limit)
  }

  @Patch('shops/:id/marketplace-featured')
  async toggleShopMarketplaceFeatured(
    @Param('id') id: string,
    @Body() body: { featured: boolean },
  ) {
    return this.marketplace.setShopMarketplaceFeatured(id, Boolean(body.featured))
  }

  // ── Catégories produit marketplace ───────────────────────────────────────────

  @Get('product-categories')
  listProductCategories() {
    return this.productCategories.listAdmin()
  }

  @Post('product-categories')
  createProductCategory(
    @Body() body: {
      name: string
      slug?: string
      icon?: string
      parent_id?: string
      sort_order?: number
      country_codes?: string[]
    },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Nom requis')
    return this.productCategories.create(body)
  }

  @Patch('product-categories/:id')
  updateProductCategory(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      icon?: string | null
      parent_id?: string | null
      sort_order?: number
      is_active?: boolean
      country_codes?: string[]
    },
  ) {
    return this.productCategories.update(id, body)
  }

  // ── Référentiel géographique ─────────────────────────────────────────────────

  @Get('geo/cities')
  listGeoCities(@Query('country') country?: string) {
    return this.geo.listCitiesAdmin(country ?? 'CI')
  }

  @Get('geo/countries')
  listGeoCountries() {
    return this.geo.listCountriesAdmin()
  }

  @Patch('geo/countries/:code')
  updateGeoCountry(
    @Param('code') code: string,
    @Body() body: { name?: string; latitude?: number | null; longitude?: number | null; is_active?: boolean },
  ) {
    return this.geo.updateCountry(code, body)
  }

  @Post('geo/cities')
  createGeoCity(
    @Body() body: {
      country?: string
      name: string
      slug?: string
      is_default?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Nom requis')
    return this.geo.createCity({
      country: body.country ?? 'CI',
      name: body.name,
      slug: body.slug,
      is_default: body.is_default,
      latitude: body.latitude,
      longitude: body.longitude,
    })
  }

  @Patch('geo/cities/:id')
  updateGeoCity(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      is_active?: boolean
      is_default?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    return this.geo.updateCity(id, body)
  }

  @Get('geo/cities/:cityId/communes')
  listGeoCommunes(@Param('cityId') cityId: string) {
    return this.geo.listCommunesAdmin(cityId)
  }

  @Post('geo/communes')
  createGeoCommune(@Body() body: {
    city_id: string
    name: string
    slug?: string
    latitude?: number | null
    longitude?: number | null
  }) {
    if (!body.city_id || !body.name?.trim()) {
      throw new BadRequestException('Ville et nom requis')
    }
    return this.geo.createCommune(body)
  }

  @Patch('geo/communes/:id')
  updateGeoCommune(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      is_active?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    return this.geo.updateCommune(id, body)
  }

  // ── Livraison (stats ops) ────────────────────────────────────────────────────

  @Get('courier-reviews')
  getCourierReviews(@Query('filter') filter?: string) {
    return this.courierReviews.listForAdmin(filter)
  }

  @Patch('courier-reviews/:id/moderate')
  moderateCourierReview(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    return this.courierReviews.moderate(id, body.action)
  }

  @Get('delivery/disputes')
  getDeliveryDisputes(@Query('filter') filter?: string) {
    return this.deliveryDisputes.listForAdmin(filter)
  }

  @Get('delivery/jobs')
  getDeliveryJobs(@Query('filter') filter?: string) {
    return this.deliveryService.listJobsForAdmin(filter)
  }

  @Patch('delivery/jobs/:id/reassign')
  reassignDeliveryJob(
    @Param('id') id: string,
    @Body() body: { courier_profile_id: string },
  ) {
    return this.deliveryService.reassignJobToCourierProfile(id, body.courier_profile_id)
  }

  @Get('delivery/partners')
  getLogisticsPartners(@Query('filter') filter?: string) {
    return this.logisticsPartners.listForAdmin(filter)
  }

  @Patch('delivery/partners/:id/verify')
  verifyLogisticsPartner(
    @Param('id') id: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED' },
  ) {
    return this.logisticsPartners.verifyPartner(id, body.status)
  }

  @Post('logistics/payouts/:partnerId')
  createLogisticsPayout(
    @Param('partnerId') partnerId: string,
    @Body() body: {
      period_start: string
      period_end: string
      amount: number
      status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
      reference?: string
      note?: string
    },
  ) {
    return this.logisticsPartners.createPartnerPayout(partnerId, body)
  }

  @Get('logistics/payouts/:partnerId')
  listLogisticsPayouts(@Param('partnerId') partnerId: string) {
    return this.logisticsPartners.listPartnerPayouts(partnerId)
  }

  @Patch('delivery/disputes/:id')
  resolveDeliveryDispute(
    @Param('id') id: string,
    @Body() body: { status: DeliveryDisputeStatus; admin_note?: string },
  ) {
    return this.deliveryDisputes.resolve(id, body.status, body.admin_note)
  }

  @Get('couriers')
  getCouriers(
    @Query('filter') filter?: string,
    @Query('country') country?: string,
  ) {
    const countryCode = country?.toUpperCase()
    const where = {
      ...(filter === 'pending' ? { status: 'PENDING_REVIEW' as const } : {}),
      ...(filter === 'suspended' ? { status: 'SUSPENDED' as const } : {}),
      ...(filter === 'active' ? { status: 'ACTIVE' as const } : {}),
      ...(countryCode ? { country: countryCode } : {}),
    }
    return this.prisma.courierProfile.findMany({
      where,
      select: {
        id: true,
        kind: true,
        country: true,
        city: true,
        phone: true,
        vehicle: true,
        plate_number: true,
        status: true,
        is_online: true,
        rating_avg: true,
        rating_count: true,
        completed_jobs: true,
        created_at: true,
        user: { select: { id: true, email: true, full_name: true, phone: true } },
        service_zones: {
          where: { is_active: true },
          select: {
            all_communes: true,
            city: { select: { name: true } },
            communes: { select: { commune: { select: { name: true } } } },
          },
        },
        _count: { select: { jobs: true, reviews: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('couriers/:id/status')
  async updateCourierStatus(
    @Param('id') id: string,
    @Body() body: { status: CourierStatus },
  ) {
    const allowed: CourierStatus[] = ['ACTIVE', 'SUSPENDED', 'PENDING_REVIEW']
    if (!allowed.includes(body.status)) {
      throw new BadRequestException('Statut non autorisé')
    }

    const profile = await this.prisma.courierProfile.findUnique({ where: { id } })
    if (!profile) throw new NotFoundException('Livreur introuvable')

    const updated = await this.prisma.courierProfile.update({
      where: { id },
      data: {
        status: body.status,
        is_online: body.status === 'ACTIVE' ? profile.is_online : false,
      },
      select: {
        id: true,
        status: true,
        is_online: true,
        user: { select: { email: true, full_name: true } },
      },
    })

    await this.audit.log({
      action: 'STATUS_CHANGE',
      entityType: 'courier_profile',
      entityId: id,
      payload: { from: profile.status, to: body.status },
    })

    return updated
  }

  @Get('delivery/stats')
  async getDeliveryStats(@Query('country') country?: string) {
    const countryCode = (country ?? 'CI').toUpperCase()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      jobsByStatus,
      activeCouriers,
      shopZonesActive,
      courierServiceZones,
      recentDeliveries,
      cities,
      zoneRules,
      couriersPendingKyc,
      deliveredWithEta,
      etaDelayedCount,
    ] = await Promise.all([
      this.prisma.deliveryJob.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: {
          created_at: { gte: since },
          order: { shop: { country: countryCode } },
        },
      }),
      this.prisma.courierProfile.count({
        where: { country: countryCode, status: 'ACTIVE' },
      }),
      this.prisma.shopDeliveryZone.count({
        where: { is_active: true, shop: { country: countryCode, is_active: true } },
      }),
      this.prisma.courierServiceZone.count({
        where: { is_active: true, courier: { country: countryCode, status: 'ACTIVE' } },
      }),
      this.prisma.deliveryJob.count({
        where: {
          status: 'DELIVERED',
          delivered_at: { gte: since },
          order: { shop: { country: countryCode } },
        },
      }),
      this.prisma.geoCity.findMany({
        where: { country: countryCode, is_active: true },
        select: {
          id: true,
          name: true,
          communes: { where: { is_active: true }, select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.shopDeliveryZoneRule.findMany({
        where: {
          zone: { is_active: true, shop: { country: countryCode, is_active: true } },
          city: { country: countryCode },
        },
        select: { city_id: true, all_communes: true, communes: { select: { commune_id: true } } },
      }),
      this.prisma.courierProfile.count({
        where: { country: countryCode, status: 'PENDING_REVIEW' },
      }),
      this.prisma.deliveryJob.findMany({
        where: {
          status: 'DELIVERED',
          delivered_at: { gte: since },
          order: { shop: { country: countryCode }, eta_initial_arrival_at: { not: null } },
        },
        select: {
          delivered_at: true,
          order: { select: { eta_initial_arrival_at: true } },
        },
        take: 500,
      }),
      this.prisma.order.count({
        where: {
          eta_delayed: true,
          updated_at: { gte: since },
          shop: { country: countryCode },
          delivery_type: 'DELIVERY',
        },
      }),
    ])

    const coveredCommuneIds = new Set<string>()
    for (const rule of zoneRules) {
      if (rule.all_communes) {
        const city = cities.find(c => c.id === rule.city_id)
        city?.communes.forEach(c => coveredCommuneIds.add(c.id))
      } else {
        rule.communes.forEach(zc => coveredCommuneIds.add(zc.commune_id))
      }
    }

    const uncoveredCommunes = cities.flatMap(city =>
      city.communes
        .filter(c => !coveredCommuneIds.has(c.id))
        .map(c => ({ city: city.name, commune: c.name, commune_id: c.id })),
    )

    const onTime = deliveredWithEta.filter(j =>
      j.delivered_at
      && j.order.eta_initial_arrival_at
      && j.delivered_at.getTime() <= j.order.eta_initial_arrival_at.getTime(),
    ).length
    const onTimePct = deliveredWithEta.length
      ? Math.round((onTime / deliveredWithEta.length) * 100)
      : null

    return {
      country: countryCode,
      period_days: 30,
      jobs_by_status: jobsByStatus.map(r => ({
        status: r.status,
        count: r._count._all,
      })),
      couriers_active: activeCouriers,
      zones_active: shopZonesActive,
      courier_service_zones: courierServiceZones,
      couriers_pending_kyc: couriersPendingKyc,
      deliveries_last_30d: recentDeliveries,
      on_time_pct: onTimePct,
      eta_delayed_count: etaDelayedCount,
      eta_sample_size: deliveredWithEta.length,
      uncovered_communes: uncoveredCommunes.slice(0, 100),
      uncovered_total: uncoveredCommunes.length,
      communes_total: cities.reduce((n, c) => n + c.communes.length, 0),
      communes_covered: coveredCommuneIds.size,
    }
  }

  // ── Pays (overview multi-pays) ───────────────────────────────────────────────

  @Get('countries/overview')
  async getCountriesOverview() {
    const supported = (process.env.SUPPORTED_COUNTRIES ?? 'CI,BF,SN')
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean)

    const countries = await Promise.all(
      supported.map(async code => {
        const [
          merchants,
          shops,
          orders,
          cities,
          communes,
          couriers,
          deliveryJobs,
          productCategories,
        ] = await Promise.all([
          this.prisma.merchant.count({
            where: { is_active: true, location: { country: code } },
          }),
          this.prisma.shop.count({ where: { country: code, is_active: true } }),
          this.prisma.order.count({ where: { shop: { country: code } } }),
          this.prisma.geoCity.count({ where: { country: code, is_active: true } }),
          this.prisma.geoCommune.count({
            where: { city: { country: code }, is_active: true },
          }),
          this.prisma.deliveryCourier.count({ where: { country: code, is_active: true } }),
          this.prisma.deliveryJob.count({ where: { courier: { country: code } } }),
          this.prisma.productCategoryCountry.count({ where: { country_code: code } }),
        ])

        return {
          code,
          active: true,
          merchants,
          shops,
          orders,
          cities,
          communes,
          couriers,
          delivery_jobs: deliveryJobs,
          product_categories: productCategories,
        }
      }),
    )

    return { countries }
  }
}
