import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { OtpService } from '../otp/otp.service'
import { StorageService } from '../storage/storage.service'
import { QueryMerchantsDto } from './dto/query-merchants.dto'
import {
  getHighestPlan,
  getPlanLimits,
  isWithinLimit,
  planLimitMessage,
} from '../common/plan-limits'
import { OrganizationType } from '../../generated/prisma/client'
import { attachCardPreviewsToMerchants } from '../marketplace/vertical-preview'
import { uniqueMerchantSlug } from '../common/slug.util'
import { AdsService } from '../ads/ads.service'
import { CrmService } from '../crm/crm.service'
import { AdminNotificationsService } from '../notifications/admin-notifications.service'

const DEFAULT_CITY_BY_COUNTRY: Record<string, string> = {
  CI: 'Abidjan',
  BF: 'Ouagadougou',
  SN: 'Dakar',
}

function defaultCityForCountry(country: string) {
  return DEFAULT_CITY_BY_COUNTRY[country.toUpperCase()] ?? 'Abidjan'
}

function buildLocationFilter(opts: { city?: string; district?: string; country?: string }) {
  const country = (opts.country ?? 'CI').toUpperCase()
  return {
    country,
    ...(opts.city
      ? { city: { equals: opts.city, mode: 'insensitive' as const } }
      : {}),
    ...(opts.district
      ? { district: { contains: opts.district, mode: 'insensitive' as const } }
      : {}),
  }
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024


const MERCHANT_PUBLIC_SELECT = {
  id: true,
  business_name: true,
  slug: true,
  description: true,
  logo: true,
  cover_image: true,
  whatsapp: true,
  phone: true,
  website: true,
  verification_status: true,
  trust_score: true,
  is_sponsored: true,
  subscription_plan: true,
  created_at: true,
  category: {
    select: { id: true, name: true, slug: true, icon: true },
  },
  location: {
    select: { city: true, district: true, address: true, latitude: true, longitude: true },
  },
  hours: {
    select: { day: true, open_time: true, close_time: true, is_closed: true },
    orderBy: { day: 'asc' as const },
  },
  tags: {
    select: { tag: { select: { name: true } } },
  },
  _count: {
    select: {
      reviews: { where: { status: 'APPROVED' as const } },
      favorites: true,
    },
  },
} as const

const MERCHANT_MINI_SELECT = {
  id: true,
  business_name: true,
  slug: true,
  verification_status: true,
  subscription_plan: true,
  organization_id: true,
  cover_image: true,
  is_active: true,
  category: { select: { name: true, slug: true, icon: true } },
} as const

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
    private readonly ads: AdsService,
    private readonly crm: CrmService,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  // ── Helper : résoudre l'établissement actif d'un utilisateur ────────────────
  private async resolveMyMerchant(userId: string, merchantId?: string) {
    const where = merchantId
      ? { id: merchantId, owner_id: userId }
      : { owner_id: userId }
    const m = await this.prisma.merchant.findFirst({ where })
    if (!m) throw new NotFoundException('Merchant not found')
    return m
  }

  // ── Liste publique ──────────────────────────────────────────────────────────

  async findAll(query: QueryMerchantsDto) {
    const country = (query.country ?? 'CI').toUpperCase()
    const where = {
      is_active: true,
      location: buildLocationFilter({
        city: query.city,
        district: query.district,
        country,
      }),
      ...(query.category && {
        category: { slug: query.category },
      }),
    }

    const categoryBoostIds = query.category
      ? await this.ads.getActiveMerchantIdsForPlacement('CATEGORY')
      : new Set<string>()

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        select: MERCHANT_PUBLIC_SELECT,
        orderBy: { [query.sort ?? 'trust_score']: 'desc' },
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
      }),
      this.prisma.merchant.count({ where }),
    ])

    let orderedMerchants = merchants
    if (categoryBoostIds.size > 0) {
      const boosted = merchants.filter(m => categoryBoostIds.has(m.id))
      const regular = merchants.filter(m => !categoryBoostIds.has(m.id))
      orderedMerchants = [...boosted.slice(0, 3), ...regular]
    }

    const formatted = orderedMerchants.map(m => {
      const row = this.formatMerchant(m)
      if (categoryBoostIds.has(m.id)) {
        ;(row as { is_sponsored: boolean }).is_sponsored = true
      }
      return row
    })

    return {
      data: await attachCardPreviewsToMerchants(this.prisma, formatted),
      meta: {
        total,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      },
    }
  }

  async findFeatured(city?: string, limit = 6, country = 'CI') {
    const cc = country.toUpperCase()
    const resolvedCity = city ?? defaultCityForCountry(cc)
    const baseWhere = {
      is_active: true,
      location: buildLocationFilter({ city: resolvedCity, country: cc }),
    }

    const featuredBoostIds = await this.ads.getActiveMerchantIdsForPlacement('FEATURED')
    const boostIdList = [...featuredBoostIds]

    const boosted = boostIdList.length
      ? await this.prisma.merchant.findMany({
          where: { ...baseWhere, id: { in: boostIdList }, verification_status: 'VERIFIED' },
          select: MERCHANT_PUBLIC_SELECT,
        })
      : []

    const verified = await this.prisma.merchant.findMany({
      where: {
        ...baseWhere,
        verification_status: 'VERIFIED',
        ...(boostIdList.length ? { id: { notIn: boostIdList } } : {}),
      },
      select: MERCHANT_PUBLIC_SELECT,
      orderBy: [{ is_sponsored: 'desc' }, { trust_score: 'desc' }],
      take: limit,
    })

    const seen = new Set<string>()
    let merchants = [...boosted, ...verified].filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    }).slice(0, limit)

    if (merchants.length < limit) {
      const usedIds = new Set(merchants.map(m => m.id))
      const fallback = await this.prisma.merchant.findMany({
        where: {
          ...baseWhere,
          id: usedIds.size ? { notIn: [...usedIds] } : undefined,
        },
        select: MERCHANT_PUBLIC_SELECT,
        orderBy: [{ is_sponsored: 'desc' }, { trust_score: 'desc' }],
        take: limit - merchants.length,
      })
      merchants = [...merchants, ...fallback]
    }

    return attachCardPreviewsToMerchants(
      this.prisma,
      merchants.map(m => {
        const formatted = this.formatMerchant(m)
        if (featuredBoostIds.has(m.id)) {
          ;(formatted as { is_sponsored: boolean }).is_sponsored = true
        }
        return formatted
      }),
    )
  }

  async findNearby(city?: string, district?: string, lat?: number, lng?: number, radiusKm = 2, limit = 6, country = 'CI') {
    const cc = country.toUpperCase()
    const resolvedCity = city ?? defaultCityForCountry(cc)
    const merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        location: buildLocationFilter({ city: resolvedCity, district, country: cc }),
      },
      select: MERCHANT_PUBLIC_SELECT,
      orderBy: { trust_score: 'desc' },
      take: lat && lng ? 100 : limit,
    })

    if (lat && lng) {
      const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371
        const dLat = ((lat2 - lat1) * Math.PI) / 180
        const dLng = ((lng2 - lng1) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }

      const withDistance = merchants
        .filter(m => m.location?.latitude && m.location?.longitude)
        .map(m => ({
          ...m,
          _distance_km: haversine(lat, lng, m.location!.latitude!, m.location!.longitude!),
        }))
        .filter(m => m._distance_km <= radiusKm)
        .sort((a, b) => a._distance_km - b._distance_km)
        .slice(0, limit)

      return attachCardPreviewsToMerchants(
        this.prisma,
        withDistance.map(({ _distance_km, ...m }) => {
          const formatted = this.formatMerchant(m as Record<string, unknown> & { id: string })
          return { ...formatted, distance_km: Math.round(_distance_km * 10) / 10 }
        }),
      )
    }

    return attachCardPreviewsToMerchants(
      this.prisma,
      merchants.map(m => this.formatMerchant(m)),
    )
  }

  async findBySlug(slug: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { slug, is_active: true },
      select: {
        ...MERCHANT_PUBLIC_SELECT,
        email: true,
        reviews: {
          where: { status: 'APPROVED' },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            created_at: true,
            user: { select: { id: true, full_name: true, avatar: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 4,
        },
        media: {
          select: { id: true, type: true, url: true, thumbnail: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!merchant) throw new NotFoundException(`Merchant "${slug}" not found`)

    const ratings = merchant.reviews.map(r => r.rating)
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null

    const formatted = this.formatMerchant(merchant as Record<string, unknown> & { id: string })

    return {
      ...formatted,
      email: merchant.email,
      reviews: merchant.reviews,
      media: merchant.media,
      avg_rating: avgRating,
    }
  }

  async trackInteraction(merchantId: string, eventType: string, userId?: string) {
    const validEvents = [
      'VIEW', 'CALL_CLICK', 'WHATSAPP_CLICK',
      'DIRECTION_CLICK', 'WEBSITE_CLICK', 'SAVE', 'REVIEW', 'SHARE',
    ]
    if (!validEvents.includes(eventType)) return

    await this.prisma.merchantInteraction.create({
      data: {
        merchant_id: merchantId,
        user_id: userId ?? null,
        event_type: eventType as never,
      },
    })
  }

  // ── Mes établissements ──────────────────────────────────────────────────────

  async findAllMine(userId: string) {
    const merchants = await this.prisma.merchant.findMany({
      where: { owner_id: userId },
      select: MERCHANT_MINI_SELECT,
      orderBy: { created_at: 'asc' },
    })
    return merchants
  }

  async registerMerchant(
    data: {
      business_name: string; category_slug: string; description?: string;
      phone?: string; whatsapp?: string; address?: string; district?: string; city?: string;
      country_code?: string;
      organization_id?: string;
      create_organization?: { name: string; type: OrganizationType };
    },
    userId: string,
  ) {
    const existingMerchants = await this.prisma.merchant.findMany({
      where: { owner_id: userId },
      select: { subscription_plan: true },
    })

    const effectivePlan = getHighestPlan(existingMerchants)
    const limits = getPlanLimits(effectivePlan)

    if (!isWithinLimit(existingMerchants.length, limits.maxEstablishments)) {
      throw new ForbiddenException(planLimitMessage('establishments', effectivePlan))
    }

    let organizationId: string | null = data.organization_id ?? null

    if (data.create_organization) {
      if (!limits.orgAllowed) {
        throw new ForbiddenException(planLimitMessage('organization', effectivePlan))
      }
      const existingOrg = await this.prisma.merchantOrganization.findUnique({
        where: { owner_id: userId },
      })
      if (existingOrg) {
        organizationId = existingOrg.id
      } else {
        const org = await this.prisma.merchantOrganization.create({
          data: {
            name: data.create_organization.name,
            type: data.create_organization.type,
            owner_id: userId,
          },
        })
        organizationId = org.id
      }
    } else if (organizationId) {
      if (!limits.orgAllowed) {
        throw new ForbiddenException(planLimitMessage('organization', effectivePlan))
      }
      const org = await this.prisma.merchantOrganization.findFirst({
        where: { id: organizationId, owner_id: userId },
      })
      if (!org) throw new BadRequestException('Organisation introuvable')
    }

    const category = await this.prisma.category.findUnique({ where: { slug: data.category_slug } })
    if (!category) throw new BadRequestException('Catégorie introuvable')

    const slug = await uniqueMerchantSlug(this.prisma, data.business_name)

    const countryCode = (data.country_code ?? 'CI').toUpperCase()

    const merchant = await this.prisma.merchant.create({
      data: {
        business_name: data.business_name,
        slug,
        description: data.description ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        category_id: category.id,
        owner_id: userId,
        organization_id: organizationId,
        verification_status: 'PENDING',
        is_active: false,
        location: data.district ? {
          create: {
            city: data.city ?? defaultCityForCountry(countryCode),
            country: countryCode,
            district: data.district,
            address: data.address ?? null,
          },
        } : undefined,
      },
      select: {
        id: true, business_name: true, slug: true,
        verification_status: true, is_active: true, organization_id: true, created_at: true,
      },
    })

    // Met à jour le rôle user → MERCHANT (idempotent)
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'MERCHANT' },
    })

    void this.adminNotifications.merchantPendingReview(merchant.id, merchant.business_name)

    return merchant
  }

  async findMine(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      select: {
        ...MERCHANT_PUBLIC_SELECT,
        email: true,
        owner_id: true,
        is_active: true,
      },
    })
    if (!merchant) return null
    return this.formatMerchant(merchant)
  }

  async getMyHours(userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const hours = await this.prisma.businessHour.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { day: 'asc' },
      select: { id: true, day: true, open_time: true, close_time: true, is_closed: true },
    })
    return this.dedupeBusinessHours(hours)
  }

  async updateMyHours(
    hours: Array<{ day: number; open_time?: string; close_time?: string; is_closed?: boolean }>,
    userId: string,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const normalized = this.normalizeBusinessHoursInput(hours)

    await this.prisma.$transaction([
      this.prisma.businessHour.deleteMany({ where: { merchant_id: merchant.id } }),
      this.prisma.businessHour.createMany({
        data: normalized.map(h => ({
          merchant_id: merchant.id,
          day: h.day,
          open_time: h.is_closed ? null : (h.open_time ?? null),
          close_time: h.is_closed ? null : (h.close_time ?? null),
          is_closed: h.is_closed ?? false,
        })),
      }),
    ])

    return this.getMyHours(userId, merchantId)
  }

  async getMyMedia(
    userId: string,
    merchantId?: string,
    opts?: { page?: number; limit?: number },
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const page = Math.max(1, opts?.page ?? 1)
    const limit = Math.min(48, Math.max(1, opts?.limit ?? 24))
    const skip = (page - 1) * limit
    const where = { merchant_id: merchant.id, type: 'IMAGE' as const }

    const [media, total] = await Promise.all([
      this.prisma.merchantMedia.findMany({
        where,
        orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
        skip,
        take: limit,
        select: { id: true, type: true, url: true, thumbnail: true, order: true, created_at: true },
      }),
      this.prisma.merchantMedia.count({ where }),
    ])

    const limits = getPlanLimits(merchant.subscription_plan)

    return {
      logo: merchant.logo,
      cover_image: merchant.cover_image,
      gallery: media,
      pagination: {
        page,
        limit,
        total,
        has_more: skip + media.length < total,
      },
      limits: {
        max_photos: limits.maxPhotos,
        current_photos: total,
        can_add: isWithinLimit(total, limits.maxPhotos),
        plan: merchant.subscription_plan,
      },
    }
  }

  async uploadMyMediaFile(userId: string, file: Express.Multer.File, merchantId?: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis')
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG ou WebP')
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Taille maximale : 5 Mo')
    }

    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const url = await this.storage.uploadImage(
      file.buffer,
      file.mimetype,
      `merchants/${merchant.id}`,
      'general',
    )
    return this.addMyMedia({ url, type: 'IMAGE' }, userId, merchantId)
  }

  async addMyMedia(
    data: { url: string; type?: string; order?: number },
    userId: string,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const mediaType = data.type ?? 'IMAGE'

    if (mediaType === 'IMAGE') {
      const photoCount = await this.prisma.merchantMedia.count({
        where: { merchant_id: merchant.id, type: 'IMAGE' },
      })
      const limits = getPlanLimits(merchant.subscription_plan)
      if (!isWithinLimit(photoCount, limits.maxPhotos)) {
        throw new ForbiddenException(planLimitMessage('photos', merchant.subscription_plan))
      }
    }

    const count = await this.prisma.merchantMedia.count({ where: { merchant_id: merchant.id } })

    return this.prisma.merchantMedia.create({
      data: {
        merchant_id: merchant.id,
        url: data.url,
        type: mediaType as never,
        order: data.order ?? count,
        uploaded_by: userId,
      },
      select: { id: true, type: true, url: true, order: true, created_at: true },
    })
  }

  async deleteMyMedia(mediaId: string, userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const media = await this.prisma.merchantMedia.findFirst({
      where: { id: mediaId, merchant_id: merchant.id },
    })
    if (!media) throw new NotFoundException('Media not found')

    await this.prisma.merchantMedia.delete({ where: { id: mediaId } })
    return { deleted: true }
  }

  async setMyCoverImage(url: string, userId: string, field: 'logo' | 'cover_image', merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { [field]: url },
      select: { id: true, logo: true, cover_image: true },
    })
  }

  async sendPhoneVerification(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      select: { id: true, phone: true, whatsapp: true },
    })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const phone = merchant.whatsapp ?? merchant.phone
    if (!phone) throw new BadRequestException('Aucun numéro de téléphone configuré')

    const result = await this.otp.send(phone, 'merchant_verify')
    return { ...result, phone_masked: phone.replace(/(\d{2})\d+(\d{2})/, '$1****$2') }
  }

  async confirmPhoneVerification(userId: string, code: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      select: { id: true, phone: true, whatsapp: true },
    })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const phone = merchant.whatsapp ?? merchant.phone
    if (!phone) throw new BadRequestException('Aucun numéro configuré')

    const valid = await this.otp.verify(phone, 'merchant_verify', code)
    if (!valid) throw new BadRequestException('Code OTP invalide ou expiré')

    await this.prisma.$transaction([
      this.prisma.merchantVerification.create({
        data: {
          merchant_id: merchant.id,
          verification_type: 'PHONE',
          status: 'approved',
          verified_at: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { is_verified: true, phone: phone },
      }),
    ])

    return { verified: true, message: 'Téléphone vérifié avec succès' }
  }

  async getPhoneVerificationStatus(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      select: {
        id: true,
        verifications: {
          where: { verification_type: 'PHONE', status: 'approved' },
          select: { id: true, verified_at: true },
          take: 1,
        },
      },
    })
    if (!merchant) return { phone_verified: false }

    return {
      phone_verified: merchant.verifications.length > 0,
      verified_at: merchant.verifications[0]?.verified_at ?? null,
    }
  }

  async getMyAnalytics(userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const [interactions, reviewStats, favoritesCount] = await Promise.all([
      this.prisma.merchantInteraction.groupBy({
        by: ['event_type'],
        where: { merchant_id: merchant.id },
        _count: { event_type: true },
      }),
      this.prisma.review.aggregate({
        where: { merchant_id: merchant.id, status: 'APPROVED' },
        _count: true,
        _avg: { rating: true },
      }),
      this.prisma.favorite.count({ where: { merchant_id: merchant.id } }),
    ])

    const views = interactions.find(i => i.event_type === 'VIEW')?._count.event_type ?? 0
    const whatsappClicks = interactions.find(i => i.event_type === 'WHATSAPP_CLICK')?._count.event_type ?? 0
    const callClicks = interactions.find(i => i.event_type === 'CALL_CLICK')?._count.event_type ?? 0

    return {
      views,
      whatsapp_clicks: whatsappClicks,
      call_clicks: callClicks,
      favorites: favoritesCount,
      reviews: {
        count: reviewStats._count,
        avg_rating: reviewStats._avg.rating
          ? Math.round(reviewStats._avg.rating * 10) / 10
          : null,
      },
      interactions: interactions.map(i => ({
        event_type: i.event_type,
        count: i._count.event_type,
      })),
    }
  }

  async getMyAnalyticsChart(
    userId: string,
    days = 30,
    merchantId?: string,
    eventType = 'VIEW',
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    return this.buildInteractionChart([merchant.id], days, eventType)
  }

  private async buildInteractionChart(merchantIds: string[], days: number, eventType: string) {
    const validEvents = [
      'VIEW', 'CALL_CLICK', 'WHATSAPP_CLICK',
      'DIRECTION_CLICK', 'WEBSITE_CLICK', 'SAVE', 'REVIEW', 'SHARE',
    ]
    const event = validEvents.includes(eventType) ? eventType : 'VIEW'
    const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? Math.floor(days) : 30

    const since = new Date()
    since.setDate(since.getDate() - safeDays + 1)
    since.setHours(0, 0, 0, 0)

    const interactions = await this.prisma.merchantInteraction.findMany({
      where: {
        merchant_id: { in: merchantIds },
        event_type: event as never,
        created_at: { gte: since },
      },
      select: { created_at: true },
    })

    const byDay: Record<string, number> = {}
    for (let d = 0; d < safeDays; d++) {
      const dt = new Date(since)
      dt.setDate(since.getDate() + d)
      byDay[dt.toISOString().slice(0, 10)] = 0
    }
    for (const row of interactions) {
      const key = row.created_at.toISOString().slice(0, 10)
      if (key in byDay) byDay[key]++
    }

    return {
      days: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      total: interactions.length,
      period_days: safeDays,
      event_type: event,
    }
  }

  async updateMine(
    data: {
      business_name?: string; description?: string; phone?: string;
      whatsapp?: string; website?: string; email?: string;
      district?: string; address?: string; city?: string; country?: string;
      latitude?: number | null; longitude?: number | null;
      logo?: string; cover_image?: string;
    },
    userId: string,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const {
      district,
      address,
      city,
      country,
      latitude,
      longitude,
    } = data

    const merchantPatch = {
      ...(data.business_name !== undefined ? { business_name: data.business_name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.logo !== undefined ? { logo: data.logo } : {}),
      ...(data.cover_image !== undefined ? { cover_image: data.cover_image } : {}),
    }

    const locationPatch: Record<string, unknown> = {}
    if (district !== undefined) locationPatch.district = district || null
    if (address !== undefined) locationPatch.address = address || null
    if (city !== undefined) locationPatch.city = city
    if (country !== undefined) locationPatch.country = country.toUpperCase()
    if (latitude !== undefined) locationPatch.latitude = latitude
    if (longitude !== undefined) locationPatch.longitude = longitude

    const hasLocationUpdate = Object.keys(locationPatch).length > 0

    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        ...merchantPatch,
        ...(hasLocationUpdate ? {
          location: {
            upsert: {
              create: {
                city: city ?? defaultCityForCountry(country ?? 'CI'),
                country: (country ?? 'CI').toUpperCase(),
                district: district ?? null,
                address: address ?? null,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
              },
              update: locationPatch,
            },
          },
        } : {}),
      },
      select: {
        id: true, business_name: true, slug: true, description: true,
        phone: true, whatsapp: true, website: true, email: true,
        verification_status: true, trust_score: true, is_active: true,
        location: { select: { city: true, district: true, address: true, latitude: true, longitude: true } },
      },
    })
    return updated
  }

  // ── Similar merchants ─────────────────────────────────────────────────────────

  async findSimilar(slug: string, limit = 4) {
    const source = await this.prisma.merchant.findUnique({
      where: { slug },
      select: { id: true, category_id: true, location: { select: { city: true, district: true } } },
    })
    if (!source) throw new NotFoundException('Merchant not found')

    const where = {
      id: { not: source.id },
      is_active: true,
      verification_status: 'VERIFIED' as const,
      category_id: source.category_id,
      ...(source.location?.district
        ? { location: { district: source.location.district } }
        : source.location?.city
        ? { location: { city: source.location.city } }
        : {}),
    }

    const merchants = await this.prisma.merchant.findMany({
      where,
      orderBy: { trust_score: 'desc' },
      take: limit,
      select: {
        ...MERCHANT_PUBLIC_SELECT,
        _count: { select: { reviews: { where: { status: 'APPROVED' } }, favorites: true } },
      },
    })

    return merchants.map(m => this.formatMerchant(m))
  }

  // ── Trust Score ───────────────────────────────────────────────────────────────

  async recalculateTrustScore(merchantId: string): Promise<number> {
    const m = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        owner: { select: { is_verified: true } },
        location: true,
        _count: { select: { reviews: true, favorites: true } },
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
        complaints: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } }, select: { id: true } },
      },
    })
    if (!m) throw new NotFoundException('Merchant not found')

    let score = 0

    if (m.owner?.is_verified) score += 20

    const completenessPoints = [
      m.description && m.description.length > 50 ? 8 : m.description ? 4 : 0,
      m.logo ? 6 : 0,
      m.cover_image ? 6 : 0,
      m.phone ? 3 : 0,
      m.whatsapp ? 2 : 0,
    ]
    score += completenessPoints.reduce((a, b) => a + b, 0)

    const reviewCount = m._count.reviews
    const reviewPoints = Math.min(30, reviewCount * 3)
    score += reviewPoints

    if (m.reviews.length > 0) {
      const avg = m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length
      score += Math.round((avg / 5) * 15)
    }

    const penaltyPoints = m.complaints.length * 10
    score = Math.max(0, score - penaltyPoints)

    if (m._count.favorites >= 5) score += 5

    const finalScore = Math.min(100, score)

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { trust_score: finalScore },
    })

    return finalScore
  }

  async recalculateAllTrustScores(): Promise<{ updated: number }> {
    const merchants = await this.prisma.merchant.findMany({ select: { id: true } })
    let updated = 0
    for (const m of merchants) {
      try {
        await this.recalculateTrustScore(m.id)
        updated++
      } catch {
        // skip individual failures
      }
    }
    return { updated }
  }

  async getMyCRM(userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const limits = getPlanLimits(merchant.subscription_plan)
    if (!limits.crm) {
      throw new ForbiddenException('Le CRM nécessite le plan Starter ou supérieur.')
    }

    return this.crm.getMerchantCRM(merchant.id)
  }

  async getMyCRMDetail(userId: string, customerId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)

    const limits = getPlanLimits(merchant.subscription_plan)
    if (!limits.crm) {
      throw new ForbiddenException('Le CRM nécessite le plan Starter ou supérieur.')
    }

    const shop = await this.prisma.shop.findFirst({
      where: { merchant_id: merchant.id },
      select: { id: true },
    })

    const detail = await this.crm.getCustomerDetail(customerId, {
      merchantId: merchant.id,
      shopId: shop?.id,
    })
    if (!detail) throw new NotFoundException('Contact introuvable')
    return detail
  }

  private dedupeBusinessHours<T extends { day: number }>(hours: T[]): T[] {
    const byDay = new Map<number, T>()
    for (const hour of hours) {
      if (!byDay.has(hour.day)) byDay.set(hour.day, hour)
    }
    return Array.from(byDay.values()).sort((a, b) => a.day - b.day)
  }

  private normalizeBusinessHoursInput(
    hours: Array<{ day: number; open_time?: string; close_time?: string; is_closed?: boolean }>,
  ) {
    const days = hours.map(h => h.day)
    if (days.some(day => day < 0 || day > 6 || !Number.isInteger(day))) {
      throw new BadRequestException('Chaque jour doit être un entier entre 0 (dimanche) et 6 (samedi)')
    }
    if (new Set(days).size !== days.length) {
      throw new BadRequestException('Un seul horaire par jour est autorisé')
    }
    return this.dedupeBusinessHours(hours)
  }

  private formatMerchant<T extends Record<string, unknown>>(m: T): T & {
    tags: string[]
    review_count: number
    favorites_count: number
    _count: undefined
  } {
    const tags = (m.tags as Array<{ tag: { name: string } }> | undefined)?.map(t => t.tag.name) ?? []
    const count = m._count as { reviews?: number; favorites?: number } | undefined
    const rawHours = m.hours as Array<{ day: number }> | undefined
    return {
      ...m,
      ...(rawHours ? { hours: this.dedupeBusinessHours(rawHours) } : {}),
      tags,
      review_count: count?.reviews ?? 0,
      favorites_count: count?.favorites ?? 0,
      _count: undefined,
    }
  }
}
