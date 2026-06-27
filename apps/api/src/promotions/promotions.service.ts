import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePromotionDto } from './dto/create-promotion.dto'
import { UpdatePromotionDto } from './dto/update-promotion.dto'
import { getPlanLimits, planLimitMessage } from '../common/plan-limits'
import { shopAccessibleWhere } from '../shops/shop-access.util'

export type ProductPromotionBadge = {
  id: string
  title: string
  type: string
  value: number
  code: string | null
  discount_amount: number
  promo_price: number | null
}

type PromoWithProducts = {
  id: string
  merchant_id: string | null
  shop_id: string | null
  category_id: string | null
  title: string
  description: string | null
  type: string
  value: number
  code: string | null
  min_order_amount: number | null
  is_active: boolean
  starts_at: Date
  ends_at: Date
  max_uses: number | null
  uses_count: number
  products: { product_id: string }[]
  categories: { category_id: string }[]
  category?: { id: string; name: string } | null
}

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name)

  constructor(private readonly prisma: PrismaService) {}

  private async resolveMyMerchant(ownerId: string, merchantId?: string) {
    const where = merchantId
      ? { id: merchantId, owner_id: ownerId }
      : { owner_id: ownerId }
    const merchant = await this.prisma.merchant.findFirst({ where })
    if (!merchant) throw new NotFoundException('Marchand introuvable')
    return merchant
  }

  private async resolveOwnerShop(ownerId: string, shopId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: shopAccessibleWhere(ownerId, shopId),
      select: { id: true, merchant_id: true },
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')
    return shop
  }

  private promoInclude = {
    category: { select: { id: true, name: true, slug: true } },
    categories: {
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    },
    products: {
      include: {
        product: { select: { id: true, name: true, slug: true, image_url: true } },
      },
    },
  } as const

  private async assertProductIdsForShop(shopId: string, productIds: string[]) {
    if (!productIds.length) return
    const owned = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        shop_id: shopId,
      },
      select: { id: true },
    })
    if (owned.length !== productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont invalides')
    }
  }

  private async assertProductIdsForMerchant(merchantId: string, productIds: string[]) {
    if (!productIds.length) return
    const owned = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        shop: { merchant_id: merchantId },
      },
      select: { id: true },
    })
    if (owned.length !== productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont invalides')
    }
  }

  private getPromoCategoryIds(promo: PromoWithProducts): string[] {
    const fromLinks = promo.categories.map(c => c.category_id)
    if (fromLinks.length) return fromLinks
    if (promo.category_id) return [promo.category_id]
    return []
  }

  private async assertCategoryIds(categoryIds: string[]) {
    if (!categoryIds.length) return
    const count = await this.prisma.productCategory.count({
      where: { id: { in: categoryIds }, is_active: true },
    })
    if (count !== categoryIds.length) {
      throw new BadRequestException('Une ou plusieurs catégories sont invalides')
    }
  }

  async create(ownerId: string, dto: CreatePromotionDto, merchantId?: string, shopId?: string) {
    if (shopId && !merchantId) {
      return this.createForShop(ownerId, shopId, dto)
    }

    const merchant = await this.resolveMyMerchant(ownerId, merchantId)

    const limits = getPlanLimits(merchant.subscription_plan)
    if (!limits.promotions) {
      throw new ForbiddenException(planLimitMessage('promotions', merchant.subscription_plan))
    }

    const startsAt = new Date(dto.starts_at)
    const endsAt = new Date(dto.ends_at)
    if (endsAt <= startsAt) {
      throw new BadRequestException('La date de fin doit être après la date de début')
    }
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('La date de début ne peut pas être antérieure à maintenant')
    }

    const categoryIds = [...new Set([
      ...(dto.category_ids ?? []).filter(Boolean),
      ...(dto.category_id ? [dto.category_id] : []),
    ])]
    await this.assertCategoryIds(categoryIds)

    const productIds = [...new Set((dto.product_ids ?? []).filter(Boolean))]
    await this.assertProductIdsForMerchant(merchant.id, productIds)

    if (productIds.length && categoryIds.length) {
      throw new BadRequestException('Choisissez soit des produits, soit des catégories — pas les deux')
    }

    return this.prisma.promotion.create({
      data: {
        merchant_id: merchant.id,
        shop_id: dto.shop_id ?? null,
        category_id: categoryIds[0] ?? null,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        code: dto.code?.trim().toUpperCase() ?? null,
        min_order_amount: dto.min_order_amount,
        starts_at: startsAt,
        ends_at: endsAt,
        max_uses: dto.max_uses,
        max_uses_per_user: dto.max_uses_per_user,
        ...(productIds.length
          ? {
              products: {
                create: productIds.map(product_id => ({ product_id })),
              },
            }
          : {}),
        ...(categoryIds.length
          ? {
              categories: {
                create: categoryIds.map(category_id => ({ category_id })),
              },
            }
          : {}),
      },
      include: this.promoInclude,
    })
  }

  private async createForShop(ownerId: string, shopId: string, dto: CreatePromotionDto) {
    const shop = await this.resolveOwnerShop(ownerId, shopId)
    const targetShopId = dto.shop_id ?? shop.id
    if (targetShopId !== shop.id) {
      throw new BadRequestException('Boutique invalide')
    }

    const startsAt = new Date(dto.starts_at)
    const endsAt = new Date(dto.ends_at)
    if (endsAt <= startsAt) {
      throw new BadRequestException('La date de fin doit être après la date de début')
    }
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('La date de début ne peut pas être antérieure à maintenant')
    }

    const categoryIds = [...new Set([
      ...(dto.category_ids ?? []).filter(Boolean),
      ...(dto.category_id ? [dto.category_id] : []),
    ])]
    await this.assertCategoryIds(categoryIds)

    const productIds = [...new Set((dto.product_ids ?? []).filter(Boolean))]
    await this.assertProductIdsForShop(shop.id, productIds)

    if (productIds.length && categoryIds.length) {
      throw new BadRequestException('Choisissez soit des produits, soit des catégories — pas les deux')
    }

    const code = dto.code?.trim().toUpperCase() ?? null
    if (code) {
      const existing = await this.prisma.promotion.findFirst({
        where: { shop_id: shop.id, code },
      })
      if (existing) throw new BadRequestException('Ce code existe déjà pour cette boutique')
    }

    return this.prisma.promotion.create({
      data: {
        merchant_id: null,
        shop_id: shop.id,
        category_id: categoryIds[0] ?? null,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        code,
        min_order_amount: dto.min_order_amount,
        starts_at: startsAt,
        ends_at: endsAt,
        max_uses: dto.max_uses,
        max_uses_per_user: dto.max_uses_per_user,
        ...(productIds.length
          ? {
              products: {
                create: productIds.map(product_id => ({ product_id })),
              },
            }
          : {}),
        ...(categoryIds.length
          ? {
              categories: {
                create: categoryIds.map(category_id => ({ category_id })),
              },
            }
          : {}),
      },
      include: this.promoInclude,
    })
  }

  computeDiscount(
    promo: { type: string; value: number },
    subtotal: number,
  ): { discount: number; free_delivery: boolean } {
    switch (promo.type) {
      case 'PERCENTAGE':
        return {
          discount: Math.floor((subtotal * promo.value) / 100),
          free_delivery: false,
        }
      case 'FIXED':
        return {
          discount: Math.min(Math.floor(promo.value), subtotal),
          free_delivery: false,
        }
      case 'FREE_DELIVERY':
        return { discount: 0, free_delivery: true }
      default:
        return { discount: 0, free_delivery: false }
    }
  }

  computePromoPrice(price: number, promo: { type: string; value: number }) {
    const { discount, free_delivery } = this.computeDiscount(promo, price)
    if (free_delivery) {
      return { promo_price: price, discount_amount: 0, free_delivery: true }
    }
    if (discount <= 0) {
      return { promo_price: null, discount_amount: 0, free_delivery: false }
    }
    return {
      promo_price: Math.max(price - discount, 0),
      discount_amount: discount,
      free_delivery: false,
    }
  }

  promoAppliesToProduct(
    promo: PromoWithProducts,
    product: { id: string; category_id?: string | null },
    shopId?: string,
  ): boolean {
    if (promo.shop_id && shopId && promo.shop_id !== shopId) return false
    const productIds = promo.products.map(p => p.product_id)
    if (productIds.length > 0) {
      return productIds.includes(product.id)
    }
    const categoryIds = this.getPromoCategoryIds(promo)
    if (categoryIds.length > 0) {
      return product.category_id != null && categoryIds.includes(product.category_id)
    }
    if (promo.category_id) {
      return product.category_id === promo.category_id
    }
    return true
  }

  findBestPromoForProduct(
    promos: PromoWithProducts[],
    product: { id: string; price: number; category_id?: string | null },
    shopId?: string,
    options?: { vitrineOnly?: boolean },
  ): ProductPromotionBadge | null {
    let best: { promo: PromoWithProducts; discount: number; promo_price: number | null } | null = null
    let freeDeliveryBadge: ProductPromotionBadge | null = null

    for (const promo of promos) {
      if (options?.vitrineOnly && promo.code) continue
      if (!this.promoAppliesToProduct(promo, product, shopId)) continue
      if (promo.type === 'FREE_DELIVERY') {
        if (!freeDeliveryBadge) {
          freeDeliveryBadge = {
            id: promo.id,
            title: promo.title,
            type: promo.type,
            value: promo.value,
            code: promo.code,
            discount_amount: 0,
            promo_price: product.price,
          }
        }
        continue
      }
      if (promo.type !== 'PERCENTAGE' && promo.type !== 'FIXED') continue

      const { promo_price, discount_amount } = this.computePromoPrice(product.price, promo)
      if (discount_amount <= 0 || promo_price == null) continue

      const specificity =
        (promo.products.length > 0 ? 3 : 0)
        + (this.getPromoCategoryIds(promo).length > 0 ? 2 : 0)
        + (promo.shop_id ? 1 : 0)

      const bestSpecificity = best
        ? (best.promo.products.length > 0 ? 3 : 0)
          + (this.getPromoCategoryIds(best.promo).length > 0 ? 2 : 0)
          + (best.promo.shop_id ? 1 : 0)
        : -1

      if (
        discount_amount > (best === null ? 0 : best.discount)
        || (discount_amount === (best === null ? 0 : best.discount) && specificity > bestSpecificity)
      ) {
        best = { promo, discount: discount_amount, promo_price }
      }
    }

    if (best) {
      return {
        id: best.promo.id,
        title: best.promo.title,
        type: best.promo.type,
        value: best.promo.value,
        code: best.promo.code,
        discount_amount: best.discount,
        promo_price: best.promo_price,
      }
    }

    return freeDeliveryBadge
  }

  async loadActivePromosForMerchants(merchantIds: string[]) {
    if (!merchantIds.length) return []
    const now = new Date()
    const rows = await this.prisma.promotion.findMany({
      where: {
        merchant_id: { in: merchantIds },
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      include: {
        products: { select: { product_id: true } },
        categories: { select: { category_id: true } },
        category: { select: { id: true, name: true } },
      },
    })
    return rows.filter(p => p.max_uses == null || p.uses_count < p.max_uses) as PromoWithProducts[]
  }

  async loadActivePromosForShops(shopIds: string[]) {
    if (!shopIds.length) return []
    const now = new Date()
    const rows = await this.prisma.promotion.findMany({
      where: {
        shop_id: { in: shopIds },
        merchant_id: null,
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      include: {
        products: { select: { product_id: true } },
        categories: { select: { category_id: true } },
        category: { select: { id: true, name: true } },
      },
    })
    return rows.filter(p => p.max_uses == null || p.uses_count < p.max_uses) as PromoWithProducts[]
  }

  async enrichProductsWithPromotions<
    T extends { id: string; price: number; category_id?: string | null; shop_id?: string; merchant_id?: string },
  >(products: T[], shopId?: string, merchantId?: string): Promise<Array<T & {
    original_price?: number
    promo_price?: number | null
    promotion?: ProductPromotionBadge | null
  }>> {
    if (!products.length) return products

    const merchantIds = merchantId
      ? [merchantId]
      : [...new Set(products.map(p => p.merchant_id).filter(Boolean))] as string[]

    const promos = await this.loadActivePromosForMerchants(merchantIds)
    const promosByMerchant = new Map<string, PromoWithProducts[]>()
    for (const promo of promos) {
      if (!promo.merchant_id) continue
      const list = promosByMerchant.get(promo.merchant_id) ?? []
      list.push(promo)
      promosByMerchant.set(promo.merchant_id, list)
    }

    const standaloneShopIds = [
      ...new Set(
        products
          .filter(p => !p.merchant_id && p.shop_id)
          .map(p => p.shop_id as string),
      ),
    ]
    const shopPromos = await this.loadActivePromosForShops(standaloneShopIds)
    const promosByShop = new Map<string, PromoWithProducts[]>()
    for (const promo of shopPromos) {
      if (!promo.shop_id) continue
      const list = promosByShop.get(promo.shop_id) ?? []
      list.push(promo)
      promosByShop.set(promo.shop_id, list)
    }

    return products.map(product => {
      const mId = merchantId ?? product.merchant_id
      const sId = shopId ?? product.shop_id
      const merchantPromos = mId ? (promosByMerchant.get(mId) ?? []) : []
      const shopOnlyPromos = !mId && sId ? (promosByShop.get(sId) ?? []) : []
      const applicablePromos = [...merchantPromos, ...shopOnlyPromos]
      if (!applicablePromos.length) return product

      const badge = this.findBestPromoForProduct(
        applicablePromos,
        product,
        sId,
        { vitrineOnly: true },
      )
      if (!badge || badge.type === 'FREE_DELIVERY') {
        if (badge?.type === 'FREE_DELIVERY') {
          return { ...product, promotion: badge }
        }
        return product
      }
      return {
        ...product,
        original_price: product.price,
        promo_price: badge.promo_price,
        promotion: badge,
      }
    })
  }

  async validateForShop(input: {
    code: string
    merchantId: string | null
    shopId: string
    subtotal: number
    userId?: string
    lineItems?: Array<{ product_id: string; category_id: string | null; line_total: number }>
  }) {
    const code = input.code.trim().toUpperCase()
    if (!code) {
      return { valid: false as const, message: 'Code promo requis' }
    }

    const now = new Date()
    const promo = await this.prisma.promotion.findFirst({
      where: input.merchantId
        ? {
            merchant_id: input.merchantId,
            code,
            is_active: true,
            starts_at: { lte: now },
            ends_at: { gte: now },
            OR: [{ shop_id: null }, { shop_id: input.shopId }],
          }
        : {
            merchant_id: null,
            shop_id: input.shopId,
            code,
            is_active: true,
            starts_at: { lte: now },
            ends_at: { gte: now },
          },
      include: {
        category: { select: { id: true, name: true } },
        products: { select: { product_id: true } },
        categories: { select: { category_id: true } },
      },
    })

    if (!promo) {
      return { valid: false as const, message: 'Code promo invalide ou expiré' }
    }

    const promoWithLinks = promo as PromoWithProducts

    if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
      return { valid: false as const, message: 'Ce code promo a atteint sa limite d\'utilisation' }
    }

    if (input.userId && promo.max_uses_per_user != null) {
      const userUses = await this.prisma.promotionRedemption.count({
        where: { promotion_id: promo.id, user_id: input.userId },
      })
      if (userUses >= promo.max_uses_per_user) {
        return {
          valid: false as const,
          message: 'Vous avez déjà utilisé ce code le nombre maximum de fois autorisé',
        }
      }
    }

    const lines = input.lineItems ?? []
    const productIds = promoWithLinks.products.map(p => p.product_id)
    const categoryIds = this.getPromoCategoryIds(promoWithLinks)

    let eligibleSubtotal = input.subtotal
    if (productIds.length > 0) {
      eligibleSubtotal = lines
        .filter(li => productIds.includes(li.product_id))
        .reduce((sum, li) => sum + li.line_total, 0)
      if (eligibleSubtotal <= 0) {
        return {
          valid: false as const,
          message: 'Ce code s\'applique uniquement à certains produits de votre panier',
        }
      }
    } else if (categoryIds.length > 0) {
      eligibleSubtotal = lines
        .filter(li => li.category_id != null && categoryIds.includes(li.category_id))
        .reduce((sum, li) => sum + li.line_total, 0)
      if (eligibleSubtotal <= 0) {
        return {
          valid: false as const,
          message: 'Aucun article éligible pour ce code promo dans les catégories sélectionnées',
        }
      }
    } else if (promo.category_id) {
      eligibleSubtotal = lines
        .filter(li => li.category_id === promo.category_id)
        .reduce((sum, li) => sum + li.line_total, 0)
      if (eligibleSubtotal <= 0) {
        return {
          valid: false as const,
          message: promo.category
            ? `Ce code s'applique uniquement à la catégorie « ${promo.category.name} »`
            : 'Aucun article éligible pour ce code promo',
        }
      }
    }

    if (promo.min_order_amount != null && eligibleSubtotal < promo.min_order_amount) {
      return {
        valid: false as const,
        message: `Commande minimum ${promo.min_order_amount.toLocaleString('fr-FR')} FCFA requise`,
      }
    }

    const { discount, free_delivery } = this.computeDiscount(promo, eligibleSubtotal)

    return {
      valid: true as const,
      promotion: promo,
      discount,
      free_delivery,
      message: free_delivery
        ? 'Livraison offerte appliquée'
        : `Remise de ${discount.toLocaleString('fr-FR')} FCFA`,
    }
  }

  /** Valide un code promo pour une commande food (pas de shop_id requis). */
  async validateForMerchant(input: {
    code: string
    merchantId: string
    subtotal: number
    userId?: string
  }) {
    const code = input.code.trim().toUpperCase()
    if (!code) {
      return { valid: false as const, message: 'Code promo requis' }
    }

    const now = new Date()
    const promo = await this.prisma.promotion.findFirst({
      where: {
        merchant_id: input.merchantId,
        shop_id: null,
        code,
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      include: {
        products: { select: { product_id: true } },
        categories: { select: { category_id: true } },
      },
    })

    if (!promo) {
      return { valid: false as const, message: 'Code promo invalide ou expiré' }
    }

    if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
      return { valid: false as const, message: 'Ce code promo a atteint sa limite d\'utilisation' }
    }

    if (input.userId && promo.max_uses_per_user != null) {
      const userUses = await this.prisma.promotionRedemption.count({
        where: { promotion_id: promo.id, user_id: input.userId },
      })
      if (userUses >= promo.max_uses_per_user) {
        return {
          valid: false as const,
          message: 'Vous avez déjà utilisé ce code le nombre maximum de fois autorisé',
        }
      }
    }

    if (promo.min_order_amount != null && input.subtotal < promo.min_order_amount) {
      return {
        valid: false as const,
        message: `Commande minimum ${promo.min_order_amount.toLocaleString('fr-FR')} FCFA requise`,
      }
    }

    const { discount, free_delivery } = this.computeDiscount(promo, input.subtotal)

    return {
      valid: true as const,
      promotion: promo,
      discount,
      free_delivery,
      message: free_delivery
        ? 'Livraison offerte appliquée'
        : `Remise de ${discount.toLocaleString('fr-FR')} FCFA`,
    }
  }

  async update(ownerId: string, promotionId: string, dto: UpdatePromotionDto, merchantId?: string, shopId?: string) {
    const promo = await this.assertOwner(ownerId, promotionId, merchantId, shopId)

    const startsAt = dto.starts_at ? new Date(dto.starts_at) : promo.starts_at
    const endsAt = dto.ends_at ? new Date(dto.ends_at) : promo.ends_at
    if (endsAt <= startsAt) {
      throw new BadRequestException('La date de fin doit être après la date de début')
    }
    if (dto.starts_at) {
      const newStart = new Date(dto.starts_at)
      const unchanged = Math.abs(newStart.getTime() - promo.starts_at.getTime()) < 60_000
      if (!unchanged && newStart.getTime() < Date.now() - 60_000) {
        throw new BadRequestException('La date de début ne peut pas être antérieure à maintenant')
      }
    }

    const categoryIds = dto.category_ids !== undefined
      ? [...new Set(dto.category_ids.filter(Boolean))]
      : undefined
    const productIds = dto.product_ids !== undefined
      ? [...new Set(dto.product_ids.filter(Boolean))]
      : undefined

    if (categoryIds && productIds && categoryIds.length && productIds.length) {
      throw new BadRequestException('Choisissez soit des produits, soit des catégories — pas les deux')
    }
    if (categoryIds) await this.assertCategoryIds(categoryIds)
    if (productIds) {
      if (promo.merchant_id) {
        await this.assertProductIdsForMerchant(promo.merchant_id, productIds)
      } else if (promo.shop_id) {
        await this.assertProductIdsForShop(promo.shop_id, productIds)
      }
    }

    const nextCode = dto.code !== undefined
      ? (dto.code.trim() ? dto.code.trim().toUpperCase() : null)
      : promo.code

    if (nextCode !== promo.code && promo.uses_count > 0) {
      throw new BadRequestException('Impossible de modifier le code après des utilisations')
    }

    await this.prisma.$transaction(async tx => {
      if (productIds !== undefined) {
        await tx.promotionProduct.deleteMany({ where: { promotion_id: promotionId } })
        if (productIds.length) {
          await tx.promotionProduct.createMany({
            data: productIds.map(product_id => ({ promotion_id: promotionId, product_id })),
          })
        }
      }
      if (categoryIds !== undefined) {
        await tx.promotionCategory.deleteMany({ where: { promotion_id: promotionId } })
        if (categoryIds.length) {
          await tx.promotionCategory.createMany({
            data: categoryIds.map(category_id => ({ promotion_id: promotionId, category_id })),
          })
        }
      }

      await tx.promotion.update({
        where: { id: promotionId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.value !== undefined ? { value: dto.value } : {}),
          ...(dto.code !== undefined ? { code: nextCode } : {}),
          ...(dto.starts_at !== undefined ? { starts_at: startsAt } : {}),
          ...(dto.ends_at !== undefined ? { ends_at: endsAt } : {}),
          ...(dto.max_uses !== undefined ? { max_uses: dto.max_uses } : {}),
          ...(dto.max_uses_per_user !== undefined ? { max_uses_per_user: dto.max_uses_per_user } : {}),
          ...(dto.min_order_amount !== undefined ? { min_order_amount: dto.min_order_amount } : {}),
          ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
          ...(categoryIds !== undefined ? { category_id: categoryIds[0] ?? null } : {}),
        },
      })
    })

    return this.getPromotionForOwner(ownerId, promotionId, merchantId, shopId)
  }

  async getPromotionForOwner(ownerId: string, promotionId: string, merchantId?: string, shopId?: string) {
    await this.assertOwner(ownerId, promotionId, merchantId, shopId)
    return this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: this.promoInclude,
    })
  }

  async getRedemptionsForOwner(ownerId: string, promotionId: string, merchantId?: string, shopId?: string) {
    const promo = await this.assertOwner(ownerId, promotionId, merchantId, shopId)
    if (!promo.code) {
      throw new BadRequestException('Les utilisations ne s\'appliquent qu\'aux codes promo')
    }

    const redemptions = await this.prisma.promotionRedemption.findMany({
      where: { promotion_id: promotionId },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, full_name: true, phone: true },
        },
        order: {
          select: { id: true, total: true, discount_amount: true, created_at: true },
        },
      },
    })

    const byUser = new Map<string, { user: typeof redemptions[0]['user']; count: number; total_saved: number }>()
    for (const r of redemptions) {
      const existing = byUser.get(r.user_id)
      if (existing) {
        existing.count += 1
        existing.total_saved += r.amount_saved
      } else {
        byUser.set(r.user_id, { user: r.user, count: 1, total_saved: r.amount_saved })
      }
    }

    return {
      promotion: {
        id: promo.id,
        title: promo.title,
        code: promo.code,
        uses_count: promo.uses_count,
        max_uses: promo.max_uses,
        max_uses_per_user: promo.max_uses_per_user,
      },
      redemptions: redemptions.map(r => ({
        id: r.id,
        amount_saved: r.amount_saved,
        created_at: r.created_at,
        user: r.user,
        order: r.order,
      })),
      summary_by_user: [...byUser.values()].sort((a, b) => b.count - a.count),
    }
  }

  async getMerchantPromotions(merchantId: string) {
    return this.prisma.promotion.findMany({
      where: { merchant_id: merchantId },
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        products: {
          include: {
            product: { select: { id: true, name: true, slug: true, image_url: true } },
          },
        },
      },
    })
  }

  async getShopPromotionsForOwner(ownerId: string, shopId: string) {
    await this.resolveOwnerShop(ownerId, shopId)
    return this.prisma.promotion.findMany({
      where: { shop_id: shopId },
      orderBy: { created_at: 'desc' },
      include: this.promoInclude,
    })
  }

  async getMerchantPromotionsForOwner(ownerId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(ownerId, merchantId)
    return this.getMerchantPromotions(merchant.id)
  }

  async getActivePromotions(merchantId: string) {
    const now = new Date()
    return this.prisma.promotion.findMany({
      where: {
        merchant_id: merchantId,
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      orderBy: { ends_at: 'asc' },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })
  }

  async getPublicActivePromotions() {
    const now = new Date()
    return this.prisma.promotion.findMany({
      where: {
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      include: {
        merchant: { select: { id: true, business_name: true, slug: true, logo: true } },
        shop: { select: { id: true, name: true, slug: true, logo: true } },
      },
      orderBy: { ends_at: 'asc' },
      take: 20,
    })
  }

  async toggle(ownerId: string, promotionId: string, merchantId?: string, shopId?: string) {
    const promo = await this.assertOwner(ownerId, promotionId, merchantId, shopId)
    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: { is_active: !promo.is_active },
    })
  }

  async delete(ownerId: string, promotionId: string, merchantId?: string, shopId?: string) {
    await this.assertOwner(ownerId, promotionId, merchantId, shopId)
    await this.prisma.promotion.delete({ where: { id: promotionId } })
    return { success: true }
  }

  private async assertOwner(
    ownerId: string,
    promotionId: string,
    merchantId?: string,
    shopId?: string,
  ) {
    if (shopId && !merchantId) {
      await this.resolveOwnerShop(ownerId, shopId)
      const promo = await this.prisma.promotion.findFirst({
        where: { id: promotionId, shop_id: shopId },
      })
      if (!promo) throw new NotFoundException('Promotion introuvable')
      return promo
    }

    const merchant = await this.resolveMyMerchant(ownerId, merchantId)
    const promo = await this.prisma.promotion.findFirst({
      where: { id: promotionId, merchant_id: merchant.id },
    })
    if (!promo) throw new NotFoundException('Promotion introuvable')
    return promo
  }
}
