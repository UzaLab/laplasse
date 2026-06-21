import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  currency: true,
  image_url: true,
  status: true,
  stock_quantity: true,
  shop: {
    select: {
      slug: true,
      name: true,
      merchant: {
        select: { id: true, business_name: true, slug: true },
      },
    },
  },
} as const

@Injectable()
export class ProductFavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    })
    if (!product || product.status === 'ARCHIVED' || product.status === 'DRAFT') {
      throw new NotFoundException('Produit introuvable')
    }

    const existing = await this.prisma.productFavorite.findFirst({
      where: { product_id: productId, user_id: userId },
    })

    if (existing) {
      await this.prisma.productFavorite.delete({ where: { id: existing.id } })
      return { is_favorited: false, product_id: productId }
    }

    await this.prisma.productFavorite.create({
      data: { product_id: productId, user_id: userId },
    })
    return { is_favorited: true, product_id: productId }
  }

  async findMine(userId: string) {
    const favs = await this.prisma.productFavorite.findMany({
      where: { user_id: userId },
      include: { product: { select: productSelect } },
      orderBy: { created_at: 'desc' },
    })

    return favs.map(f => this.mapProduct(f.product))
  }

  async isFavorited(productId: string, userId: string) {
    const fav = await this.prisma.productFavorite.findFirst({
      where: { product_id: productId, user_id: userId },
    })
    return { is_favorited: !!fav }
  }

  private mapProduct(product: {
    id: string
    name: string
    slug: string
    price: number
    currency: string
    image_url: string | null
    status: string
    stock_quantity: number
    shop: {
      slug: string
      name: string
      merchant: { id: string; business_name: string; slug: string } | null
    }
  }) {
    const merchant = product.shop.merchant
      ? {
          id: product.shop.merchant.id,
          business_name: product.shop.merchant.business_name,
          slug: product.shop.merchant.slug,
        }
      : {
          id: product.shop.slug,
          business_name: product.shop.name,
          slug: product.shop.slug,
        }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      image_url: product.image_url,
      status: product.status,
      stock_quantity: product.stock_quantity,
      merchant,
    }
  }
}
