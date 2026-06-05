import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(merchantId: string, userId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    const existing = await this.prisma.favorite.findFirst({
      where: { merchant_id: merchantId, user_id: userId },
    })

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } })
      return { is_favorited: false, merchant_id: merchantId }
    }

    await this.prisma.favorite.create({
      data: { merchant_id: merchantId, user_id: userId },
    })
    return { is_favorited: true, merchant_id: merchantId }
  }

  async findMine(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { user_id: userId },
      include: {
        merchant: {
          select: {
            id: true, business_name: true, slug: true, cover_image: true,
            verification_status: true, trust_score: true,
            category: { select: { name: true, slug: true, icon: true } },
            location: { select: { city: true, district: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
    return favs.map(f => f.merchant)
  }

  async isFavorited(merchantId: string, userId: string) {
    const fav = await this.prisma.favorite.findFirst({
      where: { merchant_id: merchantId, user_id: userId },
    })
    return { is_favorited: !!fav }
  }
}
