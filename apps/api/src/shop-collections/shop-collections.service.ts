import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ShopsService } from '../shops/shops.service'
import { slugify } from '../marketplace/marketplace.util'
import {
  CreateShopCollectionDto,
  ReorderShopCollectionsDto,
  SetCollectionProductsDto,
  UpdateShopCollectionDto,
} from './dto/shop-collection.dto'

@Injectable()
export class ShopCollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
  ) {}

  private async uniqueSlug(shopId: string, base: string, excludeId?: string) {
    let slug = slugify(base)
    if (!slug) slug = 'collection'
    let candidate = slug
    let n = 1
    while (true) {
      const existing = await this.prisma.shopCollection.findFirst({
        where: {
          shop_id: shopId,
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      })
      if (!existing) return candidate
      candidate = `${slug}-${n++}`
    }
  }

  private formatCollection(row: {
    id: string
    name: string
    slug: string
    description: string | null
    sort_order: number
    is_active: boolean
    created_at: Date
    updated_at: Date
    _count?: { products: number }
  }) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sort_order: row.sort_order,
      is_active: row.is_active,
      product_count: row._count?.products ?? 0,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    }
  }

  async listMine(userId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const rows = await this.prisma.shopCollection.findMany({
      where: { shop_id: shop.id },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { sort_order: 'asc' },
          select: { product_id: true },
        },
      },
    })
    return rows.map(r => ({
      ...this.formatCollection(r),
      product_ids: r.products.map(p => p.product_id),
    }))
  }

  async getMine(userId: string, collectionId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const row = await this.prisma.shopCollection.findFirst({
      where: { id: collectionId, shop_id: shop.id },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { sort_order: 'asc' },
          select: {
            sort_order: true,
            product: {
              select: { id: true, name: true, slug: true, status: true, image_url: true },
            },
          },
        },
      },
    })
    if (!row) throw new NotFoundException('Collection introuvable')

    return {
      ...this.formatCollection(row),
      product_ids: row.products.map(p => p.product.id),
      products: row.products.map(link => ({
        ...link.product,
        sort_order: link.sort_order,
      })),
    }
  }

  async create(userId: string, dto: CreateShopCollectionDto, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const slug = await this.uniqueSlug(shop.id, dto.slug?.trim() || dto.name)

    const maxOrder = await this.prisma.shopCollection.aggregate({
      where: { shop_id: shop.id },
      _max: { sort_order: true },
    })

    const row = await this.prisma.shopCollection.create({
      data: {
        shop_id: shop.id,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        sort_order: (maxOrder._max.sort_order ?? -1) + 1,
      },
      include: { _count: { select: { products: true } } },
    })

    return this.formatCollection(row)
  }

  async update(
    userId: string,
    collectionId: string,
    dto: UpdateShopCollectionDto,
    shopId?: string,
  ) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const existing = await this.prisma.shopCollection.findFirst({
      where: { id: collectionId, shop_id: shop.id },
    })
    if (!existing) throw new NotFoundException('Collection introuvable')

    const row = await this.prisma.shopCollection.update({
      where: { id: collectionId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
      },
      include: { _count: { select: { products: true } } },
    })

    return this.formatCollection(row)
  }

  async remove(userId: string, collectionId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const existing = await this.prisma.shopCollection.findFirst({
      where: { id: collectionId, shop_id: shop.id },
    })
    if (!existing) throw new NotFoundException('Collection introuvable')

    await this.prisma.shopCollection.delete({ where: { id: collectionId } })
    return { ok: true }
  }

  async setProducts(
    userId: string,
    collectionId: string,
    dto: SetCollectionProductsDto,
    shopId?: string,
  ) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const collection = await this.prisma.shopCollection.findFirst({
      where: { id: collectionId, shop_id: shop.id },
    })
    if (!collection) throw new NotFoundException('Collection introuvable')

    const uniqueIds = [...new Set(dto.product_ids)]
    if (uniqueIds.length > 0) {
      const owned = await this.prisma.product.findMany({
        where: { shop_id: shop.id, id: { in: uniqueIds } },
        select: { id: true },
      })
      if (owned.length !== uniqueIds.length) {
        throw new BadRequestException('Un ou plusieurs produits sont invalides')
      }
    }

    await this.prisma.$transaction([
      this.prisma.productCollection.deleteMany({
        where: { collection_id: collectionId },
      }),
      ...(uniqueIds.length > 0
        ? [
            this.prisma.productCollection.createMany({
              data: uniqueIds.map((product_id, index) => ({
                product_id,
                collection_id: collectionId,
                sort_order: index,
              })),
            }),
          ]
        : []),
    ])

    const row = await this.prisma.shopCollection.findUniqueOrThrow({
      where: { id: collectionId },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { sort_order: 'asc' },
          select: {
            sort_order: true,
            product: {
              select: { id: true, name: true, slug: true, status: true, image_url: true },
            },
          },
        },
      },
    })

    return {
      ...this.formatCollection(row),
      products: row.products.map(link => ({
        ...link.product,
        sort_order: link.sort_order,
      })),
    }
  }

  async reorder(userId: string, dto: ReorderShopCollectionsDto, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const rows = await this.prisma.shopCollection.findMany({
      where: { shop_id: shop.id },
      select: { id: true },
    })
    const validIds = new Set(rows.map(r => r.id))
    if (dto.ids.some(id => !validIds.has(id))) {
      throw new BadRequestException('Liste de collections invalide')
    }

    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.shopCollection.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    )

    return this.listMine(userId, shopId)
  }

  async listPublicForShop(shopId: string) {
    const rows = await this.prisma.shopCollection.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        products: {
          some: {
            product: {
              status: 'ACTIVE',
              OR: [
                { stock_quantity: { gt: 0 } },
                { variants: { some: { stock_quantity: { gt: 0 } } } },
              ],
            },
          },
        },
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    })

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      product_count: r._count.products,
    }))
  }

  async getProductIdsForCollection(shopId: string, collectionSlug: string) {
    const collection = await this.prisma.shopCollection.findFirst({
      where: { shop_id: shopId, slug: collectionSlug, is_active: true },
      select: { id: true },
    })
    if (!collection) return null

    const links = await this.prisma.productCollection.findMany({
      where: {
        collection_id: collection.id,
        product: { shop_id: shopId, status: 'ACTIVE' },
      },
      orderBy: { sort_order: 'asc' },
      select: { product_id: true },
    })

    return links.map(l => l.product_id)
  }
}
