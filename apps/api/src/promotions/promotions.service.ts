import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePromotionDto } from './dto/create-promotion.dto'
import { getPlanLimits, planLimitMessage } from '../common/plan-limits'

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

  async create(ownerId: string, dto: CreatePromotionDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(ownerId, merchantId)

    const limits = getPlanLimits(merchant.subscription_plan)
    if (!limits.promotions) {
      throw new ForbiddenException(planLimitMessage('promotions', merchant.subscription_plan))
    }

    if (new Date(dto.ends_at) <= new Date(dto.starts_at)) {
      throw new BadRequestException('La date de fin doit être après la date de début')
    }

    if (dto.category_id) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { id: dto.category_id, is_active: true },
      })
      if (!cat) throw new BadRequestException('Catégorie produit invalide')
    }

    return this.prisma.promotion.create({
      data: {
        merchant_id: merchant.id,
        shop_id: dto.shop_id ?? null,
        category_id: dto.category_id ?? null,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        code: dto.code?.trim().toUpperCase() ?? null,
        min_order_amount: dto.min_order_amount,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        max_uses: dto.max_uses,
      },
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

  async validateForShop(input: {
    code: string
    merchantId: string
    shopId: string
    subtotal: number
    lineItems?: Array<{ category_id: string | null; line_total: number }>
  }) {
    const code = input.code.trim().toUpperCase()
    if (!code) {
      return { valid: false as const, message: 'Code promo requis' }
    }

    const now = new Date()
    const promo = await this.prisma.promotion.findFirst({
      where: {
        merchant_id: input.merchantId,
        code,
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
        OR: [{ shop_id: null }, { shop_id: input.shopId }],
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    if (!promo) {
      return { valid: false as const, message: 'Code promo invalide ou expiré' }
    }

    if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
      return { valid: false as const, message: 'Ce code promo a atteint sa limite d\'utilisation' }
    }

    let eligibleSubtotal = input.subtotal
    if (promo.category_id) {
      const lines = input.lineItems ?? []
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

  async getMerchantPromotions(merchantId: string) {
    return this.prisma.promotion.findMany({
      where: { merchant_id: merchantId },
      orderBy: { created_at: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
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
      },
      orderBy: { ends_at: 'asc' },
      take: 20,
    })
  }

  async toggle(ownerId: string, promotionId: string, merchantId?: string) {
    const promo = await this.assertOwner(ownerId, promotionId, merchantId)
    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: { is_active: !promo.is_active },
    })
  }

  async delete(ownerId: string, promotionId: string, merchantId?: string) {
    await this.assertOwner(ownerId, promotionId, merchantId)
    await this.prisma.promotion.delete({ where: { id: promotionId } })
    return { success: true }
  }

  private async assertOwner(ownerId: string, promotionId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(ownerId, merchantId)
    const promo = await this.prisma.promotion.findFirst({
      where: { id: promotionId, merchant_id: merchant.id },
    })
    if (!promo) throw new NotFoundException('Promotion introuvable')
    return promo
  }
}
