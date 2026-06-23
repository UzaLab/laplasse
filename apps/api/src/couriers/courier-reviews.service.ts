import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCourierReviewDto } from './dto/create-courier-review.dto'
import { AuditService } from '../audit/audit.service'

const REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const TRUST_MIN_JOBS = 20
const TRUST_SUSPEND_MIN_REVIEWS = 5
const TRUST_SUSPEND_RATING = 3.0
const TRUST_ALERT_RATING = 3.5

@Injectable()
export class CourierReviewsService {
  private readonly logger = new Logger(CourierReviewsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createForOrder(userId: string, orderId: string, dto: CreateCourierReviewDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        delivery_job: true,
        courier_review: { select: { id: true } },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (order.delivery_type !== 'DELIVERY') {
      throw new BadRequestException('Cette commande n\'est pas une livraison')
    }
    if (!order.delivery_job) {
      throw new BadRequestException('Aucune course de livraison associée')
    }
    if (order.delivery_job.status !== 'DELIVERED') {
      throw new BadRequestException('La livraison n\'est pas encore terminée')
    }
    if (!order.delivery_job.courier_profile_id) {
      throw new BadRequestException('Aucun livreur assigné à cette course')
    }
    if (order.courier_review) {
      throw new ForbiddenException('Vous avez déjà noté ce livreur pour cette commande')
    }

    const deliveredAt = order.delivery_job.delivered_at
    if (deliveredAt && Date.now() - deliveredAt.getTime() > REVIEW_WINDOW_MS) {
      throw new BadRequestException('La fenêtre de notation (7 jours) est expirée')
    }

    const review = await this.prisma.courierReview.create({
      data: {
        courier_profile_id: order.delivery_job.courier_profile_id,
        order_id: orderId,
        user_id: userId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        status: 'APPROVED',
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        created_at: true,
      },
    })

    await this.recalcCourierRating(order.delivery_job.courier_profile_id)
    await this.evaluateTrustThresholds(order.delivery_job.courier_profile_id)

    return review
  }

  listForAdmin(filter?: string) {
    const where = filter === 'pending' ? { status: 'PENDING' as const } : {}
    return this.prisma.courierReview.findMany({
      where,
      include: {
        courier_profile: {
          select: {
            id: true,
            city: true,
            phone: true,
            rating_avg: true,
            completed_jobs: true,
            user: { select: { full_name: true, email: true } },
          },
        },
        user: { select: { id: true, full_name: true, email: true } },
        order: { select: { id: true, total: true, shop: { select: { name: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  async moderate(reviewId: string, action: 'approve' | 'reject' | 'delete', adminUserId?: string) {
    const review = await this.prisma.courierReview.findUnique({
      where: { id: reviewId },
      select: { id: true, courier_profile_id: true, status: true },
    })
    if (!review) throw new NotFoundException('Avis introuvable')

    if (action === 'delete') {
      await this.prisma.courierReview.delete({ where: { id: reviewId } })
      await this.recalcCourierRating(review.courier_profile_id)
      await this.evaluateTrustThresholds(review.courier_profile_id, adminUserId)
      return { deleted: true }
    }

    const updated = await this.prisma.courierReview.update({
      where: { id: reviewId },
      data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
      select: { id: true, status: true, courier_profile_id: true },
    })

    await this.recalcCourierRating(updated.courier_profile_id)
    await this.evaluateTrustThresholds(updated.courier_profile_id, adminUserId)

    await this.audit.log({
      userId: adminUserId,
      action: 'MODERATION',
      entityType: 'courier_review',
      entityId: reviewId,
      payload: { action, courier_profile_id: updated.courier_profile_id },
    })

    return { id: updated.id, status: updated.status }
  }

  async recalcCourierRating(courierProfileId: string) {
    const agg = await this.prisma.courierReview.aggregate({
      where: { courier_profile_id: courierProfileId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { _all: true },
    })

    const rating_avg = Math.round((agg._avg.rating ?? 0) * 10) / 10
    const rating_count = agg._count._all

    await this.prisma.courierProfile.update({
      where: { id: courierProfileId },
      data: { rating_avg, rating_count },
    })

    return { rating_avg, rating_count }
  }

  async evaluateTrustThresholds(courierProfileId: string, adminUserId?: string) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { id: courierProfileId },
      include: { user: { select: { full_name: true, email: true } } },
    })
    if (!profile || profile.status === 'SUSPENDED') return null

    if (
      profile.rating_count >= TRUST_SUSPEND_MIN_REVIEWS
      && profile.rating_avg < TRUST_SUSPEND_RATING
    ) {
      await this.prisma.courierProfile.update({
        where: { id: courierProfileId },
        data: { status: 'SUSPENDED', is_online: false },
      })

      await this.audit.log({
        userId: adminUserId,
        action: 'STATUS_CHANGE',
        entityType: 'courier_profile',
        entityId: courierProfileId,
        payload: {
          reason: 'auto_suspend_low_rating',
          rating_avg: profile.rating_avg,
          rating_count: profile.rating_count,
          courier_email: profile.user.email,
        },
      })

      this.logger.warn(
        `Courier ${courierProfileId} auto-suspended (rating ${profile.rating_avg} / ${profile.rating_count} avis)`,
      )

      return { action: 'suspended' as const, rating_avg: profile.rating_avg }
    }

    if (
      profile.completed_jobs >= TRUST_MIN_JOBS
      && profile.rating_count >= TRUST_SUSPEND_MIN_REVIEWS
      && profile.rating_avg < TRUST_ALERT_RATING
      && profile.rating_avg >= TRUST_SUSPEND_RATING
    ) {
      await this.audit.log({
        userId: adminUserId,
        action: 'MODERATION',
        entityType: 'courier_profile_trust_alert',
        entityId: courierProfileId,
        payload: {
          reason: 'manual_review_recommended',
          rating_avg: profile.rating_avg,
          completed_jobs: profile.completed_jobs,
          courier_email: profile.user.email,
        },
      })

      return { action: 'alert' as const, rating_avg: profile.rating_avg }
    }

    return null
  }
}
