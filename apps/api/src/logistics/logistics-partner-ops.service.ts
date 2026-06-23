import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DeliveryJobStatus } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { COURIER_EARNING_RATE } from '../couriers/courier-wallet.service'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'

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
