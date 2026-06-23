import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DeliveryJobStatus } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { COURIER_EARNING_RATE } from '../delivery/delivery-fee-split.service'
import {
  isJobUrgent,
  pendingMinutesSince,
  resolveJobPickupCoords,
  scoreFleetCouriersForJob,
} from './logistics-partner-dispatch.util'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'

const SLA_BREACH_TOLERANCE = 1.15
const SLA_BREACH_RATE_ALERT_PCT = 15
const COURIER_RATING_INCIDENT = 4.0
const COURIER_RATING_ALERT = 3.5
const COURIER_CANCELLATION_ALERT = 0.2

const JOB_INCLUDE = {
  order: {
    select: {
      id: true,
      total: true,
      delivery_fee: true,
      delivery_address: true,
      customer_phone: true,
      status: true,
      created_at: true,
      shop: { select: { id: true, name: true, slug: true } },
    },
  },
  courier_profile: {
    select: {
      id: true,
      phone: true,
      vehicle: true,
      is_online: true,
      user: { select: { full_name: true, email: true } },
    },
  },
} as const

@Injectable()
export class LogisticsPartnerOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: LogisticsPartnerScoringService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  async listJobs(
    userId: string,
    opts: { status?: string; days?: number; take?: number } = {},
  ) {
    const staff = await this.requirePartnerStaff(userId)
    const days = Math.min(Math.max(opts.days ?? 90, 1), 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const take = Math.min(Math.max(opts.take ?? 100, 1), 500)

    const activeStatuses: DeliveryJobStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
    let statusFilter: DeliveryJobStatus | { in: DeliveryJobStatus[] } | undefined
    if (opts.status === 'active') {
      statusFilter = { in: activeStatuses }
    } else if (opts.status && opts.status !== 'all') {
      statusFilter = opts.status as DeliveryJobStatus
    }

    return this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        created_at: { gte: since },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: JOB_INCLUDE,
      orderBy: { created_at: 'desc' },
      take,
    })
  }

  async getJob(userId: string, jobId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const job = await this.prisma.deliveryJob.findFirst({
      where: { id: jobId, logistics_partner_id: staff.logistics_partner_id },
      include: {
        ...JOB_INCLUDE,
        wallet_entry: { select: { amount: true, type: true, created_at: true } },
      },
    })
    if (!job) throw new NotFoundException('Course introuvable')
    return job
  }

  async getPartnerStats(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partnerId = staff.logistics_partner_id

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        commission_rate: true,
        rating_avg: true,
        rating_count: true,
        _count: { select: { couriers: true, contracts: { where: { status: 'ACTIVE' } } } },
      },
    })
    if (!partner) throw new NotFoundException('Partenaire introuvable')

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const scoreDetail = await this.scoring.computeForPartner(partnerId)

    const [activeJobs, pendingJobs, delivered30, failed30, onlineCouriers, deliveredJobs30] = await Promise.all([
      this.prisma.deliveryJob.count({
        where: {
          logistics_partner_id: partnerId,
          status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      }),
      this.prisma.deliveryJob.count({
        where: { logistics_partner_id: partnerId, status: 'PENDING' },
      }),
      this.prisma.deliveryJob.count({
        where: { logistics_partner_id: partnerId, status: 'DELIVERED', delivered_at: { gte: since30 } },
      }),
      this.prisma.deliveryJob.count({
        where: {
          logistics_partner_id: partnerId,
          status: { in: ['FAILED', 'CANCELLED'] },
          updated_at: { gte: since30 },
        },
      }),
      this.prisma.courierProfile.count({
        where: { logistics_partner_id: partnerId, kind: 'PARTNER_FLEET', is_online: true },
      }),
      this.prisma.deliveryJob.findMany({
        where: {
          logistics_partner_id: partnerId,
          status: 'DELIVERED',
          delivered_at: { gte: since30 },
        },
        select: { order: { select: { delivery_fee: true } } },
      }),
    ])

    const deliveryFees30 = deliveredJobs30.reduce((n, j) => n + (j.order.delivery_fee ?? 0), 0)
    const courierPayouts30 = Math.round(deliveryFees30 * COURIER_EARNING_RATE)
    const partnerCommission30 = Math.round(deliveryFees30 * partner.commission_rate)
    const platformShare30 = Math.max(0, deliveryFees30 - courierPayouts30 - partnerCommission30)

    return {
      score: scoreDetail.score,
      grade: scoreDetail.grade,
      kpis: scoreDetail.kpis,
      breakdown: scoreDetail.breakdown,
      fleet: {
        total: partner._count.couriers,
        online: onlineCouriers,
        active_contracts: partner._count.contracts,
      },
      jobs: {
        active: activeJobs,
        pending: pendingJobs,
        delivered_30d: delivered30,
        failed_30d: failed30,
      },
      finances: {
        period_days: 30,
        delivery_fees_total: deliveryFees30,
        courier_payouts: courierPayouts30,
        partner_commission: partnerCommission30,
        platform_share: platformShare30,
        commission_rate: partner.commission_rate,
      },
    }
  }

  async listFleetWithStats(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const couriers = await this.prisma.courierProfile.findMany({
      where: { logistics_partner_id: staff.logistics_partner_id, kind: 'PARTNER_FLEET' },
      select: {
        id: true,
        phone: true,
        vehicle: true,
        status: true,
        is_online: true,
        rating_avg: true,
        rating_count: true,
        completed_jobs: true,
        cancellation_rate: true,
        city: true,
        last_location_at: true,
        current_latitude: true,
        current_longitude: true,
        user: { select: { full_name: true, email: true } },
        wallet: { select: { balance: true } },
      },
      orderBy: [{ is_online: 'desc' }, { completed_jobs: 'desc' }],
    })

    const courierIds = couriers.map(c => c.id)
    if (!courierIds.length) return []

    const jobStats = await this.prisma.deliveryJob.groupBy({
      by: ['courier_profile_id', 'status'],
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        courier_profile_id: { in: courierIds },
        created_at: { gte: since90 },
      },
      _count: { id: true },
    })

    const statsMap = new Map<string, { total: number; delivered: number; active: number }>()
    for (const row of jobStats) {
      if (!row.courier_profile_id) continue
      const cur = statsMap.get(row.courier_profile_id) ?? { total: 0, delivered: 0, active: 0 }
      cur.total += row._count.id
      if (row.status === 'DELIVERED') cur.delivered += row._count.id
      if (['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(row.status)) cur.active += row._count.id
      statsMap.set(row.courier_profile_id, cur)
    }

    return couriers.map(c => {
      const s = statsMap.get(c.id) ?? { total: 0, delivered: 0, active: 0 }
      const successRate = s.total > 0 ? Math.round((s.delivered / s.total) * 100) : 0
      return {
        ...c,
        wallet_balance: c.wallet?.balance ?? 0,
        stats_90d: {
          total_jobs: s.total,
          delivered_jobs: s.delivered,
          active_jobs: s.active,
          success_rate: successRate,
        },
      }
    })
  }

  async getFleetCourierDetail(userId: string, courierId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const courier = await this.prisma.courierProfile.findFirst({
      where: {
        id: courierId,
        logistics_partner_id: staff.logistics_partner_id,
        kind: 'PARTNER_FLEET',
      },
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true } },
        wallet: {
          include: {
            entries: {
              orderBy: { created_at: 'desc' },
              take: 30,
              select: {
                id: true,
                amount: true,
                type: true,
                label: true,
                created_at: true,
                job_id: true,
              },
            },
          },
        },
        service_zones: {
          include: {
            city: { select: { name: true } },
            communes: { include: { commune: { select: { name: true } } } },
          },
        },
      },
    })
    if (!courier) throw new NotFoundException('Livreur introuvable')

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        courier_profile_id: courierId,
        created_at: { gte: since90 },
      },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            delivery_fee: true,
            delivery_address: true,
            shop: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    const delivered = jobs.filter(j => j.status === 'DELIVERED')
    const onTime = delivered.filter(j => {
      if (!j.delivered_at || !j.assigned_at || !j.eta_minutes) return false
      const expected = j.assigned_at.getTime() + j.eta_minutes * 60_000
      return j.delivered_at.getTime() <= expected
    })

    const earnings90 = courier.wallet?.entries
      .filter(e => e.type === 'EARNING' && e.created_at >= since90)
      .reduce((n, e) => n + e.amount, 0) ?? 0

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const earnings30 = courier.wallet?.entries
      .filter(e => e.type === 'EARNING' && e.created_at >= since30)
      .reduce((n, e) => n + e.amount, 0) ?? 0

    return {
      profile: {
        id: courier.id,
        phone: courier.phone,
        vehicle: courier.vehicle,
        plate_number: courier.plate_number,
        status: courier.status,
        is_online: courier.is_online,
        city: courier.city,
        rating_avg: courier.rating_avg,
        rating_count: courier.rating_count,
        completed_jobs: courier.completed_jobs,
        cancellation_rate: courier.cancellation_rate,
        last_location_at: courier.last_location_at,
        current_latitude: courier.current_latitude,
        current_longitude: courier.current_longitude,
      },
      user: courier.user,
      zones: courier.service_zones.map(z => ({
        city: z.city.name,
        communes: z.all_communes
          ? 'Toutes les communes'
          : z.communes.map(c => c.commune.name).join(', ') || '—',
      })),
      kpis: {
        period_days: 90,
        total_jobs: jobs.length,
        delivered_jobs: delivered.length,
        failed_jobs: jobs.filter(j => j.status === 'FAILED' || j.status === 'CANCELLED').length,
        success_rate: jobs.length ? Math.round((delivered.length / jobs.length) * 100) : 0,
        on_time_rate: delivered.length ? Math.round((onTime.length / delivered.length) * 100) : 0,
        active_jobs: jobs.filter(j => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status)).length,
        earnings_90d: earnings90,
        earnings_30d: earnings30,
        wallet_balance: courier.wallet?.balance ?? 0,
      },
      job_history: jobs.map(j => ({
        id: j.id,
        status: j.status,
        tracking_token: j.tracking_token,
        created_at: j.created_at,
        assigned_at: j.assigned_at,
        delivered_at: j.delivered_at,
        pickup_address: j.pickup_address,
        dropoff_address: j.dropoff_address,
        order: j.order,
      })),
      wallet_entries: courier.wallet?.entries ?? [],
    }
  }

  async getDispatchBoard(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partnerId = staff.logistics_partner_id

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: partnerId },
      select: { auto_dispatch_default: true, sla_eta_default_minutes: true },
    })
    if (!partner) throw new NotFoundException('Partenaire introuvable')

    void this.processSlaAlerts(5, partnerId).catch(() => {})

    const [couriersRaw, jobs] = await Promise.all([
      this.listFleetWithStats(userId),
      this.prisma.deliveryJob.findMany({
        where: {
          logistics_partner_id: partnerId,
          status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        },
        select: {
          id: true,
          status: true,
          tracking_token: true,
          pickup_address: true,
          dropoff_address: true,
          pickup_latitude: true,
          pickup_longitude: true,
          dropoff_latitude: true,
          dropoff_longitude: true,
          eta_minutes: true,
          created_at: true,
          courier_profile_id: true,
          order: {
            select: {
              id: true,
              total: true,
              delivery_fee: true,
              delivery_address: true,
              customer_phone: true,
              shop: { select: { id: true, name: true } },
            },
          },
          courier_profile: {
            select: {
              id: true,
              user: { select: { full_name: true } },
            },
          },
        },
        orderBy: { created_at: 'asc' },
        take: 100,
      }),
    ])

    const fleet = couriersRaw.map(c => ({
      id: c.id,
      label: c.user.full_name ?? c.user.email,
      is_online: c.is_online,
      status: c.status,
      rating_avg: c.rating_avg,
      active_jobs: c.stats_90d.active_jobs,
      lat: c.current_latitude,
      lng: c.current_longitude,
      vehicle: c.vehicle,
    }))

    const fleetForScore = couriersRaw.map(c => ({
      id: c.id,
      is_online: c.is_online,
      status: c.status,
      rating_avg: c.rating_avg,
      current_latitude: c.current_latitude,
      current_longitude: c.current_longitude,
      active_jobs: c.stats_90d.active_jobs,
    }))

    const mappedJobs = jobs.map(job => {
      const pickup = resolveJobPickupCoords(job)
      const ranked = scoreFleetCouriersForJob(fleetForScore, pickup)
      const pendingMin = pendingMinutesSince(job.created_at)
      return {
        id: job.id,
        status: job.status,
        tracking_token: job.tracking_token,
        pickup_address: job.pickup_address,
        dropoff_address: job.dropoff_address,
        pickup_lat: pickup?.lat ?? null,
        pickup_lng: pickup?.lng ?? null,
        dropoff_lat: job.dropoff_latitude,
        dropoff_lng: job.dropoff_longitude,
        eta_minutes: job.eta_minutes,
        created_at: job.created_at,
        pending_minutes: pendingMin,
        is_urgent: isJobUrgent(job.created_at),
        suggested_courier_id: ranked[0]?.id ?? null,
        suggested_courier_name: ranked[0]
          ? (couriersRaw.find(c => c.id === ranked[0].id)?.user.full_name ?? null)
          : null,
        order: job.order,
        courier_profile: job.courier_profile,
      }
    })

    return {
      auto_dispatch_default: partner.auto_dispatch_default,
      sla_pending_threshold_minutes: 5,
      fleet,
      jobs: mappedJobs,
    }
  }

  async suggestCourierForJob(userId: string, jobId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const job = await this.prisma.deliveryJob.findFirst({
      where: { id: jobId, logistics_partner_id: staff.logistics_partner_id, status: 'PENDING' },
      select: {
        pickup_latitude: true,
        pickup_longitude: true,
        dropoff_latitude: true,
        dropoff_longitude: true,
      },
    })
    if (!job) throw new NotFoundException('Course introuvable')

    const fleet = await this.listFleetWithStats(userId)
    const pickup = resolveJobPickupCoords(job)
    const ranked = scoreFleetCouriersForJob(
      fleet.map(c => ({
        id: c.id,
        is_online: c.is_online,
        status: c.status,
        rating_avg: c.rating_avg,
        current_latitude: c.current_latitude ?? null,
        current_longitude: c.current_longitude ?? null,
        active_jobs: c.stats_90d.active_jobs,
      })),
      pickup,
    )

    return {
      suggested_courier_id: ranked[0]?.id ?? null,
      candidates: ranked.slice(0, 3).map(c => ({
        courier_profile_id: c.id,
        dispatch_score: Math.round(c.dispatch_score * 1000) / 1000,
      })),
    }
  }

  async releasePartnerJob(userId: string, jobId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        id: jobId,
        logistics_partner_id: staff.logistics_partner_id,
        status: 'ASSIGNED',
      },
    })
    if (!job) {
      throw new BadRequestException('Seules les courses assignées (non récupérées) peuvent être libérées')
    }

    return this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        courier_profile_id: null,
        assigned_at: null,
        offered_to_profile_id: null,
        offered_at: null,
        offer_expires_at: null,
      },
      select: { id: true, status: true },
    })
  }

  private parseMonth(month?: string): { start: Date; end: Date; label: string } {
    const now = new Date()
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const raw = month?.trim() || fallback
    const match = /^(\d{4})-(\d{2})$/.exec(raw)
    if (!match) throw new BadRequestException('Format mois attendu : YYYY-MM')
    const year = Number(match[1])
    const mon = Number(match[2])
    if (mon < 1 || mon > 12) throw new BadRequestException('Mois invalide')
    const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0))
    const end = new Date(Date.UTC(year, mon, 1, 0, 0, 0))
    return { start, end, label: raw }
  }

  async getPartnerFinances(userId: string, month?: string) {
    return this.getFinances(userId, month)
  }

  async getFinances(userId: string, month?: string) {
    const staff = await this.requirePartnerStaff(userId)
    const { start, end, label } = this.parseMonth(month)

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      select: { commission_rate: true },
    })
    if (!partner) throw new NotFoundException('Partenaire introuvable')

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        status: 'DELIVERED',
        delivered_at: { gte: start, lt: end },
      },
      select: {
        id: true,
        delivered_at: true,
        delivery_fee_split: true,
        courier_profile_id: true,
        order: {
          select: {
            delivery_fee: true,
            shop: { select: { id: true, name: true } },
          },
        },
        courier_profile: {
          select: { user: { select: { full_name: true } } },
        },
      },
      orderBy: { delivered_at: 'desc' },
    })

    type Split = { delivery_fee?: number; courier?: number; partner?: number; platform?: number }
    let deliveryFees = 0
    let partnerCommission = 0
    let courierPayouts = 0
    let platformShare = 0

    const byShop = new Map<string, { shop_id: string; shop_name: string; jobs: number; fees: number; commission: number }>()
    const byCourier = new Map<string, { courier_id: string; name: string; jobs: number; earnings: number }>()

    const ledger = jobs.map(j => {
      const split = (j.delivery_fee_split ?? {}) as Split
      const fee = split.delivery_fee ?? j.order.delivery_fee ?? 0
      const partnerPart = split.partner ?? Math.round(fee * partner.commission_rate)
      const courierPart = split.courier ?? Math.round(fee * COURIER_EARNING_RATE)
      const platformPart = split.platform ?? Math.max(0, fee - partnerPart - courierPart)

      deliveryFees += fee
      partnerCommission += partnerPart
      courierPayouts += courierPart
      platformShare += platformPart

      const shopId = j.order.shop?.id ?? 'unknown'
      const shopName = j.order.shop?.name ?? '—'
      const shopRow = byShop.get(shopId) ?? { shop_id: shopId, shop_name: shopName, jobs: 0, fees: 0, commission: 0 }
      shopRow.jobs += 1
      shopRow.fees += fee
      shopRow.commission += partnerPart
      byShop.set(shopId, shopRow)

      if (j.courier_profile_id) {
        const name = j.courier_profile?.user.full_name ?? 'Livreur'
        const cRow = byCourier.get(j.courier_profile_id) ?? { courier_id: j.courier_profile_id, name, jobs: 0, earnings: 0 }
        cRow.jobs += 1
        cRow.earnings += courierPart
        byCourier.set(j.courier_profile_id, cRow)
      }

      return {
        job_id: j.id,
        delivered_at: j.delivered_at,
        shop_name: shopName,
        courier_name: j.courier_profile?.user.full_name ?? null,
        delivery_fee: fee,
        partner_commission: partnerPart,
        courier_payout: courierPart,
        platform_share: platformPart,
      }
    })

    const payouts = await this.prisma.logisticsPartnerPayout.findMany({
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        period_start: { gte: start },
        period_end: { lte: end },
      },
      orderBy: { created_at: 'desc' },
    })

    return {
      month: label,
      summary: {
        total_jobs: jobs.length,
        delivery_fees_total: deliveryFees,
        partner_commission: partnerCommission,
        courier_payouts: courierPayouts,
        platform_share: platformShare,
        commission_rate: partner.commission_rate,
      },
      by_shop: [...byShop.values()].sort((a, b) => b.commission - a.commission),
      by_courier: [...byCourier.values()].sort((a, b) => b.earnings - a.earnings),
      ledger,
      payouts,
    }
  }

  async exportFinancesCsv(userId: string, month?: string): Promise<string> {
    const data = await this.getFinances(userId, month)
    const header = 'job_id,delivered_at,shop,courier,delivery_fee,partner_commission,courier_payout,platform_share'
    const rows = data.ledger.map(row => [
      row.job_id,
      row.delivered_at?.toISOString() ?? '',
      `"${(row.shop_name ?? '').replace(/"/g, '""')}"`,
      `"${(row.courier_name ?? '').replace(/"/g, '""')}"`,
      row.delivery_fee,
      row.partner_commission,
      row.courier_payout,
      row.platform_share,
    ].join(','))
    return [header, ...rows].join('\n')
  }

  async getPartnerQuality(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partnerId = staff.logistics_partner_id
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: partnerId },
      select: { sla_eta_default_minutes: true },
    })
    if (!partner) throw new NotFoundException('Partenaire introuvable')

    void this.processCourierQualityAlerts(partnerId).catch(() => {})

    const [openDisputes, resolvedDisputes, contracts, deliveredJobs30, fleetRaw, courierJobStats30] =
      await Promise.all([
        this.prisma.deliveryDispute.findMany({
          where: { status: 'OPEN', job: { logistics_partner_id: partnerId } },
          include: {
            user: { select: { full_name: true, email: true } },
            order: { select: { id: true, shop: { select: { name: true } } } },
            job: {
              select: {
                id: true,
                proof_photo_url: true,
                courier_profile: {
                  select: { id: true, user: { select: { full_name: true } } },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 50,
        }),
        this.prisma.deliveryDispute.findMany({
          where: {
            status: { in: ['RESOLVED', 'DISMISSED'] },
            job: { logistics_partner_id: partnerId },
          },
          include: {
            order: { select: { id: true, shop: { select: { name: true } } } },
            job: {
              select: {
                id: true,
                courier_profile: {
                  select: { user: { select: { full_name: true } } },
                },
              },
            },
          },
          orderBy: { resolved_at: 'desc' },
          take: 30,
        }),
        this.prisma.deliveryPartnerContract.findMany({
          where: { logistics_partner_id: partnerId },
          select: { shop_id: true, sla_eta_max_minutes: true },
        }),
        this.prisma.deliveryJob.findMany({
          where: {
            logistics_partner_id: partnerId,
            status: 'DELIVERED',
            delivered_at: { gte: since30 },
            assigned_at: { not: null },
          },
          select: {
            id: true,
            assigned_at: true,
            delivered_at: true,
            order: { select: { id: true, shop_id: true, shop: { select: { name: true } } } },
            courier_profile: {
              select: { id: true, user: { select: { full_name: true } } },
            },
          },
          orderBy: { delivered_at: 'desc' },
          take: 200,
        }),
        this.listFleetWithStats(userId),
        this.prisma.deliveryJob.groupBy({
          by: ['courier_profile_id', 'status'],
          where: {
            logistics_partner_id: partnerId,
            courier_profile_id: { not: null },
            created_at: { gte: since30 },
          },
          _count: { id: true },
        }),
      ])

    const slaByShop = new Map(contracts.map(c => [c.shop_id, c.sla_eta_max_minutes]))
    const defaultSla = partner.sla_eta_default_minutes ?? 45

    const slaBreaches = deliveredJobs30
      .map(job => {
        const slaMin = (job.order.shop_id ? slaByShop.get(job.order.shop_id) : null) ?? defaultSla
        const assignedAt = job.assigned_at!.getTime()
        const deliveredAt = job.delivered_at!.getTime()
        const maxAllowed = assignedAt + slaMin * 60_000 * SLA_BREACH_TOLERANCE
        if (deliveredAt <= maxAllowed) return null
        const delayMinutes = Math.round((deliveredAt - maxAllowed) / 60_000)
        return {
          job_id: job.id,
          shop_name: job.order.shop?.name ?? 'Commerce',
          courier_id: job.courier_profile?.id ?? null,
          courier_name: job.courier_profile?.user.full_name ?? null,
          sla_minutes: slaMin,
          delay_minutes: delayMinutes,
          delivered_at: job.delivered_at,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    const breachRate30d = deliveredJobs30.length
      ? Math.round((slaBreaches.length / deliveredJobs30.length) * 1000) / 10
      : 0

    const cancelMap = new Map<string, { total: number; failed: number }>()
    for (const row of courierJobStats30) {
      if (!row.courier_profile_id) continue
      const cur = cancelMap.get(row.courier_profile_id) ?? { total: 0, failed: 0 }
      cur.total += row._count.id
      if (row.status === 'FAILED' || row.status === 'CANCELLED') {
        cur.failed += row._count.id
      }
      cancelMap.set(row.courier_profile_id, cur)
    }

    const underperforming = fleetRaw
      .map(c => {
        const stats = cancelMap.get(c.id)
        const computedCancelRate = stats && stats.total > 0
          ? stats.failed / stats.total
          : c.cancellation_rate
        const issues: string[] = []
        let severity: 'alert' | 'incident' | null = null

        if (c.rating_count >= 5 && c.rating_avg < COURIER_RATING_ALERT) {
          issues.push(`Note ${c.rating_avg.toFixed(1)}/5`)
          severity = 'alert'
        } else if (c.rating_count >= 3 && c.rating_avg < COURIER_RATING_INCIDENT) {
          issues.push(`Note ${c.rating_avg.toFixed(1)}/5`)
          severity = 'incident'
        }
        if (computedCancelRate > COURIER_CANCELLATION_ALERT) {
          issues.push(`Annulations ${Math.round(computedCancelRate * 100)} %`)
          severity = severity === 'alert' || computedCancelRate > 0.3 ? 'alert' : (severity ?? 'incident')
        }

        if (!issues.length) return null
        return {
          id: c.id,
          name: c.user.full_name ?? c.user.email,
          status: c.status,
          rating_avg: c.rating_avg,
          rating_count: c.rating_count,
          cancellation_rate: Math.round(computedCancelRate * 1000) / 10,
          issues,
          severity: severity ?? 'incident',
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => (a.severity === 'alert' ? -1 : 1) - (b.severity === 'alert' ? -1 : 1))

    return {
      summary: {
        open_disputes: openDisputes.length,
        sla_breach_rate_30d: breachRate30d,
        sla_breach_alert: breachRate30d > SLA_BREACH_RATE_ALERT_PCT,
        underperforming_couriers: underperforming.length,
        resolved_disputes_30d: resolvedDisputes.filter(
          d => d.resolved_at && d.resolved_at >= since30,
        ).length,
      },
      disputes: {
        open: openDisputes.map(d => ({
          id: d.id,
          reason: d.reason,
          description: d.description,
          status: d.status,
          created_at: d.created_at,
          client_name: d.user.full_name ?? d.user.email,
          shop_name: d.order.shop?.name ?? null,
          order_id: d.order.id,
          job_id: d.job?.id ?? null,
          courier_id: d.job?.courier_profile?.id ?? null,
          courier_name: d.job?.courier_profile?.user.full_name ?? null,
          proof_photo_url: d.job?.proof_photo_url ?? null,
        })),
        resolved: resolvedDisputes.map(d => ({
          id: d.id,
          reason: d.reason,
          status: d.status,
          admin_note: d.admin_note,
          created_at: d.created_at,
          resolved_at: d.resolved_at,
          shop_name: d.order.shop?.name ?? null,
          order_id: d.order.id,
          job_id: d.job?.id ?? null,
          courier_name: d.job?.courier_profile?.user.full_name ?? null,
        })),
      },
      sla: {
        breach_rate_30d: breachRate30d,
        threshold_exceeded: breachRate30d > SLA_BREACH_RATE_ALERT_PCT,
        delivered_count_30d: deliveredJobs30.length,
        breaches: slaBreaches.slice(0, 30),
      },
      underperforming_couriers: underperforming,
    }
  }

  async processCourierQualityAlerts(partnerId: string) {
    const fleet = await this.prisma.courierProfile.findMany({
      where: { logistics_partner_id: partnerId, kind: 'PARTNER_FLEET', status: 'ACTIVE' },
      select: {
        id: true,
        rating_avg: true,
        rating_count: true,
        cancellation_rate: true,
        user: { select: { full_name: true } },
      },
    })
    if (!fleet.length) return { alerts_sent: 0 }

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const jobStats = await this.prisma.deliveryJob.groupBy({
      by: ['courier_profile_id', 'status'],
      where: {
        logistics_partner_id: partnerId,
        courier_profile_id: { in: fleet.map(c => c.id) },
        created_at: { gte: since30 },
      },
      _count: { id: true },
    })

    const cancelMap = new Map<string, { total: number; failed: number }>()
    for (const row of jobStats) {
      if (!row.courier_profile_id) continue
      const cur = cancelMap.get(row.courier_profile_id) ?? { total: 0, failed: 0 }
      cur.total += row._count.id
      if (row.status === 'FAILED' || row.status === 'CANCELLED') cur.failed += row._count.id
      cancelMap.set(row.courier_profile_id, cur)
    }

    const staff = await this.prisma.logisticsPartnerStaff.findMany({
      where: { logistics_partner_id: partnerId },
      select: { user_id: true },
    })
    if (!staff.length) return { alerts_sent: 0 }

    let alertsSent = 0

    for (const courier of fleet) {
      const stats = cancelMap.get(courier.id)
      const cancelRate = stats && stats.total > 0
        ? stats.failed / stats.total
        : courier.cancellation_rate

      const lowRating = courier.rating_count >= 5 && courier.rating_avg < COURIER_RATING_ALERT
      const highCancel = cancelRate > COURIER_CANCELLATION_ALERT
      if (!lowRating && !highCancel) continue

      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          type: 'logistics_courier_underperforming',
          created_at: { gte: since30 },
          data: { path: ['courier_id'], equals: courier.id },
        },
        select: { id: true },
      })
      if (alreadySent) continue

      const name = courier.user.full_name ?? 'Livreur'
      const parts: string[] = []
      if (lowRating) parts.push(`note ${courier.rating_avg.toFixed(1)}/5`)
      if (highCancel) parts.push(`annulations ${Math.round(cancelRate * 100)} %`)
      const body = `${name} — ${parts.join(', ')}. Consultez la qualité de flotte.`

      for (const member of staff) {
        await this.notificationQueue.enqueuePush({
          userId: member.user_id,
          type: 'logistics_courier_underperforming',
          title: 'Livreur sous-performant',
          body,
          data: {
            courier_id: courier.id,
            logistics_partner_id: partnerId,
            href: '/logistics/quality',
          },
        })
      }
      alertsSent++
    }

    return { alerts_sent: alertsSent }
  }

  async processSlaAlerts(thresholdMinutes = 5, partnerId?: string) {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000)

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: 'PENDING',
        logistics_partner_id: partnerId ?? { not: null },
        courier_profile_id: null,
        created_at: { lte: cutoff },
      },
      select: {
        id: true,
        logistics_partner_id: true,
        order: { select: { shop: { select: { name: true } } } },
      },
      take: partnerId ? 20 : 50,
    })

    let alertsSent = 0

    for (const job of jobs) {
      if (!job.logistics_partner_id) continue

      const alreadySent = await this.prisma.notification.findFirst({
        where: {
          type: 'logistics_sla_breach',
          data: { path: ['job_id'], equals: job.id },
        },
        select: { id: true },
      })
      if (alreadySent) continue

      const staff = await this.prisma.logisticsPartnerStaff.findMany({
        where: { logistics_partner_id: job.logistics_partner_id },
        select: { user_id: true },
      })
      if (!staff.length) continue

      const shopName = job.order.shop?.name ?? 'Commerce'
      const body = `Course ${shopName} en attente depuis plus de ${thresholdMinutes} min — dispatch requis.`

      for (const member of staff) {
        await this.notificationQueue.enqueuePush({
          userId: member.user_id,
          type: 'logistics_sla_breach',
          title: 'Course urgente en attente',
          body,
          data: {
            job_id: job.id,
            logistics_partner_id: job.logistics_partner_id,
            href: '/logistics/dispatch',
          },
        })
      }
      alertsSent++
    }

    return { checked: jobs.length, alerts_sent: alertsSent }
  }

  async updateFleetCourierStatus(
    userId: string,
    courierId: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ) {
    const staff = await this.requirePartnerStaff(userId)
    const courier = await this.prisma.courierProfile.findFirst({
      where: {
        id: courierId,
        logistics_partner_id: staff.logistics_partner_id,
        kind: 'PARTNER_FLEET',
      },
    })
    if (!courier) throw new NotFoundException('Livreur introuvable')

    if (status === 'SUSPENDED' && courier.status !== 'ACTIVE') {
      throw new BadRequestException('Seul un livreur actif peut être suspendu')
    }
    if (status === 'ACTIVE' && courier.status !== 'SUSPENDED') {
      throw new BadRequestException('Seul un livreur suspendu peut être réactivé')
    }

    if (status === 'SUSPENDED') {
      const activeJob = await this.prisma.deliveryJob.findFirst({
        where: {
          courier_profile_id: courierId,
          status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      })
      if (activeJob) {
        throw new BadRequestException('Impossible : ce livreur a une course en cours')
      }
    }

    return this.prisma.courierProfile.update({
      where: { id: courierId },
      data: {
        status,
        ...(status === 'SUSPENDED' ? { is_online: false } : {}),
      },
      select: {
        id: true,
        status: true,
        is_online: true,
        user: { select: { full_name: true, email: true } },
      },
    })
  }

  async unlinkFleetCourier(userId: string, courierId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const courier = await this.prisma.courierProfile.findFirst({
      where: {
        id: courierId,
        logistics_partner_id: staff.logistics_partner_id,
        kind: 'PARTNER_FLEET',
      },
    })
    if (!courier) throw new NotFoundException('Livreur introuvable')

    const activeJob = await this.prisma.deliveryJob.findFirst({
      where: {
        courier_profile_id: courierId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
      },
    })
    if (activeJob) {
      throw new BadRequestException('Impossible : ce livreur a une course en cours')
    }

    return this.prisma.courierProfile.update({
      where: { id: courierId },
      data: {
        kind: 'INDEPENDENT',
        logistics_partner_id: null,
      },
      select: { id: true },
    })
  }

  private async requirePartnerStaff(userId: string) {
    const staff = await this.prisma.logisticsPartnerStaff.findUnique({ where: { user_id: userId } })
    if (!staff) throw new NotFoundException('Accès structure logistique requis')
    return staff
  }
}
