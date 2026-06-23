import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../marketplace/marketplace.util'
import { RegisterLogisticsPartnerDto } from '../delivery/dto/delivery-stakeholders.dto'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'

@Injectable()
export class LogisticsPartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: LogisticsPartnerScoringService,
  ) {}

  async register(userId: string, dto: RegisterLogisticsPartnerDto) {
    const existing = await this.prisma.logisticsPartner.findUnique({ where: { owner_user_id: userId } })
    if (existing) throw new ConflictException('Vous avez déjà une structure logistique')

    let slug = slugify(dto.trade_name?.trim() || dto.legal_name)
    let n = 0
    while (await this.prisma.logisticsPartner.findUnique({ where: { slug } })) {
      n += 1
      slug = `${slugify(dto.legal_name)}-${n}`
    }

    const partner = await this.prisma.logisticsPartner.create({
      data: {
        owner_user_id: userId,
        legal_name: dto.legal_name.trim(),
        trade_name: dto.trade_name?.trim() || null,
        slug,
        country: (dto.country ?? 'CI').toUpperCase(),
        city: dto.city.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        verification: 'PENDING',
      },
    })

    await this.prisma.logisticsPartnerStaff.upsert({
      where: { user_id: userId },
      create: { logistics_partner_id: partner.id, user_id: userId, role: 'OWNER' },
      update: { logistics_partner_id: partner.id },
    })

    return partner
  }

  async getMyPartner(userId: string) {
    const staff = await this.prisma.logisticsPartnerStaff.findUnique({
      where: { user_id: userId },
      include: {
        partner: {
          include: {
            _count: { select: { couriers: true, contracts: true } },
          },
        },
      },
    })
    if (!staff) return null
    return staff.partner
  }

  async listPublic(country?: string, city?: string) {
    const partners = await this.prisma.logisticsPartner.findMany({
      where: {
        is_active: true,
        verification: 'VERIFIED',
        ...(country ? { country: country.toUpperCase() } : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        legal_name: true,
        trade_name: true,
        slug: true,
        city: true,
        country: true,
        phone: true,
        rating_avg: true,
        rating_count: true,
        _count: { select: { couriers: true, contracts: { where: { status: 'ACTIVE' } } } },
      },
      take: 50,
    })

    const scores = await this.scoring.computeForPartners(partners.map(p => p.id))

    return partners
      .map(p => ({
        ...p,
        fleet_size: p._count.couriers,
        active_contracts: p._count.contracts,
        score: scores.get(p.id)?.score ?? 50,
        grade: scores.get(p.id)?.grade ?? 'C',
        kpis: scores.get(p.id)?.kpis,
        score_breakdown: scores.get(p.id)?.breakdown,
      }))
      .sort((a, b) => b.score - a.score)
  }

  async getPublicScore(partnerId: string) {
    const partner = await this.prisma.logisticsPartner.findFirst({
      where: { id: partnerId, is_active: true, verification: 'VERIFIED' },
      select: {
        id: true,
        legal_name: true,
        trade_name: true,
        slug: true,
        city: true,
        country: true,
        phone: true,
        rating_avg: true,
        rating_count: true,
      },
    })
    if (!partner) throw new NotFoundException('Partenaire introuvable')
    const scoreDetail = await this.scoring.computeForPartner(partnerId)
    return { partner, ...scoreDetail }
  }

  async listContractsForShop(shopId: string) {
    return this.prisma.deliveryPartnerContract.findMany({
      where: { shop_id: shopId },
      include: {
        partner: {
          select: {
            id: true,
            legal_name: true,
            trade_name: true,
            slug: true,
            city: true,
            phone: true,
            rating_avg: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    })
  }

  async requestContract(shopId: string, logisticsPartnerId: string, feeOverride?: number, sla?: number) {
    const partner = await this.prisma.logisticsPartner.findFirst({
      where: { id: logisticsPartnerId, is_active: true, verification: 'VERIFIED' },
    })
    if (!partner) throw new NotFoundException('Partenaire logistique introuvable')

    return this.prisma.deliveryPartnerContract.upsert({
      where: {
        shop_id_logistics_partner_id: { shop_id: shopId, logistics_partner_id: logisticsPartnerId },
      },
      create: {
        shop_id: shopId,
        logistics_partner_id: logisticsPartnerId,
        status: 'PENDING_PARTNER',
        fee_override: feeOverride ?? null,
        sla_eta_max_minutes: sla ?? null,
      },
      update: {
        status: 'PENDING_PARTNER',
        fee_override: feeOverride ?? null,
        sla_eta_max_minutes: sla ?? null,
      },
      include: { partner: { select: { legal_name: true, trade_name: true } } },
    })
  }

  async listPartnerContracts(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    return this.prisma.deliveryPartnerContract.findMany({
      where: { logistics_partner_id: staff.logistics_partner_id },
      include: { shop: { select: { id: true, name: true, slug: true } } },
      orderBy: { updated_at: 'desc' },
    })
  }

  async respondContract(userId: string, contractId: string, accept: boolean) {
    const staff = await this.requirePartnerStaff(userId)
    const contract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { id: contractId, logistics_partner_id: staff.logistics_partner_id },
    })
    if (!contract) throw new NotFoundException('Contrat introuvable')

    if (accept) {
      return this.prisma.deliveryPartnerContract.update({
        where: { id: contractId },
        data: { status: 'ACTIVE', signed_at: new Date() },
      })
    }
    return this.prisma.deliveryPartnerContract.update({
      where: { id: contractId },
      data: { status: 'TERMINATED' },
    })
  }

  async merchantAcceptContract(shopId: string, contractId: string) {
    const contract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { id: contractId, shop_id: shopId },
    })
    if (!contract) throw new NotFoundException('Contrat introuvable')
    return this.prisma.deliveryPartnerContract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE', signed_at: new Date() },
    })
  }

  async linkFleetCourier(userId: string, email: string) {
    const staff = await this.requirePartnerStaff(userId)
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { courier_profile: true },
    })
    if (!user?.courier_profile) {
      throw new BadRequestException('Compte livreur introuvable — inscription /courier/signup requise')
    }
    if (user.courier_profile.status !== 'ACTIVE') {
      throw new BadRequestException('Profil livreur non actif')
    }
    if (user.courier_profile.kind === 'MERCHANT_STAFF') {
      throw new ConflictException('Livreur déjà rattaché à un commerce')
    }

    return this.prisma.courierProfile.update({
      where: { id: user.courier_profile.id },
      data: {
        kind: 'PARTNER_FLEET',
        logistics_partner_id: staff.logistics_partner_id,
        shop_id: null,
        merchant_id: null,
      },
      select: {
        id: true,
        phone: true,
        user: { select: { full_name: true, email: true } },
      },
    })
  }

  async listFleetCouriers(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    return this.prisma.courierProfile.findMany({
      where: { logistics_partner_id: staff.logistics_partner_id, kind: 'PARTNER_FLEET' },
      select: {
        id: true,
        phone: true,
        is_online: true,
        status: true,
        rating_avg: true,
        user: { select: { full_name: true, email: true } },
      },
    })
  }

  async listActiveJobs(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    return this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: staff.logistics_partner_id,
        status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
      },
      select: {
        id: true,
        status: true,
        tracking_token: true,
        pickup_address: true,
        dropoff_address: true,
        eta_minutes: true,
        created_at: true,
        order: {
          select: {
            id: true,
            total: true,
            delivery_fee: true,
            delivery_address: true,
            customer_phone: true,
            shop: { select: { name: true } },
          },
        },
        courier_profile: {
          select: { id: true, user: { select: { full_name: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async assignJob(userId: string, jobId: string, courierProfileId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        id: jobId,
        logistics_partner_id: staff.logistics_partner_id,
        status: 'PENDING',
      },
    })
    if (!job) throw new NotFoundException('Course introuvable')

    const courier = await this.prisma.courierProfile.findFirst({
      where: {
        id: courierProfileId,
        logistics_partner_id: staff.logistics_partner_id,
        kind: 'PARTNER_FLEET',
        status: 'ACTIVE',
      },
    })
    if (!courier) throw new NotFoundException('Livreur flotte introuvable')

    const now = new Date()
    return this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        courier_profile_id: courier.id,
        status: 'ASSIGNED',
        assigned_at: now,
        offered_to_profile_id: null,
        offered_at: null,
        offer_expires_at: null,
      },
    })
  }

  listForAdmin(filter?: string) {
    const where = filter === 'pending'
      ? { verification: 'PENDING' as const }
      : filter === 'verified'
        ? { verification: 'VERIFIED' as const }
        : {}
    return this.prisma.logisticsPartner.findMany({
      where,
      include: {
        owner: { select: { full_name: true, email: true } },
        _count: { select: { couriers: true, contracts: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  verifyPartner(id: string, status: 'VERIFIED' | 'REJECTED') {
    return this.prisma.logisticsPartner.update({
      where: { id },
      data: { verification: status, is_active: status === 'VERIFIED' },
    })
  }

  private async requirePartnerStaff(userId: string) {
    const staff = await this.prisma.logisticsPartnerStaff.findUnique({ where: { user_id: userId } })
    if (!staff) throw new NotFoundException('Accès structure logistique requis')
    return staff
  }
}
