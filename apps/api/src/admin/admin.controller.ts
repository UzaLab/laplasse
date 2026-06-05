import { Controller, Get, Patch, Post, Param, Body, UseGuards, Query } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { ComplaintsService } from '../complaints/complaints.service'
import { SearchService } from '../search/search.service'
import { MerchantsService } from '../merchants/merchants.service'
import { NotificationsService } from '../notifications/notifications.service'

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
  ) {}

  // ── Stats globales ──────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const [merchantTotal, merchantPending, merchantVerified, users, reviewTotal, reviewPending, complaintOpen] =
      await Promise.all([
        this.prisma.merchant.count(),
        this.prisma.merchant.count({ where: { verification_status: 'PENDING' } }),
        this.prisma.merchant.count({ where: { verification_status: 'VERIFIED' } }),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.review.count(),
        this.prisma.review.count({ where: { status: 'PENDING' } }),
        this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      ])

    return {
      merchants: { total: merchantTotal, pending: merchantPending, verified: merchantVerified },
      users,
      reviews: { total: reviewTotal, pending: reviewPending },
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

  @Post('sync-search')
  async syncSearch() {
    await this.searchService.syncAllMerchants()
    return { ok: true, message: 'Meilisearch re-indexé avec succès' }
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
}
