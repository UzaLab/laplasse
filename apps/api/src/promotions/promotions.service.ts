import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePromotionDto } from './dto/create-promotion.dto'

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePromotionDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { owner_id: ownerId } })
    if (!merchant) throw new NotFoundException('Marchand introuvable')

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

  async toggle(ownerId: string, promotionId: string) {
    const promo = await this.assertOwner(ownerId, promotionId)
    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: { is_active: !promo.is_active },
    })
  }

  async delete(ownerId: string, promotionId: string) {
    await this.assertOwner(ownerId, promotionId)
    await this.prisma.promotion.delete({ where: { id: promotionId } })
    return { success: true }
  }

  private async assertOwner(ownerId: string, promotionId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { owner_id: ownerId } })
    if (!merchant) throw new ForbiddenException()
    const promo = await this.prisma.promotion.findFirst({
      where: { id: promotionId, merchant_id: merchant.id },
    })
    if (!promo) throw new NotFoundException('Promotion introuvable')
    return promo
  }
}
