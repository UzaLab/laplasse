import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  currency: true,
  image_url: true,
  category_id: true,
  category: { select: { id: true, name: true, slug: true } },
  shop: { select: { name: true, slug: true, logo: true, country: true } },
} as const

function mapProductRow(row: {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  image_url: string | null
  category_id: string | null
  category: { id: string; name: string; slug: string } | null
  shop: { name: string; slug: string; logo: string | null; country: string }
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    currency: row.currency,
    image_url: row.image_url,
    category_id: row.category_id,
    category: row.category,
    merchant: {
      business_name: row.shop.name,
      slug: row.shop.slug,
      logo: row.shop.logo,
    },
  }
}

@Injectable()
export class ProductDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordView(input: {
    productId: string
    userId?: string
    guestKey?: string
    country?: string
  }) {
    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!product) return { ok: false }

    const country = (input.country ?? 'CI').toUpperCase()
    const now = new Date()

    if (input.userId) {
      const existing = await this.prisma.productView.findFirst({
        where: { user_id: input.userId, product_id: input.productId },
      })
      if (existing) {
        await this.prisma.productView.update({
          where: { id: existing.id },
          data: { viewed_at: now, country },
        })
      } else {
        await this.prisma.productView.create({
          data: {
            product_id: input.productId,
            user_id: input.userId,
            country,
            viewed_at: now,
          },
        })
      }
    } else if (input.guestKey) {
      const existing = await this.prisma.productView.findFirst({
        where: { guest_key: input.guestKey, product_id: input.productId },
      })
      if (existing) {
        await this.prisma.productView.update({
          where: { id: existing.id },
          data: { viewed_at: now, country },
        })
      } else {
        await this.prisma.productView.create({
          data: {
            product_id: input.productId,
            guest_key: input.guestKey,
            country,
            viewed_at: now,
          },
        })
      }
    }

    return { ok: true }
  }

  async getRecentlyViewed(input: {
    userId?: string
    guestKey?: string
    country?: string
    limit?: number
    excludeProductId?: string
  }) {
    const limit = Math.min(12, Math.max(1, input.limit ?? 8))
    const country = input.country?.toUpperCase()
    if (!input.userId && !input.guestKey) return []

    const views = await this.prisma.productView.findMany({
      where: {
        ...(input.userId ? { user_id: input.userId } : { guest_key: input.guestKey! }),
        ...(country ? { country } : {}),
        ...(input.excludeProductId ? { product_id: { not: input.excludeProductId } } : {}),
        product: {
          status: 'ACTIVE',
          stock_quantity: { gt: 0 },
          shop: { is_active: true, status: 'ACTIVE' },
        },
      },
      orderBy: { viewed_at: 'desc' },
      take: limit * 2,
      include: {
        product: { select: PRODUCT_CARD_SELECT },
      },
    })

    const seen = new Set<string>()
    const products = []
    for (const view of views) {
      if (seen.has(view.product.id)) continue
      seen.add(view.product.id)
      products.push(mapProductRow(view.product))
      if (products.length >= limit) break
    }
    return products
  }

  async getRecommendations(input: {
    productId?: string
    country?: string
    limit?: number
  }) {
    const limit = Math.min(12, Math.max(1, input.limit ?? 8))
    const country = input.country?.toUpperCase() ?? 'CI'

    let categoryId: string | null = null
    let shopId: string | null = null
    let excludeId: string | undefined

    if (input.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: input.productId, status: 'ACTIVE' },
        select: { id: true, category_id: true, shop_id: true },
      })
      if (product) {
        categoryId = product.category_id
        shopId = product.shop_id
        excludeId = product.id
      }
    }

    const baseWhere = {
      status: 'ACTIVE' as const,
      stock_quantity: { gt: 0 },
      shop: {
        is_active: true,
        status: 'ACTIVE' as const,
        country,
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    }

    const sameShop = shopId
      ? await this.prisma.product.findMany({
          where: { ...baseWhere, shop_id: shopId },
          orderBy: { created_at: 'desc' },
          take: Math.ceil(limit / 2),
          select: PRODUCT_CARD_SELECT,
        })
      : []

    const sameCategory = categoryId
      ? await this.prisma.product.findMany({
          where: {
            ...baseWhere,
            category_id: categoryId,
            ...(shopId ? { shop_id: { not: shopId } } : {}),
          },
          orderBy: { created_at: 'desc' },
          take: limit,
          select: PRODUCT_CARD_SELECT,
        })
      : []

    const popular = await this.prisma.product.findMany({
      where: baseWhere,
      orderBy: { created_at: 'desc' },
      take: limit,
      select: PRODUCT_CARD_SELECT,
    })

    const merged: ReturnType<typeof mapProductRow>[] = []
    const seen = new Set<string>()
    for (const row of [...sameShop, ...sameCategory, ...popular]) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      merged.push(mapProductRow(row))
      if (merged.length >= limit) break
    }

    return merged
  }
}
