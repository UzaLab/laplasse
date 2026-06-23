import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface LogisticsPartnerKpis {
  total_jobs: number
  delivered_jobs: number
  failed_jobs: number
  success_rate: number
  offers_sent: number
  offers_accepted: number
  offers_rejected: number
  acceptance_rate: number
  on_time_deliveries: number
  on_time_rate: number
  fleet_total: number
  fleet_online: number
  fleet_availability_rate: number
  communes_covered: number
  cities_covered: number
  zone_coverage_score: number
  active_contracts: number
  rating_avg: number
  rating_count: number
}

export interface LogisticsPartnerScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  kpis: LogisticsPartnerKpis
  breakdown: {
    success: number
    acceptance: number
    punctuality: number
    coverage: number
    fleet: number
    reputation: number
  }
}

const WEIGHTS = {
  success: 0.28,
  acceptance: 0.18,
  punctuality: 0.14,
  coverage: 0.15,
  fleet: 0.10,
  reputation: 0.15,
} as const

@Injectable()
export class LogisticsPartnerScoringService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForPartner(partnerId: string): Promise<LogisticsPartnerScore> {
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        city: true,
        country: true,
        rating_avg: true,
        rating_count: true,
        _count: { select: { contracts: { where: { status: 'ACTIVE' } } } },
      },
    })
    if (!partner) {
      return this.emptyScore()
    }

    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: partnerId,
        created_at: { gte: since },
      },
      select: {
        status: true,
        assigned_at: true,
        delivered_at: true,
        eta_minutes: true,
        offer_rejections: { select: { reason: true } },
        accepted_at: true,
        offered_to_profile_id: true,
      },
    })

    const delivered = jobs.filter(j => j.status === 'DELIVERED')
    const failed = jobs.filter(j => j.status === 'FAILED' || j.status === 'CANCELLED')
    const terminal = delivered.length + failed.length
    const successRate = terminal > 0 ? delivered.length / terminal : 0.85

    let offersSent = 0
    let offersAccepted = 0
    let offersRejected = 0
    for (const j of jobs) {
      const rejections = j.offer_rejections.length
      if (j.accepted_at || j.status !== 'PENDING') offersAccepted += 1
      offersRejected += rejections
      offersSent += Math.max(1, rejections + (j.accepted_at ? 1 : 0))
    }
    if (offersSent === 0 && jobs.length > 0) {
      offersSent = jobs.length
      offersAccepted = delivered.length + jobs.filter(j =>
        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(j.status),
      ).length
    }
    const acceptanceRate = offersSent > 0
      ? Math.min(1, offersAccepted / offersSent)
      : 0.75

    let onTime = 0
    for (const j of delivered) {
      if (!j.delivered_at || !j.assigned_at || !j.eta_minutes) {
        onTime += 1
        continue
      }
      const elapsedMin = (j.delivered_at.getTime() - j.assigned_at.getTime()) / 60_000
      if (elapsedMin <= j.eta_minutes * 1.15) onTime += 1
    }
    const onTimeRate = delivered.length > 0 ? onTime / delivered.length : 0.8

    const fleet = await this.prisma.courierProfile.findMany({
      where: { logistics_partner_id: partnerId, kind: 'PARTNER_FLEET', status: 'ACTIVE' },
      select: {
        is_online: true,
        service_zones: {
          where: { is_active: true },
          select: {
            all_communes: true,
            city_id: true,
            communes: { select: { commune_id: true } },
          },
        },
      },
    })

    const fleetTotal = fleet.length
    const fleetOnline = fleet.filter(c => c.is_online).length
    const fleetAvailability = fleetTotal > 0 ? fleetOnline / fleetTotal : 0.5

    const communeIds = new Set<string>()
    const cityIds = new Set<string>()
    for (const c of fleet) {
      for (const z of c.service_zones) {
        cityIds.add(z.city_id)
        if (z.all_communes) {
          const communes = await this.prisma.geoCommune.findMany({
            where: { city_id: z.city_id, is_active: true },
            select: { id: true },
          })
          for (const cm of communes) communeIds.add(cm.id)
        } else {
          for (const cm of z.communes) communeIds.add(cm.commune_id)
        }
      }
    }

    const partnerCity = await this.prisma.geoCity.findFirst({
      where: {
        country: partner.country,
        name: { equals: partner.city, mode: 'insensitive' },
        is_active: true,
      },
      select: {
        id: true,
        _count: { select: { communes: { where: { is_active: true } } } },
      },
    })

    const totalCommunesInCity = partnerCity?._count.communes ?? 20
    const communesCovered = communeIds.size
    const zoneCoverageScore = Math.min(
      1,
      totalCommunesInCity > 0 ? communesCovered / totalCommunesInCity : communesCovered / 10,
    )

    const reputationScore = partner.rating_count > 0
      ? partner.rating_avg / 5
      : 0.7

    const breakdown = {
      success: Math.round(successRate * 100),
      acceptance: Math.round(acceptanceRate * 100),
      punctuality: Math.round(onTimeRate * 100),
      coverage: Math.round(zoneCoverageScore * 100),
      fleet: Math.round(fleetAvailability * 100),
      reputation: Math.round(reputationScore * 100),
    }

    const score = Math.round(
      breakdown.success * WEIGHTS.success
      + breakdown.acceptance * WEIGHTS.acceptance
      + breakdown.punctuality * WEIGHTS.punctuality
      + breakdown.coverage * WEIGHTS.coverage
      + breakdown.fleet * WEIGHTS.fleet
      + breakdown.reputation * WEIGHTS.reputation,
    )

    return {
      score: Math.min(100, Math.max(0, score)),
      grade: this.gradeFromScore(score),
      kpis: {
        total_jobs: jobs.length,
        delivered_jobs: delivered.length,
        failed_jobs: failed.length,
        success_rate: Math.round(successRate * 1000) / 10,
        offers_sent: offersSent,
        offers_accepted: offersAccepted,
        offers_rejected: offersRejected,
        acceptance_rate: Math.round(acceptanceRate * 1000) / 10,
        on_time_deliveries: onTime,
        on_time_rate: Math.round(onTimeRate * 1000) / 10,
        fleet_total: fleetTotal,
        fleet_online: fleetOnline,
        fleet_availability_rate: Math.round(fleetAvailability * 1000) / 10,
        communes_covered: communesCovered,
        cities_covered: cityIds.size,
        zone_coverage_score: Math.round(zoneCoverageScore * 1000) / 10,
        active_contracts: partner._count.contracts,
        rating_avg: partner.rating_avg,
        rating_count: partner.rating_count,
      },
      breakdown,
    }
  }

  async computeForPartners(partnerIds: string[]): Promise<Map<string, LogisticsPartnerScore>> {
    const map = new Map<string, LogisticsPartnerScore>()
    await Promise.all(partnerIds.map(async id => {
      map.set(id, await this.computeForPartner(id))
    }))
    return map
  }

  private gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 80) return 'A'
    if (score >= 65) return 'B'
    if (score >= 50) return 'C'
    return 'D'
  }

  private emptyScore(): LogisticsPartnerScore {
    return {
      score: 50,
      grade: 'C',
      kpis: {
        total_jobs: 0,
        delivered_jobs: 0,
        failed_jobs: 0,
        success_rate: 0,
        offers_sent: 0,
        offers_accepted: 0,
        offers_rejected: 0,
        acceptance_rate: 0,
        on_time_deliveries: 0,
        on_time_rate: 0,
        fleet_total: 0,
        fleet_online: 0,
        fleet_availability_rate: 0,
        communes_covered: 0,
        cities_covered: 0,
        zone_coverage_score: 0,
        active_contracts: 0,
        rating_avg: 0,
        rating_count: 0,
      },
      breakdown: {
        success: 50,
        acceptance: 50,
        punctuality: 50,
        coverage: 50,
        fleet: 50,
        reputation: 50,
      },
    }
  }
}
