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

    return this.prisma.promotion.create({
      data: {
        merchant_id: merchant.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        code: dto.code,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        max_uses: dto.max_uses,
      },
    })
  }

  async getMerchantPromotions(merchantId: string) {
    return this.prisma.promotion.findMany({
      where: { merchant_id: merchantId },
      orderBy: { created_at: 'desc' },
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
