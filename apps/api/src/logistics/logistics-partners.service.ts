import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import { slugify } from '../marketplace/marketplace.util'
import { RegisterLogisticsPartnerDto } from '../delivery/dto/delivery-stakeholders.dto'
import { UpdateLogisticsSettingsDto } from './dto/logistics-settings.dto'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'
import { resolveJobPickupCoords, scoreFleetCouriersForJob } from './logistics-partner-dispatch.util'

const ALLOWED_DOC_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

@Injectable()
export class LogisticsPartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: LogisticsPartnerScoringService,
    private readonly storage: StorageService,
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
    return this.assignJobToCourier(staff.logistics_partner_id, jobId, courierProfileId)
  }

  async assignJobToCourier(partnerId: string, jobId: string, courierProfileId: string) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        id: jobId,
        logistics_partner_id: partnerId,
        status: 'PENDING',
      },
    })
    if (!job) throw new NotFoundException('Course introuvable')

    const courier = await this.prisma.courierProfile.findFirst({
      where: {
        id: courierProfileId,
        logistics_partner_id: partnerId,
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
        courier_latitude: courier.current_latitude ?? undefined,
        courier_longitude: courier.current_longitude ?? undefined,
      },
    })
  }

  async autoDispatchJobIfEnabled(jobId: string): Promise<boolean> {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        logistics_partner_id: true,
        pickup_latitude: true,
        pickup_longitude: true,
        dropoff_latitude: true,
        dropoff_longitude: true,
      },
    })
    if (!job?.logistics_partner_id || job.status !== 'PENDING') return false

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: job.logistics_partner_id },
      select: { auto_dispatch_default: true },
    })
    if (!partner?.auto_dispatch_default) return false

    const couriers = await this.prisma.courierProfile.findMany({
      where: {
        logistics_partner_id: job.logistics_partner_id,
        kind: 'PARTNER_FLEET',
        status: 'ACTIVE',
        is_online: true,
      },
      select: {
        id: true,
        is_online: true,
        status: true,
        rating_avg: true,
        current_latitude: true,
        current_longitude: true,
        _count: {
          select: {
            jobs: { where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } } },
          },
        },
      },
    })

    const pickup = resolveJobPickupCoords(job)
    const ranked = scoreFleetCouriersForJob(
      couriers.map(c => ({
        id: c.id,
        is_online: c.is_online,
        status: c.status,
        rating_avg: c.rating_avg,
        current_latitude: c.current_latitude,
        current_longitude: c.current_longitude,
        active_jobs: c._count.jobs,
      })),
      pickup,
    )
    const best = ranked[0]
    if (!best) return false

    await this.assignJobToCourier(job.logistics_partner_id, jobId, best.id)
    return true
  }

  async getSettings(userId: string) {
    return this.getPartnerSettings(userId)
  }

  async getPartnerSettings(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      include: {
        service_areas: {
          include: {
            commune: { select: { id: true, name: true, city: { select: { name: true, slug: true } } } },
          },
        },
      },
    })
    if (!partner) throw new NotFoundException('Structure introuvable')

    return {
      id: partner.id,
      legal_name: partner.legal_name,
      trade_name: partner.trade_name,
      slug: partner.slug,
      country: partner.country,
      city: partner.city,
      phone: partner.phone,
      email: partner.email,
      logo: partner.logo,
      verification: partner.verification,
      rccm_number: partner.rccm_number,
      kyc_document_url: partner.kyc_document_url,
      fleet_size_range: partner.fleet_size_range,
      vehicle_types: partner.vehicle_types,
      sla_eta_default_minutes: partner.sla_eta_default_minutes,
      auto_dispatch_default: partner.auto_dispatch_default,
      payout_method: partner.payout_method,
      payout_number: partner.payout_number,
      commission_rate: partner.commission_rate,
      commune_ids: partner.service_areas.map(a => a.commune_id),
      communes: partner.service_areas.map(a => ({
        id: a.commune.id,
        name: a.commune.name,
        city: a.commune.city.name,
        city_slug: a.commune.city.slug,
      })),
    }
  }

  async updateSettings(userId: string, dto: UpdateLogisticsSettingsDto) {
    return this.updatePartnerSettings(userId, dto)
  }

  async updatePartnerSettings(userId: string, dto: UpdateLogisticsSettingsDto) {
    const staff = await this.requirePartnerStaff(userId)
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
    })
    if (!partner) throw new NotFoundException('Structure introuvable')

    const communeIds = dto.commune_ids
    let validCommuneIds: string[] | undefined

    if (communeIds !== undefined) {
      if (communeIds.length === 0) {
        throw new BadRequestException('Sélectionnez au moins une commune')
      }
      const validCommunes = await this.prisma.geoCommune.findMany({
        where: { id: { in: communeIds }, is_active: true, city: { country: partner.country } },
        select: { id: true },
      })
      if (validCommunes.length !== communeIds.length) {
        throw new BadRequestException('Une ou plusieurs communes sont invalides')
      }
      validCommuneIds = validCommunes.map(c => c.id)
    }

    return this.prisma.$transaction(async tx => {
      const updated = await tx.logisticsPartner.update({
        where: { id: partner.id },
        data: {
          ...(dto.legal_name !== undefined ? { legal_name: dto.legal_name.trim() } : {}),
          ...(dto.trade_name !== undefined ? { trade_name: dto.trade_name.trim() || null } : {}),
          ...(dto.rccm_number !== undefined ? { rccm_number: dto.rccm_number.trim() || null } : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
          ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() || null } : {}),
          ...(dto.fleet_size_range !== undefined ? { fleet_size_range: dto.fleet_size_range } : {}),
          ...(dto.vehicle_types !== undefined ? { vehicle_types: dto.vehicle_types } : {}),
          ...(dto.sla_eta_default_minutes !== undefined
            ? { sla_eta_default_minutes: dto.sla_eta_default_minutes }
            : {}),
          ...(dto.auto_dispatch_default !== undefined
            ? { auto_dispatch_default: dto.auto_dispatch_default }
            : {}),
          ...(dto.payout_method !== undefined ? { payout_method: dto.payout_method } : {}),
          ...(dto.payout_number !== undefined
            ? { payout_number: dto.payout_number.trim() || null }
            : {}),
        },
      })

      if (validCommuneIds) {
        await tx.logisticsPartnerServiceArea.deleteMany({
          where: { logistics_partner_id: partner.id },
        })
        await tx.logisticsPartnerServiceArea.createMany({
          data: validCommuneIds.map(commune_id => ({
            logistics_partner_id: partner.id,
            commune_id,
          })),
          skipDuplicates: true,
        })
      }

      return updated
    })
  }

  async uploadLogo(userId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Fichier requis')
    if (!ALLOWED_LOGO_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG ou WebP')
    }
    if (file.size > 2 * 1024 * 1024) throw new BadRequestException('Taille maximale : 2 Mo')

    const staff = await this.requirePartnerStaff(userId)
    const url = await this.storage.upload(
      file.buffer,
      file.mimetype,
      `logistics-logo/${staff.logistics_partner_id}`,
    )

    return this.prisma.logisticsPartner.update({
      where: { id: staff.logistics_partner_id },
      data: { logo: url },
      select: { id: true, logo: true },
    })
  }

  async uploadKycDocument(userId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Fichier requis')
    if (!ALLOWED_DOC_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG, WebP ou PDF')
    }
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Taille maximale : 5 Mo')

    const staff = await this.requirePartnerStaff(userId)
    const url = await this.storage.upload(
      file.buffer,
      file.mimetype,
      `logistics-kyc/${staff.logistics_partner_id}`,
    )

    return this.prisma.logisticsPartner.update({
      where: { id: staff.logistics_partner_id },
      data: { kyc_document_url: url },
    })
  }

  createPartnerPayout(
    partnerId: string,
    body: {
      period_start: string
      period_end: string
      amount: number
      status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
      reference?: string
      note?: string
    },
  ) {
    return this.prisma.logisticsPartnerPayout.create({
      data: {
        logistics_partner_id: partnerId,
        period_start: new Date(body.period_start),
        period_end: new Date(body.period_end),
        amount: body.amount,
        status: body.status ?? 'PENDING',
        reference: body.reference,
        note: body.note,
        paid_at: body.status === 'PAID' ? new Date() : undefined,
      },
    })
  }

  listPartnerPayouts(partnerId: string, take = 10) {
    return this.prisma.logisticsPartnerPayout.findMany({
      where: { logistics_partner_id: partnerId },
      orderBy: { created_at: 'desc' },
      take,
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
