import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type UserSnapshot = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: Date
}

export type CrmCustomerRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: Date
  isGuest: boolean
  profileType: 'registered' | 'guest'
  reviewCount: number
  avgRating: number
  lastReviewAt: Date | null
  lastBookingAt: Date | null
  bookingCount: number
  orderCount: number
  lastOrderAt: Date | null
  totalSpent: number
  isFavorite: boolean
  productFavoriteCount: number
  interactionCount: number
  lastInteractionAt: Date | null
  promoRedemptionCount: number
  sources: string[]
  customerType: 'client' | 'prospect'
  segment: 'recent' | 'inactive' | 'lost' | 'regular'
  lastActivityAt: Date | null
}

export type CrmSummary = {
  total_customers: number
  total_prospects: number
  recent_30d: number
  inactive_90d: number
  lost_180d: number
  regular: number
  recent_reviewers_30d: number
  total_orders: number
  total_revenue: number
  favorites_count: number
  interactions_30d: number
}

export type CrmContext = {
  mode: 'merchant' | 'shop'
  merchantId?: string
  shopId?: string
  hasShop: boolean
  shopName?: string
}

export type CrmListResult = {
  context: CrmContext
  summary: CrmSummary
  customers: CrmCustomerRow[]
}

export type CrmTimelineEvent = {
  type: 'review' | 'booking' | 'order' | 'interaction' | 'promo' | 'favorite' | 'product_favorite'
  date: string
  label: string
  detail?: string
  meta?: Record<string, unknown>
}

export type CrmCustomerDetail = CrmCustomerRow & {
  timeline: CrmTimelineEvent[]
}

const COMPLETED_ORDER_STATUSES = ['COMPLETED', 'DELIVERED'] as const

type ReviewRow = {
  user_id: string
  rating: number
  created_at: Date
  user: UserSnapshot
}

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getMerchantCRM(merchantId: string): Promise<CrmListResult> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        shop: { select: { id: true, name: true } },
      },
    })
    if (!merchant) throw new Error('Merchant not found')

    return this.buildCRM({
      mode: 'merchant',
      merchantId: merchant.id,
      shopId: merchant.shop?.id,
      shopName: merchant.shop?.name,
    })
  }

  async getShopCRM(shopId: string, opts?: { includeMerchantSignals?: boolean }): Promise<CrmListResult> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        merchant_id: true,
      },
    })
    if (!shop) throw new Error('Shop not found')

    const includeMerchant = opts?.includeMerchantSignals !== false

    return this.buildCRM({
      mode: 'shop',
      merchantId: includeMerchant ? (shop.merchant_id ?? undefined) : undefined,
      shopId: shop.id,
      shopName: shop.name,
    })
  }

  async getCustomerDetail(
    customerId: string,
    opts: { merchantId?: string; shopId?: string },
  ): Promise<CrmCustomerDetail | null> {
    const list = await this.buildCRM({
      mode: opts.shopId && !opts.merchantId ? 'shop' : 'merchant',
      merchantId: opts.merchantId,
      shopId: opts.shopId,
    })
    const customer = list.customers.find(c => c.id === customerId)
    if (!customer) return null

    const timeline = await this.buildTimeline(customerId, opts)
    return { ...customer, timeline }
  }

  private async buildCRM(ctx: {
    mode: 'merchant' | 'shop'
    merchantId?: string
    shopId?: string
    shopName?: string
  }): Promise<CrmListResult> {
    const now = new Date()
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const days180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const merchantId = ctx.merchantId
    const shopId = ctx.shopId
    const includeMerchantSignals = !!merchantId && (ctx.mode === 'merchant' || ctx.mode === 'shop')

    const [
      allReviews,
      bookingClients,
      favoriteUsers,
      orders,
      interactions,
      promoRedemptions,
      productFavorites,
    ] = await Promise.all([
      merchantId && includeMerchantSignals
        ? this.prisma.review.findMany({
            where: { merchant_id: merchantId, status: 'APPROVED' },
            select: {
              user_id: true,
              rating: true,
              created_at: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
            orderBy: { created_at: 'desc' },
          })
        : Promise.resolve([]),
      merchantId && includeMerchantSignals
        ? this.prisma.booking.findMany({
            where: { merchant_id: merchantId },
            select: {
              user_id: true,
              guest_name: true,
              guest_phone: true,
              guest_email: true,
              booked_at: true,
              status: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
            orderBy: { booked_at: 'desc' },
          })
        : Promise.resolve([]),
      merchantId && includeMerchantSignals
        ? this.prisma.favorite.findMany({
            where: { merchant_id: merchantId },
            select: {
              user_id: true,
              created_at: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
          })
        : Promise.resolve([]),
      shopId
        ? this.prisma.order.findMany({
            where: {
              shop_id: shopId,
              status: { notIn: ['CANCELLED', 'REFUNDED'] },
            },
            select: {
              user_id: true,
              total: true,
              status: true,
              created_at: true,
              customer_phone: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
            orderBy: { created_at: 'desc' },
          })
        : Promise.resolve([]),
      merchantId && includeMerchantSignals
        ? this.prisma.merchantInteraction.findMany({
            where: { merchant_id: merchantId, user_id: { not: null } },
            select: {
              user_id: true,
              event_type: true,
              created_at: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
            orderBy: { created_at: 'desc' },
          })
        : Promise.resolve([]),
      merchantId
        ? this.prisma.promotionRedemption.findMany({
            where: { promotion: { merchant_id: merchantId } },
            select: {
              user_id: true,
              amount_saved: true,
              created_at: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
            orderBy: { created_at: 'desc' },
          })
        : shopId
          ? this.prisma.promotionRedemption.findMany({
              where: { promotion: { shop_id: shopId } },
              select: {
                user_id: true,
                amount_saved: true,
                created_at: true,
                user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
              },
              orderBy: { created_at: 'desc' },
            })
          : Promise.resolve([]),
      shopId
        ? this.prisma.productFavorite.findMany({
            where: { product: { shop_id: shopId } },
            select: {
              user_id: true,
              created_at: true,
              user: { select: { id: true, full_name: true, email: true, phone: true, created_at: true } },
            },
          })
        : Promise.resolve([]),
    ])

    type MutableRow = Omit<CrmCustomerRow, 'segment' | 'customerType' | 'lastActivityAt' | 'avgRating' | 'profileType' | 'isGuest'> & {
      segment?: CrmCustomerRow['segment']
      customerType?: CrmCustomerRow['customerType']
      lastActivityAt?: Date | null
      avgRating?: number
      profileType?: CrmCustomerRow['profileType']
      isGuest?: boolean
    }

    const customerMap = new Map<string, MutableRow>()

    const upsertCustomer = (
      key: string,
      user: UserSnapshot,
      patch: Partial<MutableRow> & { sources?: string[] },
    ) => {
      const existing = customerMap.get(key) ?? {
        ...user,
        isGuest: !key.startsWith('phone:') ? false : true,
        profileType: key.startsWith('phone:') ? 'guest' as const : 'registered' as const,
        reviewCount: 0,
        avgRating: 0,
        lastReviewAt: null,
        lastBookingAt: null,
        bookingCount: 0,
        orderCount: 0,
        lastOrderAt: null,
        totalSpent: 0,
        isFavorite: false,
        productFavoriteCount: 0,
        interactionCount: 0,
        lastInteractionAt: null,
        promoRedemptionCount: 0,
        sources: [],
      }
      customerMap.set(key, {
        ...existing,
        ...patch,
        full_name: patch.full_name ?? existing.full_name ?? user.full_name,
        email: patch.email ?? existing.email ?? user.email,
        phone: patch.phone ?? existing.phone ?? user.phone,
        sources: [...new Set([...existing.sources, ...(patch.sources ?? [])])],
      })
    }

    for (const r of allReviews) {
      upsertCustomer(r.user_id, r.user, { sources: ['review'] })
    }

    for (const b of bookingClients) {
      const key = b.user_id ?? `phone:${b.guest_phone ?? 'unknown'}`
      const user: UserSnapshot = b.user ?? {
        id: key,
        full_name: b.guest_name,
        email: b.guest_email,
        phone: b.guest_phone,
        created_at: b.booked_at,
      }
      const prev = customerMap.get(key)
      upsertCustomer(key, user, {
        sources: ['booking'],
        isGuest: !b.user_id,
        profileType: b.user_id ? 'registered' : 'guest',
        bookingCount: (prev?.bookingCount ?? 0) + 1,
        lastBookingAt: !prev?.lastBookingAt || b.booked_at > prev.lastBookingAt ? b.booked_at : prev.lastBookingAt,
      })
    }

    for (const f of favoriteUsers) {
      upsertCustomer(f.user_id, f.user, { sources: ['favorite'], isFavorite: true })
    }

    for (const o of orders) {
      const prev = customerMap.get(o.user_id)
      const isCompleted = COMPLETED_ORDER_STATUSES.includes(o.status as typeof COMPLETED_ORDER_STATUSES[number])
      upsertCustomer(o.user_id, o.user, {
        sources: ['order'],
        phone: o.customer_phone ?? o.user.phone ?? prev?.phone ?? null,
        orderCount: (prev?.orderCount ?? 0) + 1,
        lastOrderAt: !prev?.lastOrderAt || o.created_at > prev.lastOrderAt ? o.created_at : prev.lastOrderAt,
        totalSpent: (prev?.totalSpent ?? 0) + (isCompleted ? o.total : 0),
      })
    }

    for (const i of interactions) {
      if (!i.user_id || !i.user) continue
      const prev = customerMap.get(i.user_id)
      upsertCustomer(i.user_id, i.user, {
        sources: ['interaction'],
        interactionCount: (prev?.interactionCount ?? 0) + 1,
        lastInteractionAt: !prev?.lastInteractionAt || i.created_at > prev.lastInteractionAt
          ? i.created_at
          : prev.lastInteractionAt,
      })
    }

    for (const p of promoRedemptions) {
      const prev = customerMap.get(p.user_id)
      upsertCustomer(p.user_id, p.user, {
        sources: ['promo'],
        promoRedemptionCount: (prev?.promoRedemptionCount ?? 0) + 1,
      })
    }

    for (const pf of productFavorites) {
      const prev = customerMap.get(pf.user_id)
      upsertCustomer(pf.user_id, pf.user, {
        sources: ['product_favorite'],
        productFavoriteCount: (prev?.productFavoriteCount ?? 0) + 1,
      })
    }

    const byUserReviews = new Map<string, ReviewRow[]>()
    for (const r of allReviews) {
      if (!byUserReviews.has(r.user_id)) byUserReviews.set(r.user_id, [])
      byUserReviews.get(r.user_id)!.push(r)
    }

    const customers: CrmCustomerRow[] = Array.from(customerMap.values()).map(c => {
      const reviews = byUserReviews.get(c.id) ?? []
      const reviewCount = reviews.length
      const avgRating = reviewCount
        ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviewCount * 10) / 10
        : 0
      const lastReviewAt = reviews[0]?.created_at ?? c.lastReviewAt ?? null

      const activityDates = [lastReviewAt, c.lastBookingAt, c.lastOrderAt, c.lastInteractionAt].filter(Boolean) as Date[]
      const lastActivityAt = activityDates.length
        ? activityDates.reduce((max, d) => (d > max ? d : max))
        : null

      const hasConversion = reviewCount > 0 || (c.bookingCount ?? 0) > 0 || (c.orderCount ?? 0) > 0
      const customerType: 'client' | 'prospect' = hasConversion ? 'client' : 'prospect'

      let segment: CrmCustomerRow['segment'] = 'regular'
      if (lastActivityAt) {
        if (lastActivityAt < days180) segment = 'lost'
        else if (lastActivityAt < days90) segment = 'inactive'
        else if (lastActivityAt >= days30) segment = 'recent'
      } else if (customerType === 'prospect') {
        segment = 'regular'
      }

      return {
        ...c,
        reviewCount,
        avgRating,
        lastReviewAt,
        lastActivityAt,
        customerType,
        segment,
        isGuest: c.isGuest ?? c.id.startsWith('phone:'),
        profileType: c.profileType ?? (c.id.startsWith('phone:') ? 'guest' : 'registered'),
      } as CrmCustomerRow
    })

    const clients = customers.filter(c => c.customerType === 'client')
    const prospects = customers.filter(c => c.customerType === 'prospect')
    const recent = customers.filter(c => c.segment === 'recent')
    const inactive = customers.filter(c => c.segment === 'inactive')
    const lost = customers.filter(c => c.segment === 'lost')
    const regular = customers.filter(c => c.segment === 'regular')

    const recentReviewers = new Set(
      allReviews.filter(r => r.created_at >= days30).map(r => r.user_id),
    ).size

    const totalRevenue = orders
      .filter(o => COMPLETED_ORDER_STATUSES.includes(o.status as typeof COMPLETED_ORDER_STATUSES[number]))
      .reduce((s, o) => s + o.total, 0)

    const interactions30d = interactions.filter(i => i.created_at >= days30).length

    return {
      context: {
        mode: ctx.mode,
        merchantId: ctx.merchantId,
        shopId: ctx.shopId,
        hasShop: !!ctx.shopId,
        shopName: ctx.shopName,
      },
      summary: {
        total_customers: clients.length,
        total_prospects: prospects.length,
        recent_30d: recent.length,
        inactive_90d: inactive.length,
        lost_180d: lost.length,
        regular: regular.length,
        recent_reviewers_30d: recentReviewers,
        total_orders: orders.length,
        total_revenue: totalRevenue,
        favorites_count: favoriteUsers.length + productFavorites.length,
        interactions_30d: interactions30d,
      },
      customers: customers.sort((a, b) => {
        const typeOrder = { client: 0, prospect: 1 }
        if (typeOrder[a.customerType] !== typeOrder[b.customerType]) {
          return typeOrder[a.customerType] - typeOrder[b.customerType]
        }
        const segOrder = { recent: 0, regular: 1, inactive: 2, lost: 3 }
        const segDiff = segOrder[a.segment] - segOrder[b.segment]
        if (segDiff !== 0) return segDiff
        const aDate = a.lastActivityAt?.getTime() ?? 0
        const bDate = b.lastActivityAt?.getTime() ?? 0
        return bDate - aDate
      }),
    }
  }

  private async buildTimeline(
    customerId: string,
    opts: { merchantId?: string; shopId?: string },
  ): Promise<CrmTimelineEvent[]> {
    const events: CrmTimelineEvent[] = []
    const isGuest = customerId.startsWith('phone:')
    const guestPhone = isGuest ? customerId.replace('phone:', '') : null

    if (opts.merchantId && !isGuest) {
      const reviews = await this.prisma.review.findMany({
        where: { merchant_id: opts.merchantId, user_id: customerId, status: 'APPROVED' },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { rating: true, content: true, created_at: true },
      })
      for (const r of reviews) {
        events.push({
          type: 'review',
          date: r.created_at.toISOString(),
          label: `Avis ${r.rating}/5`,
          detail: r.content ?? undefined,
        })
      }
    }

    if (opts.merchantId && (!isGuest || guestPhone)) {
      const bookings = await this.prisma.booking.findMany({
        where: isGuest
          ? { merchant_id: opts.merchantId, guest_phone: guestPhone! }
          : { merchant_id: opts.merchantId, user_id: customerId },
        orderBy: { booked_at: 'desc' },
        take: 20,
        select: { booked_at: true, status: true, guest_name: true },
      })
      for (const b of bookings) {
        events.push({
          type: 'booking',
          date: b.booked_at.toISOString(),
          label: `Réservation · ${b.status}`,
          detail: b.guest_name ?? undefined,
        })
      }
    }

    if (opts.shopId && !isGuest) {
      const shopOrders = await this.prisma.order.findMany({
        where: { shop_id: opts.shopId, user_id: customerId },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { id: true, total: true, status: true, created_at: true },
      })
      for (const o of shopOrders) {
        events.push({
          type: 'order',
          date: o.created_at.toISOString(),
          label: `Commande ${o.total.toLocaleString('fr-FR')} FCFA`,
          detail: o.status,
          meta: { orderId: o.id },
        })
      }
    }

    if (opts.merchantId && !isGuest) {
      const interactions = await this.prisma.merchantInteraction.findMany({
        where: { merchant_id: opts.merchantId, user_id: customerId },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { event_type: true, created_at: true },
      })
      const labels: Record<string, string> = {
        VIEW: 'Consultation fiche',
        CALL_CLICK: 'Clic appel',
        WHATSAPP_CLICK: 'Clic WhatsApp',
        DIRECTION_CLICK: 'Itinéraire',
        WEBSITE_CLICK: 'Site web',
        SAVE: 'Enregistrement',
        REVIEW: 'Avis',
        SHARE: 'Partage',
      }
      for (const i of interactions) {
        events.push({
          type: 'interaction',
          date: i.created_at.toISOString(),
          label: labels[i.event_type] ?? i.event_type,
        })
      }

      const fav = await this.prisma.favorite.findFirst({
        where: { merchant_id: opts.merchantId, user_id: customerId },
        select: { created_at: true },
      })
      if (fav) {
        events.push({
          type: 'favorite',
          date: fav.created_at.toISOString(),
          label: 'Favori établissement',
        })
      }
    }

    if (opts.shopId && !isGuest) {
      const pf = await this.prisma.productFavorite.findMany({
        where: { user_id: customerId, product: { shop_id: opts.shopId } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { created_at: true, product: { select: { name: true } } },
      })
      for (const f of pf) {
        events.push({
          type: 'product_favorite',
          date: f.created_at.toISOString(),
          label: 'Produit favori',
          detail: f.product.name,
        })
      }
    }

    if (!isGuest && opts.merchantId) {
      const promos = await this.prisma.promotionRedemption.findMany({
        where: { user_id: customerId, promotion: { merchant_id: opts.merchantId } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { amount_saved: true, created_at: true, promotion: { select: { code: true, title: true } } },
      })
      for (const p of promos) {
        events.push({
          type: 'promo',
          date: p.created_at.toISOString(),
          label: `Code promo ${p.promotion.code ?? p.promotion.title}`,
          detail: `-${p.amount_saved.toLocaleString('fr-FR')} FCFA`,
        })
      }
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
