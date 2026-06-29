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
import { SaveLogisticsOnboardingDto } from './dto/logistics-onboarding.dto'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { resolveJobPickupCoords, scoreFleetCouriersForJob } from './logistics-partner-dispatch.util'

const ALLOWED_DOC_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

@Injectable()
export class LogisticsPartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: LogisticsPartnerScoringService,
    private readonly storage: StorageService,
    private readonly notificationQueue: NotificationQueueService,
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

  async resolveMyPartner(userId: string) {
    const staff = await this.prisma.logisticsPartnerStaff.findUnique({
      where: { user_id: userId },
      select: { logistics_partner_id: true },
    })
    if (!staff) throw new NotFoundException('Aucun prestataire logistique trouvé pour cet utilisateur')
    const partner = await this.prisma.logisticsPartner.findUnique({ where: { id: staff.logistics_partner_id } })
    if (!partner) throw new NotFoundException('Prestataire introuvable')
    return partner
  }

  async saveOnboarding(userId: string, dto: SaveLogisticsOnboardingDto) {
    let staff = await this.prisma.logisticsPartnerStaff.findUnique({ where: { user_id: userId } })

    if (!staff && dto.step === 1) {
      if (!dto.legal_name?.trim() || !dto.city?.trim() || !dto.phone?.trim()) {
        throw new BadRequestException('Raison sociale, ville et téléphone requis')
      }
      const country = (dto.country ?? 'CI').toUpperCase()
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
          country,
          city: dto.city.trim(),
          phone: dto.phone.trim(),
          email: dto.email?.trim().toLowerCase() || null,
          rccm_number: dto.rccm_number?.trim() || null,
          address: dto.address?.trim() || null,
          verification: 'PENDING',
          onboarding_step: 1,
        },
      })
      await this.prisma.logisticsPartnerStaff.create({
        data: { logistics_partner_id: partner.id, user_id: userId, role: 'OWNER' },
      })
      staff = await this.prisma.logisticsPartnerStaff.findUnique({ where: { user_id: userId } })
    }

    if (!staff) throw new NotFoundException('Structure logistique requise — commencez par l\'étape 1')

    const partner = await this.prisma.logisticsPartner.findUnique({ where: { id: staff.logistics_partner_id } })
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

    const nextStep = Math.max(partner.onboarding_step, dto.step)
    const completing = dto.step >= 4

    const updated = await this.prisma.$transaction(async tx => {
      const p = await tx.logisticsPartner.update({
        where: { id: partner.id },
        data: {
          ...(dto.legal_name !== undefined ? { legal_name: dto.legal_name.trim() } : {}),
          ...(dto.trade_name !== undefined ? { trade_name: dto.trade_name.trim() || null } : {}),
          ...(dto.rccm_number !== undefined ? { rccm_number: dto.rccm_number.trim() || null } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
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
          onboarding_step: completing ? 4 : nextStep,
          ...(completing ? { verification: 'PENDING' as const } : {}),
        },
      })

      if (validCommuneIds !== undefined) {
        await tx.logisticsPartnerServiceArea.deleteMany({ where: { logistics_partner_id: partner.id } })
        if (validCommuneIds.length) {
          await tx.logisticsPartnerServiceArea.createMany({
            data: validCommuneIds.map(commune_id => ({
              logistics_partner_id: partner.id,
              commune_id,
            })),
          })
        }
      }

      return p
    })

    if (completing) {
      await this.notificationQueue.enqueuePush({
        userId,
        type: 'logistics_onboarding_complete',
        title: 'Inscription reçue',
        body: `${updated.trade_name ?? updated.legal_name} — votre dossier est en cours de validation.`,
        data: { partner_id: updated.id, href: '/logistics' },
      })
    }

    return this.getPartnerSettings(userId)
  }

  async getFleetInviteLink(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      select: { slug: true, legal_name: true, trade_name: true },
    })
    if (!partner) throw new NotFoundException('Structure introuvable')
    const baseUrl = (process.env.WEB_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    return {
      slug: partner.slug,
      partner_name: partner.trade_name ?? partner.legal_name,
      url: `${baseUrl}/courier/signup?ref=partner:${partner.slug}`,
    }
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

    const existingContract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { shop_id: shopId, logistics_partner_id: logisticsPartnerId },
    })

    const contract = existingContract
      ? await this.prisma.deliveryPartnerContract.update({
          where: { id: existingContract.id },
          data: {
            status: 'PENDING_PARTNER',
            fee_override: feeOverride ?? null,
            sla_eta_max_minutes: sla ?? null,
          },
        })
      : await this.prisma.deliveryPartnerContract.create({
          data: {
            shop_id: shopId,
            logistics_partner_id: logisticsPartnerId,
            status: 'PENDING_PARTNER',
            fee_override: feeOverride ?? null,
            sla_eta_max_minutes: sla ?? null,
          },
        })

    const staff = await this.prisma.logisticsPartnerStaff.findMany({
      where: { logistics_partner_id: logisticsPartnerId },
      select: { user_id: true },
    })
    const userIds = new Set(staff.map(s => s.user_id))
    userIds.add(partner.owner_user_id)
    const shopRes = await this.prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } })
    const shopName = shopRes?.name ?? 'Commerce'

    await Promise.all(
      [...userIds].map(userId =>
        this.notificationQueue.enqueuePush({
          userId,
          type: 'logistics_contract_request',
          title: 'Demande de partenariat',
          body: `${shopName} souhaite un contrat de livraison — répondez depuis vos contrats.`,
          data: {
            contract_id: contract.id,
            shop_id: shopId,
            logistics_partner_id: logisticsPartnerId,
            href: `/logistics/contracts/${contract.id}`,
          },
        }),
      ),
    )

    return contract
  }

  async listPartnerContracts(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    return this.prisma.deliveryPartnerContract.findMany({
      where: { logistics_partner_id: staff.logistics_partner_id },
      include: {
        shop: { select: { id: true, name: true, slug: true, city: true, logo: true } },
      },
      orderBy: { updated_at: 'desc' },
    })
  }

  async respondContract(userId: string, contractId: string, accept: boolean) {
    const staff = await this.requirePartnerStaff(userId)
    const contract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { id: contractId, logistics_partner_id: staff.logistics_partner_id },
    })
    if (!contract) throw new NotFoundException('Contrat introuvable')
    if (contract.status !== 'PENDING_PARTNER') {
      throw new BadRequestException('Ce contrat ne peut plus être accepté ou refusé')
    }

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

  async getPartnerContract(userId: string, contractId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const contract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { id: contractId, logistics_partner_id: staff.logistics_partner_id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            district: true,
            logo: true,
            delivery_fulfilment_default: true,
          },
        },
      },
    })
    if (!contract) throw new NotFoundException('Contrat introuvable')

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      select: { sla_eta_default_minutes: true },
    })
    const stats = await this.computeContractStats(
      staff.logistics_partner_id,
      contract.shop_id ?? '',
      contract.sla_eta_max_minutes,
      partner?.sla_eta_default_minutes ?? 45,
    )

    return { ...contract, stats }
  }

  async updatePartnerContract(
    userId: string,
    contractId: string,
    dto: {
      sla_eta_max_minutes?: number
      fee_override?: number | null
      auto_dispatch?: boolean
      pause?: boolean
    },
  ) {
    const staff = await this.requirePartnerStaff(userId)
    const contract = await this.prisma.deliveryPartnerContract.findFirst({
      where: { id: contractId, logistics_partner_id: staff.logistics_partner_id },
    })
    if (!contract) throw new NotFoundException('Contrat introuvable')

    if (dto.pause !== undefined) {
      if (dto.pause && contract.status !== 'ACTIVE') {
        throw new BadRequestException('Seul un contrat actif peut être mis en pause')
      }
      if (!dto.pause && contract.status !== 'PAUSED') {
        throw new BadRequestException('Seul un contrat en pause peut être réactivé')
      }
    } else if (!['ACTIVE', 'PAUSED', 'PENDING_PARTNER', 'PENDING_MERCHANT'].includes(contract.status)) {
      throw new BadRequestException('Contrat non modifiable')
    }

    await this.prisma.deliveryPartnerContract.update({
      where: { id: contractId },
      data: {
        ...(dto.sla_eta_max_minutes !== undefined
          ? { sla_eta_max_minutes: dto.sla_eta_max_minutes }
          : {}),
        ...(dto.fee_override !== undefined ? { fee_override: dto.fee_override } : {}),
        ...(dto.auto_dispatch !== undefined ? { auto_dispatch: dto.auto_dispatch } : {}),
        ...(dto.pause === true ? { status: 'PAUSED' } : {}),
        ...(dto.pause === false ? { status: 'ACTIVE' } : {}),
      },
    })

    return this.getPartnerContract(userId, contractId)
  }

  async listPartnerProspects(userId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      include: { service_areas: { select: { commune_id: true } } },
    })
    if (!partner) throw new NotFoundException('Structure introuvable')

    const communeIds = partner.service_areas.map(a => a.commune_id)
    if (!communeIds.length) {
      return { prospects: [], communes_configured: false }
    }

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const blockedStatuses = ['ACTIVE', 'PENDING_PARTNER', 'PENDING_MERCHANT', 'PAUSED'] as const

    const shops = await this.prisma.shop.findMany({
      where: {
        status: 'ACTIVE',
        is_active: true,
        country: partner.country,
        delivery_fulfilment_default: { not: 'MERCHANT_OWN' },
        delivery_zones: {
          some: {
            is_active: true,
            rules: {
              some: {
                OR: [
                  {
                    all_communes: true,
                    city: { communes: { some: { id: { in: communeIds } } } },
                  },
                  { communes: { some: { commune_id: { in: communeIds } } } },
                ],
              },
            },
          },
        },
        NOT: {
          delivery_contracts: {
            some: {
              logistics_partner_id: partner.id,
              status: { in: [...blockedStatuses] },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        district: true,
        logo: true,
        delivery_fulfilment_default: true,
        delivery_zones: {
          where: { is_active: true },
          select: {
            rules: {
              select: {
                all_communes: true,
                communes: { select: { commune_id: true } },
              },
            },
          },
        },
        _count: {
          select: {
            orders: {
              where: {
                created_at: { gte: since30 },
                delivery_type: 'DELIVERY',
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 100,
    })

    const communes = await this.prisma.geoCommune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, name: true, latitude: true, longitude: true },
    })
    const communeById = new Map(communes.map(c => [c.id, c]))

    const prospects = shops.map(shop => {
      const matchedCommuneIds = new Set<string>()
      for (const zone of shop.delivery_zones) {
        for (const rule of zone.rules) {
          if (rule.all_communes) {
            communeIds.forEach(id => matchedCommuneIds.add(id))
          } else {
            for (const c of rule.communes) {
              if (communeIds.includes(c.commune_id)) matchedCommuneIds.add(c.commune_id)
            }
          }
        }
      }
      const primaryCommune = communeIds.map(id => communeById.get(id)).find(Boolean)

      return {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        city: shop.city,
        district: shop.district,
        logo: shop.logo,
        delivery_fulfilment_default: shop.delivery_fulfilment_default,
        estimated_deliveries_30d: shop._count.orders,
        matched_communes: [...matchedCommuneIds]
          .map(id => communeById.get(id)?.name)
          .filter(Boolean),
        latitude: primaryCommune?.latitude ?? null,
        longitude: primaryCommune?.longitude ?? null,
      }
    })

    prospects.sort((a, b) => b.estimated_deliveries_30d - a.estimated_deliveries_30d)

    return { prospects, communes_configured: true }
  }

  async proposePartnership(userId: string, shopId: string) {
    const staff = await this.requirePartnerStaff(userId)
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: staff.logistics_partner_id },
      include: { service_areas: { select: { commune_id: true } } },
    })
    if (!partner) throw new NotFoundException('Structure introuvable')
    if (partner.verification !== 'VERIFIED' || !partner.is_active) {
      throw new BadRequestException('Votre structure doit être vérifiée pour prospecter')
    }

    const { prospects } = await this.listPartnerProspects(userId)
    if (!prospects.some(p => p.id === shopId)) {
      throw new BadRequestException('Ce commerce n\'est pas éligible à une proposition')
    }

    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, owner_id: true },
    })
    if (!shop) throw new NotFoundException('Commerce introuvable')

    const existingProposal = await this.prisma.deliveryPartnerContract.findFirst({
      where: { shop_id: shopId, logistics_partner_id: partner.id },
    })

    const contract = existingProposal
      ? await this.prisma.deliveryPartnerContract.update({
          where: { id: existingProposal.id },
          data: {
            status: 'PENDING_MERCHANT',
            sla_eta_max_minutes: partner.sla_eta_default_minutes,
          },
          include: { shop: { select: { name: true } } },
        })
      : await this.prisma.deliveryPartnerContract.create({
          data: {
            shop_id: shopId,
            logistics_partner_id: partner.id,
            status: 'PENDING_MERCHANT',
            sla_eta_max_minutes: partner.sla_eta_default_minutes,
            auto_dispatch: partner.auto_dispatch_default,
          },
          include: { shop: { select: { name: true } } },
        })

    const scoreDetail = await this.scoring.computeForPartner(partner.id)
    const partnerLabel = partner.trade_name ?? partner.legal_name
    const grade = scoreDetail.grade ?? '—'

    await this.notificationQueue.enqueuePush({
      userId: shop.owner_id,
      type: 'delivery_contract_proposal',
      title: 'Proposition de livraison',
      body: `${partnerLabel} (score ${grade}) souhaite assurer les livraisons de ${shop.name}.`,
      data: {
        contract_id: contract.id,
        shop_id: shopId,
        partner_id: partner.id,
        partner_slug: partner.slug,
        partner_score: scoreDetail.score,
        partner_grade: grade,
        href: '/merchant/shop/delivery-zones?tab=partners',
      },
    })

    return contract
  }

  private async computeContractStats(
    partnerId: string,
    shopId: string,
    slaMinutes: number | null,
    defaultSla: number,
  ) {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sla = slaMinutes ?? defaultSla

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        logistics_partner_id: partnerId,
        status: 'DELIVERED',
        delivered_at: { gte: since30 },
        order: { shop_id: shopId },
      },
      select: {
        assigned_at: true,
        delivered_at: true,
        order: { select: { delivery_fee: true } },
      },
      orderBy: { delivered_at: 'desc' },
    })

    let onTime = 0
    for (const job of jobs) {
      if (!job.assigned_at || !job.delivered_at) continue
      const deadline = job.assigned_at.getTime() + sla * 60 * 1000 * 1.15
      if (job.delivered_at.getTime() <= deadline) onTime += 1
    }

    return {
      jobs_30d: jobs.length,
      revenue_30d: jobs.reduce((sum, j) => sum + (j.order.delivery_fee ?? 0), 0),
      sla_rate: jobs.length ? Math.round((onTime / jobs.length) * 100) : null,
      last_delivery_at: jobs[0]?.delivered_at ?? null,
    }
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
        order: { select: { shop_id: true } },
      },
    })
    if (!job?.logistics_partner_id || job.status !== 'PENDING') return false

    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: job.logistics_partner_id },
      select: { auto_dispatch_default: true },
    })
    if (!partner?.auto_dispatch_default) return false

    if (job.order.shop_id) {
      const contract = await this.prisma.deliveryPartnerContract.findFirst({
        where: {
          shop_id: job.order.shop_id,
          logistics_partner_id: job.logistics_partner_id,
          status: 'ACTIVE',
        },
        select: { auto_dispatch: true },
      })
      if (contract && !contract.auto_dispatch) return false
    }

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
      onboarding_step: partner.onboarding_step,
      address: partner.address,
      dispatch_pending_alert_minutes: partner.dispatch_pending_alert_minutes,
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
          ...(dto.dispatch_pending_alert_minutes !== undefined
            ? { dispatch_pending_alert_minutes: dto.dispatch_pending_alert_minutes }
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
    const url = await this.storage.uploadImage(
      file.buffer,
      file.mimetype,
      `logistics-logo/${staff.logistics_partner_id}`,
      'logo',
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
    const url = file.mimetype.startsWith('image/')
      ? await this.storage.uploadImage(
          file.buffer,
          file.mimetype,
          `logistics-kyc/${staff.logistics_partner_id}`,
          'general',
        )
      : await this.storage.uploadRaw(
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
