import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { FraudService } from '../fraud/fraud.service'
import { CreateReviewDto } from './dto/create-review.dto'

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loyalty: LoyaltyService,
    private readonly fraud: FraudService,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5')
    }

    const spam = await this.fraud.checkReviewSpam(userId)
    if (spam.flagged) {
      throw new ForbiddenException('Activité suspecte détectée. Réessayez demain.')
    }

    const merchant = await this.prisma.merchant.findUnique({ where: { id: dto.merchant_id } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    // Un avis par utilisateur par marchand
    const existing = await this.prisma.review.findFirst({
      where: { merchant_id: dto.merchant_id, user_id: userId },
    })
    if (existing) throw new ForbiddenException('You have already reviewed this merchant')

    const review = await this.prisma.review.create({
      data: {
        merchant_id: dto.merchant_id,
        user_id: userId,
        rating: dto.rating,
        title: dto.title ?? null,
        content: dto.content ?? null,
        status: 'PENDING',
      },
      select: {
        id: true, rating: true, title: true, content: true, status: true, created_at: true,
        user: { select: { id: true, full_name: true, avatar: true } },
      },
    })

    // Gain de points loyalty pour l'auteur de l'avis
    this.loyalty.earnPoints(userId, 'review', { merchant_id: dto.merchant_id }).catch(() => {})

    return review
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.review.findMany({
      where: { merchant_id: merchantId, status: 'APPROVED' },
      select: {
        id: true, rating: true, title: true, content: true, created_at: true,
        user: { select: { id: true, full_name: true, avatar: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  async findMine(userId: string) {
    return this.prisma.review.findMany({
      where: { user_id: userId },
      include: { merchant: { select: { id: true, business_name: true, slug: true } } },
      orderBy: { created_at: 'desc' },
    })
  }
}
