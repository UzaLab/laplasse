import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { orderMatchesZones, resolveOrderCountry } from './delivery-zone-match.util'
import { vehiclesCompatible } from './delivery-vehicle.util'

export const DELIVERY_OFFER_TIMEOUT_SEC = 30
const MAX_OFFER_ATTEMPTS = 15
const EXPIRE_POLL_MS = 12_000

@Injectable()
export class DeliveryOfferService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryOfferService.name)
  private expireTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  onModuleInit() {
    this.expireTimer = setInterval(() => {
      void this.processExpiredOffers().catch(err => {
        this.logger.warn(`Expire offers poll failed: ${(err as Error).message}`)
      })
      void this.reofferPendingJobs().catch(err => {
        this.logger.warn(`Reoffer pending poll failed: ${(err as Error).message}`)
      })
    }, EXPIRE_POLL_MS)
  }

  onModuleDestroy() {
    if (this.expireTimer) clearInterval(this.expireTimer)
  }

  async startOffering(jobId: string) {
    const job = await this.loadJobForOffer(jobId)
    if (!job || job.status !== 'PENDING' || job.courier_profile_id) return
    if (job.fulfilment_mode === 'MERCHANT_OWN') return

    await this.processExpiredOffers()

    if (job.fulfilment_mode === 'LOGISTICS_PARTNER') {
      await this.offerToPartnerFleet(job)
      return
    }

    await this.offerToNextCourier(job)
  }

  /** Relance les offres sur jobs en attente (ex. livreur vient de passer en ligne). */
  async reofferPendingJobs() {
    await this.processExpiredOffers()

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: 'PENDING',
        courier_profile_id: null,
        fulfilment_mode: { in: ['PLATFORM_RIDER', 'LOGISTICS_PARTNER'] },
        rejected_count: { lt: MAX_OFFER_ATTEMPTS },
      },
      select: { id: true, offered_to_profile_id: true, offer_expires_at: true },
      orderBy: { created_at: 'asc' },
      take: 25,
    })

    for (const row of jobs) {
      const active = row.offered_to_profile_id && row.offer_expires_at
        && row.offer_expires_at.getTime() > Date.now()
      if (!active) {
        await this.startOffering(row.id)
      }
    }
  }

  async processExpiredOffers() {
    const now = new Date()
    const expired = await this.prisma.deliveryJob.findMany({
      where: {
        status: 'PENDING',
        courier_profile_id: null,
        offered_to_profile_id: { not: null },
        offer_expires_at: { lt: now },
      },
      select: { id: true, offered_to_profile_id: true },
      take: 50,
    })

    for (const row of expired) {
      if (!row.offered_to_profile_id) continue
      await this.recordRejection(row.id, row.offered_to_profile_id, 'timeout')
      await this.clearOffer(row.id)
      const job = await this.loadJobForOffer(row.id)
      if (!job) continue
      if (job.fulfilment_mode === 'LOGISTICS_PARTNER') {
        await this.offerToPartnerFleet(job)
      } else {
        await this.offerToNextCourier(job)
      }
    }
  }

  async rejectOffer(userId: string, jobId: string) {
    const profile = await this.prisma.courierProfile.findUnique({ where: { user_id: userId } })
    if (!profile) return

    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job || job.status !== 'PENDING' || job.courier_profile_id) return
    if (job.offered_to_profile_id !== profile.id) return

    await this.recordRejection(jobId, profile.id, 'rejected')
    await this.clearOffer(jobId)
    const refreshed = await this.loadJobForOffer(jobId)
    if (!refreshed) return
    if (refreshed.fulfilment_mode === 'LOGISTICS_PARTNER') {
      await this.offerToPartnerFleet(refreshed)
    } else {
      await this.offerToNextCourier(refreshed)
    }
  }

  isOfferActive(job: {
    offered_to_profile_id: string | null
    offer_expires_at: Date | null
  }) {
    if (!job.offered_to_profile_id || !job.offer_expires_at) return false
    return job.offer_expires_at.getTime() > Date.now()
  }

  canCourierAccept(
    job: {
      offered_to_profile_id: string | null
      offer_expires_at: Date | null
    },
    profileId: string,
  ) {
    if (!job.offered_to_profile_id) return true
    if (job.offered_to_profile_id !== profileId) return false
    if (!job.offer_expires_at) return true
    return job.offer_expires_at.getTime() > Date.now()
  }

  async clearOfferOnAccept(jobId: string) {
    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        offered_to_profile_id: null,
        offered_at: null,
        offer_expires_at: null,
        accepted_at: new Date(),
      },
    })
  }

  private async loadJobForOffer(jobId: string) {
    return this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          select: {
            delivery_city_id: true,
            delivery_commune_id: true,
            shop: { select: { name: true, city: true, country: true } },
            merchant: { select: { business_name: true, location: { select: { country: true } } } },
          },
        },
        offer_rejections: { select: { courier_profile_id: true } },
      },
    })
  }

  /**
   * Scoring pour platform riders — formule DN-7.3 étendue avec distance GPS.
   * score = distScore*0.5 + loadScore*0.3 + ratingScore*0.15 + completedScore*0.05
   * Plus haut = meilleur candidat.
   */
  private scoreCourier(
    pickup: { lat: number | null; lng: number | null },
    courier: {
      current_latitude: number | null
      current_longitude: number | null
      _count: { jobs: number }
      rating_avg: number
      completed_jobs: number
    },
  ): number {
    let distScore = 0.5
    if (
      pickup.lat != null && pickup.lng != null
      && courier.current_latitude != null && courier.current_longitude != null
    ) {
      const R = 6371
      const dLat = ((courier.current_latitude - pickup.lat) * Math.PI) / 180
      const dLng = ((courier.current_longitude - pickup.lng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pickup.lat * Math.PI) / 180) * Math.cos((courier.current_latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
      const distKm = Math.max(0.1, R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
      distScore = 1 / distKm
    }
    const loadScore = 1 - Math.min(courier._count.jobs / 4, 1)
    const ratingScore = courier.rating_avg / 5
    const completedScore = Math.min(courier.completed_jobs / 50, 1)
    return distScore * 0.5 + loadScore * 0.3 + ratingScore * 0.15 + completedScore * 0.05
  }

  private async offerToNextCourier(
    job: NonNullable<Awaited<ReturnType<DeliveryOfferService['loadJobForOffer']>>>,
  ) {
    if (job.rejected_count >= MAX_OFFER_ATTEMPTS) {
      this.logger.warn(`Job ${job.id}: max offer attempts reached — escalade admin`)
      await this.escalateStuckJob(job)
      return
    }

    if (this.isOfferActive(job)) return

    const orderCountry = await resolveOrderCountry(this.prisma, job.order)
    const rejectedIds = new Set(job.offer_rejections.map(r => r.courier_profile_id))
    const couriers = await this.prisma.courierProfile.findMany({
      where: {
        status: 'ACTIVE',
        is_online: true,
        kind: 'INDEPENDENT',
        id: { notIn: [...rejectedIds] },
        ...(orderCountry ? { country: orderCountry } : {}),
        ...(job.required_vehicle ? { vehicle: { in: vehiclesCompatible(job.required_vehicle) } } : {}),
      },
      include: {
        _count: {
          select: {
            jobs: {
              where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } },
            },
          },
        },
      },
      take: 60,
    })

    const zoneMatched: typeof couriers = []
    for (const c of couriers) {
      if (await orderMatchesZones(this.prisma, job.order, c.id, c.country)) {
        zoneMatched.push(c)
      }
    }

    const pickup = { lat: job.pickup_latitude, lng: job.pickup_longitude }
    zoneMatched.sort((a, b) =>
      this.scoreCourier(pickup, { ...b, _count: { jobs: b._count.jobs } })
      - this.scoreCourier(pickup, { ...a, _count: { jobs: a._count.jobs } }),
    )

    const candidate = zoneMatched[0] ?? null

    if (!candidate) {
      this.logger.log(`Job ${job.id}: no online courier in zone (vehicle=${job.required_vehicle ?? 'any'})`)
      return
    }

    const now = new Date()
    const expires = new Date(now.getTime() + DELIVERY_OFFER_TIMEOUT_SEC * 1000)
    const shopName = job.order.merchant?.business_name ?? job.order.shop?.name ?? 'Commerce'

    await this.prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        offered_to_profile_id: candidate.id,
        offered_at: now,
        offer_expires_at: expires,
      },
    })

    await this.notificationQueue.enqueuePush({
      userId: candidate.user_id,
      type: 'delivery_job_offered',
      title: 'Nouvelle course disponible',
      body: `${shopName} — acceptez dans ${DELIVERY_OFFER_TIMEOUT_SEC} secondes`,
      data: { job_id: job.id, type: 'delivery_job_offered' },
    })

    this.logger.log(`Job ${job.id} offered to courier ${candidate.id}`)
  }

  private async offerToPartnerFleet(
    job: NonNullable<Awaited<ReturnType<DeliveryOfferService['loadJobForOffer']>>>,
  ) {
    if (!job.logistics_partner_id) {
      this.logger.log(`Job ${job.id}: logistics partner missing`)
      return
    }
    if (job.rejected_count >= MAX_OFFER_ATTEMPTS) {
      await this.escalateStuckJob(job)
      return
    }
    if (this.isOfferActive(job)) return

    const orderCountry = await resolveOrderCountry(this.prisma, job.order)
    const rejectedIds = new Set(job.offer_rejections.map(r => r.courier_profile_id))
    const couriers = await this.prisma.courierProfile.findMany({
      where: {
        status: 'ACTIVE',
        is_online: true,
        kind: 'PARTNER_FLEET',
        logistics_partner_id: job.logistics_partner_id,
        id: { notIn: [...rejectedIds] },
        ...(orderCountry ? { country: orderCountry } : {}),
        ...(job.required_vehicle ? { vehicle: { in: vehiclesCompatible(job.required_vehicle) } } : {}),
      },
      include: {
        _count: {
          select: {
            jobs: { where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } } },
          },
        },
      },
      take: 40,
    })

    // Même scoring composite que les platform riders (distance + charge + note + expérience)
    const pickup = { lat: job.pickup_latitude, lng: job.pickup_longitude }
    couriers.sort((a, b) =>
      this.scoreCourier(pickup, { ...b, _count: { jobs: b._count.jobs } })
      - this.scoreCourier(pickup, { ...a, _count: { jobs: a._count.jobs } }),
    )

    const candidate = couriers[0] ?? null
    if (!candidate) {
      this.logger.log(`Job ${job.id}: no online partner fleet courier`)
      return
    }

    const now = new Date()
    const expires = new Date(now.getTime() + DELIVERY_OFFER_TIMEOUT_SEC * 1000)
    const shopName = job.order.merchant?.business_name ?? job.order.shop?.name ?? 'Commerce'

    await this.prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        offered_to_profile_id: candidate.id,
        offered_at: now,
        offer_expires_at: expires,
      },
    })

    await this.notificationQueue.enqueuePush({
      userId: candidate.user_id,
      type: 'delivery_job_offered',
      title: 'Course partenaire',
      body: `${shopName} — acceptez dans ${DELIVERY_OFFER_TIMEOUT_SEC} secondes`,
      data: { job_id: job.id, type: 'delivery_job_offered' },
    })

    this.logger.log(`Job ${job.id} offered to partner courier ${candidate.id}`)
  }

  /**
   * Notifie les admins lorsqu'un job atteint la limite de tentatives sans être accepté.
   * Enregistre aussi un log pour le suivi ops.
   */
  private async escalateStuckJob(
    job: NonNullable<Awaited<ReturnType<DeliveryOfferService['loadJobForOffer']>>>,
  ) {
    const shopName = job.order.merchant?.business_name ?? job.order.shop?.name ?? 'Commerce'

    // Notifie les admins via push (type dédié pour filtrage côté admin)
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
      take: 10,
    })
    for (const admin of admins) {
      await this.notificationQueue.enqueuePush({
        userId: admin.id,
        type: 'delivery_job_stuck',
        title: '⚠️ Course sans livreur',
        body: `Job ${job.id.slice(0, 8)} (${shopName}) : ${MAX_OFFER_ATTEMPTS} tentatives sans réponse`,
        data: { job_id: job.id, type: 'delivery_job_stuck' },
      })
    }

    this.logger.error(
      `Job ${job.id} STUCK — ${job.rejected_count} rejections, vehicle=${job.required_vehicle ?? 'any'}, mode=${job.fulfilment_mode}`,
    )
  }

  private async clearOffer(jobId: string) {
    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        offered_to_profile_id: null,
        offered_at: null,
        offer_expires_at: null,
        rejected_count: { increment: 1 },
      },
    })
  }

  private async recordRejection(jobId: string, profileId: string, reason: string) {
    await this.prisma.deliveryJobOfferRejection.upsert({
      where: {
        job_id_courier_profile_id: { job_id: jobId, courier_profile_id: profileId },
      },
      create: { job_id: jobId, courier_profile_id: profileId, reason },
      update: { reason },
    })
  }
}
