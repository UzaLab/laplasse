import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductReviewDto } from './dto/product-review.dto'
import { AdminNotificationsService } from '../notifications/admin-notifications.service'

@Injectable()
export class ProductReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  async listByProductSlug(slug: string, shopSlug?: string) {
    const product = await this.resolveProduct(slug, shopSlug)
    const rows = await this.prisma.productReview.findMany({
      where: { product_id: product.id, status: 'APPROVED' },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        user: { select: { full_name: true, avatar: true } },
      },
    })

    const avg =
      rows.length > 0
        ? rows.reduce((s, r) => s + r.rating, 0) / rows.length
        : null

    return {
      product_id: product.id,
      average_rating: avg ? Math.round(avg * 10) / 10 : null,
      count: rows.length,
      reviews: rows.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at.toISOString(),
        user: {
          name: r.user.full_name ?? 'Client',
          avatar: r.user.avatar,
        },
      })),
    }
  }

  async create(userId: string, slug: string, dto: CreateProductReviewDto, shopSlug?: string) {
    const product = await this.resolveProduct(slug, shopSlug)

    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        product_id: product.id,
        order: {
          user_id: userId,
          status: 'COMPLETED',
        },
      },
      select: { order_id: true },
    })
    if (!purchased) {
      throw new ForbiddenException('Vous devez avoir acheté ce produit pour laisser un avis')
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { product_id_user_id: { product_id: product.id, user_id: userId } },
    })
    if (existing) {
      throw new BadRequestException('Vous avez déjà noté ce produit')
    }

    const review = await this.prisma.productReview.create({
      data: {
        product_id: product.id,
        user_id: userId,
        order_id: purchased.order_id,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        status: 'PENDING',
      },
      include: {
        user: { select: { full_name: true, avatar: true } },
      },
    })

    void this.adminNotifications.productReviewPending(review.id, product.name)

    return review
  }

  private async resolveProduct(slug: string, shopSlug?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        ...(shopSlug
          ? { shop: { slug: shopSlug, is_active: true, status: 'ACTIVE' } }
          : { shop: { is_active: true, status: 'ACTIVE' } }),
      },
      select: { id: true, name: true, slug: true },
    })
    if (!product) throw new NotFoundException('Produit introuvable')
    return product
  }
}
