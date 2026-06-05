import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { OtpService } from '../otp/otp.service'
import { StorageService } from '../storage/storage.service'
import { QueryMerchantsDto } from './dto/query-merchants.dto'

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

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: QueryMerchantsDto) {
    const where = {
      is_active: true,
      ...(query.city && {
        location: { city: { equals: query.city, mode: 'insensitive' as const } },
      }),
      ...(query.district && {
        location: { district: { contains: query.district, mode: 'insensitive' as const } },
      }),
      ...(query.category && {
        category: { slug: query.category },
      }),
    }

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

    return {
      data: merchants.map(this.formatMerchant),
      meta: {
        total,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      },
    }
  }

  async findFeatured(city = 'Abidjan', limit = 6) {
    const merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        verification_status: 'VERIFIED',
        location: { city: { equals: city, mode: 'insensitive' } },
      },
      select: MERCHANT_PUBLIC_SELECT,
      orderBy: [{ is_sponsored: 'desc' }, { trust_score: 'desc' }],
      take: limit,
    })
    return merchants.map(this.formatMerchant)
  }

  async findNearby(city = 'Abidjan', district?: string, lat?: number, lng?: number, radiusKm = 2, limit = 6) {
    const merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        location: {
          city: { equals: city, mode: 'insensitive' },
          ...(district && { district: { contains: district, mode: 'insensitive' } }),
        },
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

      return withDistance.map(({ _distance_km, ...m }) => ({
        ...this.formatMerchant(m),
        distance_km: Math.round(_distance_km * 10) / 10,
      }))
    }

    return merchants.map(this.formatMerchant)
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
          take: 10,
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

    return {
      ...this.formatMerchant(merchant),
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

  async registerMerchant(
    data: {
      business_name: string; category_slug: string; description?: string;
      phone?: string; whatsapp?: string; address?: string; district?: string; city?: string;
    },
    userId: string,
  ) {
    const existing = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (existing) {
      throw new ConflictException('Vous avez déjà un établissement enregistré. Accédez à votre dashboard marchand.')
    }

    const category = await this.prisma.category.findUnique({ where: { slug: data.category_slug } })
    if (!category) throw new BadRequestException('Catégorie introuvable')

    const slug = data.business_name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36)

    const merchant = await this.prisma.merchant.create({
      data: {
        business_name: data.business_name,
        slug,
        description: data.description ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        category_id: category.id,
        owner_id: userId,
        verification_status: 'PENDING',
        is_active: false,
        location: data.district ? {
          create: {
            city: data.city ?? 'Abidjan',
            country: 'CI',
            district: data.district,
            address: data.address ?? null,
          },
        } : undefined,
      },
      select: {
        id: true, business_name: true, slug: true,
        verification_status: true, is_active: true, created_at: true,
      },
    })

    // Met à jour le rôle user → MERCHANT
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'MERCHANT' },
    })

    return merchant
  }

  async findMine(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
      select: {
        ...MERCHANT_PUBLIC_SELECT,
        email: true,
        owner_id: true,
      },
    })
    if (!merchant) return null
    return this.formatMerchant(merchant)
  }

  async getMyHours(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const hours = await this.prisma.businessHour.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { day: 'asc' },
      select: { id: true, day: true, open_time: true, close_time: true, is_closed: true },
    })
    return hours
  }

  async updateMyHours(
    hours: Array<{ day: number; open_time?: string; close_time?: string; is_closed?: boolean }>,
    userId: string,
  ) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    await this.prisma.$transaction([
      this.prisma.businessHour.deleteMany({ where: { merchant_id: merchant.id } }),
      this.prisma.businessHour.createMany({
        data: hours.map(h => ({
          merchant_id: merchant.id,
          day: h.day,
          open_time: h.is_closed ? null : (h.open_time ?? null),
          close_time: h.is_closed ? null : (h.close_time ?? null),
          is_closed: h.is_closed ?? false,
        })),
      }),
    ])

    return this.getMyHours(userId)
  }

  async getMyMedia(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
      select: { id: true, logo: true, cover_image: true },
    })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const media = await this.prisma.merchantMedia.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { order: 'asc' },
      select: { id: true, type: true, url: true, thumbnail: true, order: true, created_at: true },
    })

    return { logo: merchant.logo, cover_image: merchant.cover_image, gallery: media }
  }

  async uploadMyMediaFile(userId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis')
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG ou WebP')
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Taille maximale : 5 Mo')
    }

    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const url = await this.storage.upload(file.buffer, file.mimetype, `merchants/${merchant.id}`)
    return this.addMyMedia({ url, type: 'IMAGE' }, userId)
  }

  async addMyMedia(
    data: { url: string; type?: string; order?: number },
    userId: string,
  ) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const count = await this.prisma.merchantMedia.count({ where: { merchant_id: merchant.id } })

    return this.prisma.merchantMedia.create({
      data: {
        merchant_id: merchant.id,
        url: data.url,
        type: (data.type ?? 'IMAGE') as never,
        order: data.order ?? count,
        uploaded_by: userId,
      },
      select: { id: true, type: true, url: true, order: true, created_at: true },
    })
  }

  async deleteMyMedia(mediaId: string, userId: string) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const media = await this.prisma.merchantMedia.findFirst({
      where: { id: mediaId, merchant_id: merchant.id },
    })
    if (!media) throw new NotFoundException('Media not found')

    await this.prisma.merchantMedia.delete({ where: { id: mediaId } })
    return { deleted: true }
  }

  async setMyCoverImage(url: string, userId: string, field: 'logo' | 'cover_image') {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { [field]: url },
      select: { id: true, logo: true, cover_image: true },
    })
  }

  async sendPhoneVerification(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
      select: { id: true, phone: true, whatsapp: true },
    })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const phone = merchant.whatsapp ?? merchant.phone
    if (!phone) throw new BadRequestException('Aucun numéro de téléphone configuré')

    const result = await this.otp.send(phone, 'merchant_verify')
    return { ...result, phone_masked: phone.replace(/(\d{2})\d+(\d{2})/, '$1****$2') }
  }

  async confirmPhoneVerification(userId: string, code: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
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

  async getPhoneVerificationStatus(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
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

  async getMyAnalytics(userId: string) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

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

  async getMyAnalyticsChart(userId: string, days = 30) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const since = new Date()
    since.setDate(since.getDate() - days + 1)
    since.setHours(0, 0, 0, 0)

    const interactions = await this.prisma.merchantInteraction.findMany({
      where: {
        merchant_id: merchant.id,
        event_type: 'VIEW',
        created_at: { gte: since },
      },
      select: { created_at: true },
    })

    // Group by day
    const byDay: Record<string, number> = {}
    for (let d = 0; d < days; d++) {
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
      period_days: days,
    }
  }

  async updateMine(
    data: {
      business_name?: string; description?: string; phone?: string;
      whatsapp?: string; website?: string; email?: string;
      district?: string; address?: string;
      logo?: string; cover_image?: string;
    },
    userId: string,
  ) {
    const merchant = await this.prisma.merchant.findFirst({ where: { owner_id: userId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const { district, address, ...merchantData } = data

    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        ...merchantData,
        ...(district || address ? {
          location: {
            upsert: {
              create: { city: 'Abidjan', country: 'CI', district: district ?? null, address: address ?? null },
              update: { district: district ?? undefined, address: address ?? undefined },
            },
          },
        } : {}),
      },
      select: {
        id: true, business_name: true, slug: true, description: true,
        phone: true, whatsapp: true, website: true, email: true,
        verification_status: true, trust_score: true, is_active: true,
        location: { select: { city: true, district: true, address: true } },
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

    return merchants.map(m => this.formatMerchant(m as Record<string, unknown>))
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

    // Signal 1 : phone OTP verified (+20)
    if (m.owner?.is_verified) score += 20

    // Signal 2 : profile completeness (up to +25)
    const completenessPoints = [
      m.description && m.description.length > 50 ? 8 : m.description ? 4 : 0,
      m.logo ? 6 : 0,
      m.cover_image ? 6 : 0,
      m.phone ? 3 : 0,
      m.whatsapp ? 2 : 0,
    ]
    score += completenessPoints.reduce((a, b) => a + b, 0)

    // Signal 3 : approved reviews quantity (up to +30)
    const reviewCount = m._count.reviews
    const reviewPoints = Math.min(30, reviewCount * 3)
    score += reviewPoints

    // Signal 4 : avg rating (up to +15)
    if (m.reviews.length > 0) {
      const avg = m.reviews.reduce((s, r) => s + r.rating, 0) / m.reviews.length
      score += Math.round((avg / 5) * 15)
    }

    // Signal 5 : active complaints (−10 each, min 0)
    const penaltyPoints = m.complaints.length * 10
    score = Math.max(0, score - penaltyPoints)

    // Signal 6 : favorites bonus (+5)
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

  async getMyCRM(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { owner_id: userId },
      select: { id: true },
    })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const now = new Date()
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const days180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    // All reviewers of this merchant
    const allReviews = await this.prisma.review.findMany({
      where: { merchant_id: merchant.id, status: 'APPROVED' },
      select: {
        user_id: true,
        rating: true,
        created_at: true,
        user: { select: { id: true, full_name: true, email: true, created_at: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    // Group reviews by user
    const byUser = new Map<string, { user: typeof allReviews[0]['user']; reviews: typeof allReviews }>()
    for (const r of allReviews) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, { user: r.user, reviews: [] })
      byUser.get(r.user_id)!.reviews.push(r)
    }

    const customers = Array.from(byUser.values()).map(({ user, reviews }) => {
      const lastReviewAt = reviews[0]?.created_at ?? null
      const reviewCount = reviews.length
      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      const isRecent = lastReviewAt && lastReviewAt >= days30
      const isInactive = lastReviewAt && lastReviewAt < days90 && lastReviewAt >= days180
      const isLost = lastReviewAt && lastReviewAt < days180
      const segment: 'recent' | 'inactive' | 'lost' | 'regular' =
        isLost ? 'lost' : isInactive ? 'inactive' : isRecent ? 'recent' : 'regular'
      return { ...user, reviewCount, avgRating: Math.round(avgRating * 10) / 10, lastReviewAt, segment }
    })

    const recent = customers.filter(c => c.segment === 'recent')
    const inactive = customers.filter(c => c.segment === 'inactive')
    const lost = customers.filter(c => c.segment === 'lost')
    const regular = customers.filter(c => c.segment === 'regular')

    // Recent reviewers this month (unique users)
    const recentReviewers = new Set(
      allReviews.filter(r => r.created_at >= days30).map(r => r.user_id),
    ).size

    return {
      summary: {
        total_customers: customers.length,
        recent_30d: recent.length,
        inactive_90d: inactive.length,
        lost_180d: lost.length,
        regular: regular.length,
        recent_reviewers_30d: recentReviewers,
      },
      customers: customers.sort((a, b) => {
        const segOrder = { recent: 0, regular: 1, inactive: 2, lost: 3 }
        return segOrder[a.segment] - segOrder[b.segment]
      }),
    }
  }

  private formatMerchant(m: Record<string, unknown>) {
    const tags = (m.tags as Array<{ tag: { name: string } }> | undefined)?.map(t => t.tag.name) ?? []
    const count = m._count as { reviews?: number; favorites?: number } | undefined
    return {
      ...m,
      tags,
      review_count: count?.reviews ?? 0,
      favorites_count: count?.favorites ?? 0,
      _count: undefined,
    }
  }
}
