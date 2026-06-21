import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { getPlanLimits, isWithinLimit } from '../common/plan-limits'
import {
  DeliveryType,
  OrderStatus,
  Prisma,
  ProductStatus,
} from '../../generated/prisma/client'
import {
  AddCartItemDto,
  CheckoutDto,
  ConfirmBatchOrderPaymentDto,
  ConfirmOrderPaymentDto,
  CreateProductDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
} from './dto/marketplace.dto'
import { generatePaymentReference, slugify, MENU_MIRROR_SLUG_PREFIX, menuMirrorProductSlug, isMenuMirrorProductSlug } from './marketplace.util'
import {
  computeMenuUnitPrice,
  estimateFoodPrepMinutes,
  formatModifiersLabel,
  modifiersSignature,
  parseSelectedModifiers,
  validateMenuModifierSelections,
  type MenuModifierGroupRow,
} from '../common/menu-modifiers'
import { ShopsService } from '../shops/shops.service'
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service'
import { PromotionsService } from '../promotions/promotions.service'
import { SearchService } from '../search/search.service'
import { ShopCollectionsService } from '../shop-collections/shop-collections.service'
import { DeliveryService } from '../delivery/delivery.service'

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly shopsService: ShopsService,
    private readonly deliveryZones: DeliveryZonesService,
    private readonly promotionsService: PromotionsService,
    private readonly searchService: SearchService,
    private readonly shopCollections: ShopCollectionsService,
    private readonly deliveryService: DeliveryService,
  ) {}

  private shopPublicSelect = {
    id: true,
    name: true,
    slug: true,
    logo: true,
    merchant_id: true,
  } as const

  private productImagesInclude = {
    images: {
      orderBy: { sort_order: 'asc' as const },
      select: { id: true, url: true, sort_order: true },
    },
  } as const

  private resolveImageUrls(dto: { images?: string[]; image_url?: string | null }) {
    if (dto.images !== undefined) {
      return [...new Set(dto.images.map(u => u.trim()).filter(Boolean))].slice(0, 10)
    }
    if (dto.image_url?.trim()) return [dto.image_url.trim()]
    return []
  }

  private attachProductImages<T extends { image_url: string | null; images?: { url: string }[] }>(
    product: T,
  ): Omit<T, 'images'> & { images: string[]; image_url: string | null } {
    const urls = product.images?.length
      ? product.images.map(i => i.url)
      : product.image_url
        ? [product.image_url]
        : []
    const { images: _images, ...rest } = product
    return {
      ...rest,
      images: urls,
      image_url: urls[0] ?? null,
    }
  }

  private async syncProductImages(productId: string, urls: string[]) {
    const cleaned = [...new Set(urls.map(u => u.trim()).filter(Boolean))].slice(0, 10)
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { product_id: productId } }),
      ...(cleaned.length
        ? [
            this.prisma.productImage.createMany({
              data: cleaned.map((url, index) => ({
                product_id: productId,
                url,
                sort_order: index,
              })),
            }),
          ]
        : []),
      this.prisma.product.update({
        where: { id: productId },
        data: { image_url: cleaned[0] ?? null },
      }),
    ])
  }

  private async syncProductStockFromVariants(productId: string, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    const variants = await tx.productVariant.findMany({ where: { product_id: productId } })
    if (!variants.length) return
    const total = variants.reduce((sum, v) => sum + v.stock_quantity, 0)
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product) return
    await tx.product.update({
      where: { id: productId },
      data: {
        stock_quantity: total,
        price: Math.min(...variants.map(v => v.price)),
        status:
          total === 0
            ? 'OUT_OF_STOCK'
            : product.status === 'OUT_OF_STOCK'
              ? 'ACTIVE'
              : product.status,
      },
    })
  }

  private resolveUnitPrice(
    product: { price: number },
    variant?: { price: number } | null,
  ) {
    return variant?.price ?? product.price
  }

  private resolveAvailableStock(
    product: { stock_quantity: number; variants?: { stock_quantity: number }[] },
    variant?: { stock_quantity: number } | null,
  ) {
    if (product.variants?.length) {
      return variant?.stock_quantity ?? 0
    }
    return product.stock_quantity
  }

  private assertDeliveryModes(allowPickup?: boolean, allowDelivery?: boolean) {
    const pickup = allowPickup ?? true
    const delivery = allowDelivery ?? true
    if (!pickup && !delivery) {
      throw new BadRequestException('Activez au moins un mode de livraison (retrait ou livraison)')
    }
  }

  private async resolveProductCategoryId(input?: {
    category_id?: string
    category_slug?: string
  }) {
    if (!input) return undefined
    if (input.category_id === '') return null
    if (input.category_id) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { id: input.category_id, is_active: true },
        select: { id: true },
      })
      if (!cat) throw new BadRequestException('Catégorie produit invalide')
      return cat.id
    }
    if (input.category_slug) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { slug: input.category_slug.trim(), is_active: true },
        select: { id: true },
      })
      if (!cat) throw new BadRequestException('Catégorie produit invalide')
      return cat.id
    }
    return undefined
  }

  private async assertShopProductCategory(shopId: string, categoryId: string | null | undefined) {
    const enabledIds = await this.shopsService.getEnabledProductCategoryIds(shopId)
    if (enabledIds.length && !categoryId) {
      throw new BadRequestException('Sélectionnez une catégorie produit')
    }
    await this.shopsService.assertProductCategoryAllowed(shopId, categoryId)
  }

  private mapRawCartItem(
    item: {
      id: string
      quantity: number
      variant_id: string | null
      menu_item_id?: string | null
      selected_modifiers?: unknown
      menu_item?: {
        id: string
        name: string
        price: number
        currency: string
        image_url: string | null
        is_available: boolean
        prep_minutes?: number | null
        merchant: {
          id: string
          business_name: string
          slug: string
          logo?: string | null
          food_prep_minutes?: number
        }
      } | null
      product?: {
        id: string
        name: string
        slug: string
        price: number
        currency: string
        stock_quantity: number
        image_url: string | null
        status: ProductStatus
        shop_id: string
        category_id: string | null
        allow_pickup: boolean
        allow_delivery: boolean
        variants?: { id: string; name: string; price: number; stock_quantity: number }[]
        shop: {
          id: string
          name: string
          slug: string
          logo?: string | null
          merchant_id?: string | null
        }
      } | null
      variant?: { id: string; name: string; price: number; stock_quantity: number } | null
    },
  ) {
    if (item.menu_item_id && item.menu_item) {
      const m = item.menu_item
      const selectedModifiers = parseSelectedModifiers(item.selected_modifiers)
      const unitPrice = computeMenuUnitPrice(m.price, selectedModifiers)
      const modifiersLabel = formatModifiersLabel(selectedModifiers)
      return {
        id: item.id,
        quantity: item.quantity,
        variant_id: null as string | null,
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity,
        variant: null,
        line_kind: 'menu' as const,
        menu_item_id: m.id,
        selected_modifiers: selectedModifiers,
        modifiers_label: modifiersLabel,
        menu_item: {
          id: m.id,
          name: m.name,
          price: m.price,
          currency: m.currency,
          image_url: m.image_url,
          prep_minutes: m.prep_minutes ?? null,
        },
        product: {
          id: m.id,
          name: m.name,
          slug: `menu-${m.id}`,
          price: m.price,
          currency: m.currency,
          stock_quantity: 9999,
          image_url: m.image_url,
          status: 'ACTIVE' as ProductStatus,
          shop_id: null as string | null,
          category_id: null,
          allow_pickup: true,
          allow_delivery: true,
          has_variants: false,
          merchant: {
            id: m.merchant.id,
            business_name: m.merchant.business_name,
            slug: m.merchant.slug,
            logo: m.merchant.logo ?? null,
            food_prep_minutes: m.merchant.food_prep_minutes ?? 25,
          },
        },
      }
    }

    if (!item.product) {
      throw new BadRequestException('Article de panier invalide')
    }

    const unitPrice = this.resolveUnitPrice(item.product, item.variant)
    return {
      id: item.id,
      quantity: item.quantity,
      variant_id: item.variant_id,
      unit_price: unitPrice,
      line_total: unitPrice * item.quantity,
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            price: item.variant.price,
            stock_quantity: item.variant.stock_quantity,
          }
        : null,
      line_kind: 'product' as const,
      menu_item_id: null as string | null,
      menu_item: null,
      selected_modifiers: [],
      modifiers_label: null,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        currency: item.product.currency,
        stock_quantity: item.product.stock_quantity,
        image_url: item.product.image_url,
        status: item.product.status,
        shop_id: item.product.shop_id,
        category_id: item.product.category_id,
        allow_pickup: item.product.allow_pickup,
        allow_delivery: item.product.allow_delivery,
        shop: item.product.shop,
        merchant: {
          id: item.product.shop.merchant_id ?? item.product.shop.id,
          business_name: item.product.shop.name,
          slug: item.product.shop.slug,
        },
        has_variants: (item.product.variants?.length ?? 0) > 0,
      },
    }
  }

  private buildCartResponse(
    cart: { id: string },
    rawItems: Parameters<MarketplaceService['mapRawCartItem']>[0][],
  ) {
    const items = rawItems.map(i => this.mapRawCartItem(i))
    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
    const kind = this.detectCartKindFromMapped(items)

    if (kind === 'food') {
      const merchantMap = new Map<
        string,
        { id: string; business_name: string; slug: string; subtotal: number; item_count: number }
      >()
      for (const item of items) {
        const m = item.product.merchant
        const existing = merchantMap.get(m.id)
        if (existing) {
          existing.subtotal += item.line_total
          existing.item_count += item.quantity
        } else {
          merchantMap.set(m.id, {
            id: m.id,
            business_name: m.business_name,
            slug: m.slug,
            subtotal: item.line_total,
            item_count: item.quantity,
          })
        }
      }
      const merchants = Array.from(merchantMap.values())
      const single = merchants.length === 1 ? merchants[0] : null
      const prepSource = items
        .filter(i => i.line_kind === 'menu')
        .map(i => ({
          prep_minutes: i.menu_item?.prep_minutes ?? null,
          quantity: i.quantity,
        }))
      const merchantPrepDefault = items.find(i => i.line_kind === 'menu')?.product.merchant.food_prep_minutes ?? 25
      const estimated_prep_minutes = prepSource.length
        ? estimateFoodPrepMinutes(merchantPrepDefault, prepSource)
        : null
      return {
        id: cart.id,
        items,
        subtotal,
        currency: 'XOF',
        kind,
        estimated_prep_minutes,
        shops: [],
        shop_count: 0,
        shop_id: null,
        shop: null,
        merchants,
        merchant_count: merchants.length,
        merchant_id: single?.id ?? null,
        merchant: single
          ? {
              id: single.id,
              business_name: single.business_name,
              slug: single.slug,
              subtotal: single.subtotal,
              item_count: single.item_count,
            }
          : null,
        item_count: items.reduce((n, i) => n + i.quantity, 0),
        delivery_options: { allow_pickup: true, allow_delivery: true },
      }
    }

    const shopMap = new Map<
      string,
      { id: string; name: string; slug: string; subtotal: number; item_count: number }
    >()

    for (const item of items) {
      const s = item.product.shop!
      const existing = shopMap.get(s.id)
      if (existing) {
        existing.subtotal += item.line_total
        existing.item_count += item.quantity
      } else {
        shopMap.set(s.id, {
          id: s.id,
          name: s.name,
          slug: s.slug,
          subtotal: item.line_total,
          item_count: item.quantity,
        })
      }
    }

    const shops = Array.from(shopMap.values())
    const merchants = shops.map(s => ({
      id: s.id,
      business_name: s.name,
      slug: s.slug,
      subtotal: s.subtotal,
      item_count: s.item_count,
    }))
    const singleShop = shops.length === 1 ? shops[0] : null
    const singleMerchant = singleShop
      ? {
          id: singleShop.id,
          business_name: singleShop.name,
          slug: singleShop.slug,
          subtotal: singleShop.subtotal,
          item_count: singleShop.item_count,
        }
      : null

    return {
      id: cart.id,
      items,
      subtotal,
      currency: 'XOF',
      kind,
      shops,
      shop_count: shops.length,
      shop_id: singleShop?.id ?? null,
      shop: singleShop,
      merchants,
      merchant_count: shops.length,
      merchant_id: singleMerchant?.id ?? null,
      merchant: singleMerchant,
      item_count: items.reduce((n, i) => n + i.quantity, 0),
      delivery_options: {
        allow_pickup: items.length > 0 && items.every(i => i.product.allow_pickup),
        allow_delivery: items.length > 0 && items.every(i => i.product.allow_delivery),
      },
    }
  }

  private detectCartKindFromMapped(
    items: Array<{ line_kind: 'menu' | 'product' }>,
  ): 'empty' | 'marketplace' | 'food' | 'mixed' {
    if (!items.length) return 'empty'
    const flags = items.map(i => i.line_kind === 'menu')
    if (flags.every(Boolean)) return 'food'
    if (flags.every(f => !f)) return 'marketplace'
    return 'mixed'
  }

  private detectCartKindFromRaw(
    items: Array<{ menu_item_id?: string | null; product_id?: string | null }>,
  ): 'empty' | 'marketplace' | 'food' | 'mixed' {
    if (!items.length) return 'empty'
    const hasMenu = items.some(i => i.menu_item_id)
    const hasProduct = items.some(i => i.product_id)
    if (hasMenu && hasProduct) return 'mixed'
    if (hasMenu) return 'food'
    if (hasProduct) return 'marketplace'
    return 'empty'
  }

  private assertHomogeneousCartFromRaw(
    existingItems: Array<{ menu_item_id?: string | null; product_id?: string | null }>,
    incomingIsFood: boolean,
  ) {
    const kind = this.detectCartKindFromRaw(existingItems)
    if (kind === 'empty' || kind === 'mixed') return
    if (kind === 'food' && !incomingIsFood) {
      throw new BadRequestException(
        'Finalisez ou videz votre commande restaurant avant d\'ajouter des produits boutique.',
      )
    }
    if (kind === 'marketplace' && incomingIsFood) {
      throw new BadRequestException(
        'Videz votre panier marketplace avant de commander au restaurant.',
      )
    }
  }

  private merchantOrderScope(shop: { id: string; merchant_id: string | null }) {
    if (shop.merchant_id) {
      return {
        OR: [
          { shop_id: shop.id },
          { order_source: 'FOOD' as const, merchant_id: shop.merchant_id },
        ],
      }
    }
    return { shop_id: shop.id }
  }

  private async resolveShopBySlug(slug: string) {
    return this.shopsService.getByMerchantSlug(slug)
  }

  // ─── Products (public) ───────────────────────────────────────────────────────

  async listPublicProducts(
    shopSlug: string,
    query?: { category?: string; q?: string; collection?: string },
  ) {
    const shop = await this.resolveShopBySlug(shopSlug)

    if (query?.collection?.trim()) {
      const productIds = await this.shopCollections.getProductIdsForCollection(
        shop.id,
        query.collection.trim(),
      )
      if (!productIds?.length) return []
      let products = await this.fetchPublicProductsByIds(shop.id, productIds)

      if (query?.category?.trim()) {
        const cat = await this.prisma.productCategory.findFirst({
          where: { slug: query.category.trim(), is_active: true },
          select: { id: true },
        })
        if (cat) {
          products = products.filter(p => p.category_id === cat.id)
        } else {
          return []
        }
      }

      if (query?.q?.trim()) {
        const q = query.q.trim().toLowerCase()
        products = products.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false),
        )
      }

      return products
    }

    if (query?.q?.trim()) {
      const meili = await this.searchService.searchProducts({
        q: query.q.trim(),
        category: query?.category,
        shop: shopSlug,
        limit: 100,
      })
      if (meili?.data.length) {
        const ids = meili.data.map(p => p.id)
        return this.fetchPublicProductsByIds(shop.id, ids)
      }
      if (meili) return []
    }

    let categoryId: string | undefined
    if (query?.category?.trim()) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { slug: query.category.trim(), is_active: true },
        select: { id: true },
      })
      if (!cat) return []
      categoryId = cat.id
    }

    const products = await this.prisma.product.findMany({
      where: {
        shop_id: shop.id,
        status: 'ACTIVE',
        slug: { not: { startsWith: MENU_MIRROR_SLUG_PREFIX } },
        ...(categoryId ? { category_id: categoryId } : {}),
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        stock_quantity: true,
        image_url: true,
        status: true,
        category_id: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: { id: true, name: true, price: true, stock_quantity: true },
        },
      },
    })
    return products.filter(
      p => p.stock_quantity > 0 || p.variants.some(v => v.stock_quantity > 0),
    )
  }

  private async fetchPublicProductsByIds(shopId: string, ids: string[]) {
    const products = await this.prisma.product.findMany({
      where: {
        shop_id: shopId,
        id: { in: ids },
        status: 'ACTIVE',
        slug: { not: { startsWith: MENU_MIRROR_SLUG_PREFIX } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        stock_quantity: true,
        image_url: true,
        status: true,
        category_id: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: { id: true, name: true, price: true, stock_quantity: true },
        },
      },
    })
    const order = new Map(ids.map((id, index) => [id, index]))
    return products
      .filter(p => p.stock_quantity > 0 || p.variants.some(v => v.stock_quantity > 0))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }

  async listPublicShopProductCategories(shopSlug: string) {
    const shop = await this.resolveShopBySlug(shopSlug)
    return this.prisma.productCategory.findMany({
      where: {
        is_active: true,
        products: {
          some: {
            shop_id: shop.id,
            status: 'ACTIVE',
            slug: { not: { startsWith: MENU_MIRROR_SLUG_PREFIX } },
            OR: [
              { stock_quantity: { gt: 0 } },
              { variants: { some: { stock_quantity: { gt: 0 } } } },
            ],
          },
        },
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, icon: true },
    })
  }

  async listPublicShopCollections(shopSlug: string) {
    const shop = await this.resolveShopBySlug(shopSlug)
    return this.shopCollections.listPublicForShop(shop.id)
  }

  async getPublicProduct(shopSlug: string, productSlug: string) {
    const shop = await this.resolveShopBySlug(shopSlug)
    const product = await this.prisma.product.findFirst({
      where: {
        shop_id: shop.id,
        slug: productSlug,
        status: { in: ['ACTIVE', 'OUT_OF_STOCK'] },
      },
      include: {
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: { id: true, name: true, price: true, stock_quantity: true, sku: true },
        },
        ...this.productImagesInclude,
      },
    })
    if (!product) throw new NotFoundException('Produit introuvable')
    return this.attachProductImages({
      ...product,
      has_variants: product.variants.length > 0,
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        logo: shop.logo,
      },
      merchant: shop.merchant
        ? {
            id: shop.merchant.id,
            business_name: shop.merchant.business_name,
            slug: shop.merchant.slug,
          }
        : {
            id: shop.id,
            business_name: shop.name,
            slug: shop.slug,
          },
    })
  }

  // ─── Products (boutique) ─────────────────────────────────────────────────────

  async listMyProducts(userId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    return this.prisma.product.findMany({
      where: { shop_id: shop.id },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      include: {
        category: { select: { id: true, name: true, slug: true, parent_id: true } },
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
        ...this.productImagesInclude,
      },
    }).then(products => products.map(p => this.attachProductImages(p)))
  }

  async createProduct(userId: string, dto: CreateProductDto, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)

    const plan = shop.merchant?.subscription_plan ?? 'FREE'
    const limits = getPlanLimits(plan)
    if (!limits.marketplace) {
      throw new ForbiddenException('Marketplace non disponible pour ce plan')
    }

    const count = await this.prisma.product.count({ where: { shop_id: shop.id } })
    if (!isWithinLimit(count, limits.maxProducts)) {
      throw new ForbiddenException(`Limite de ${limits.maxProducts} produits atteinte pour votre plan`)
    }

    let baseSlug = slugify(dto.name)
    let slug = baseSlug
    let n = 1
    while (await this.prisma.product.findFirst({ where: { shop_id: shop.id, slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const hasVariants = (dto.variants?.length ?? 0) > 0
    const stock = hasVariants
      ? dto.variants!.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      : dto.stock_quantity ?? 0
    const price = hasVariants
      ? Math.min(...dto.variants!.map(v => v.price))
      : dto.price
    const status = dto.status ?? (stock > 0 ? 'ACTIVE' : 'DRAFT')
    this.assertDeliveryModes(dto.allow_pickup, dto.allow_delivery)
    const imageUrls = this.resolveImageUrls(dto)
    const categoryId = await this.resolveProductCategoryId(dto)
    await this.assertShopProductCategory(shop.id, categoryId)

    const created = await this.prisma.product.create({
      data: {
        shop_id: shop.id,
        category_id: categoryId ?? undefined,
        name: dto.name,
        slug,
        description: dto.description,
        composition: dto.composition,
        price,
        stock_quantity: stock,
        image_url: imageUrls[0] ?? null,
        allow_pickup: dto.allow_pickup ?? true,
        allow_delivery: dto.allow_delivery ?? true,
        status,
        images: imageUrls.length
          ? {
              create: imageUrls.map((url, index) => ({ url, sort_order: index })),
            }
          : undefined,
        variants: hasVariants
          ? {
              create: dto.variants!.map((v, index) => ({
                name: v.name,
                price: v.price,
                stock_quantity: v.stock_quantity ?? 0,
                sku: v.sku,
                sort_order: index,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
        ...this.productImagesInclude,
      },
    })
    void this.searchService.syncProduct(created.id)
    return this.attachProductImages(created)
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, shop_id: shop.id },
      include: { variants: true },
    })
    if (!existing) throw new NotFoundException('Produit introuvable')

    let status = dto.status
    let stock = dto.stock_quantity
    let price = dto.price

    if (dto.variants) {
      await this.prisma.productVariant.deleteMany({ where: { product_id: productId } })
      if (dto.variants.length > 0) {
        await this.prisma.productVariant.createMany({
          data: dto.variants.map((v, index) => ({
            product_id: productId,
            name: v.name,
            price: v.price,
            stock_quantity: v.stock_quantity ?? 0,
            sku: v.sku,
            sort_order: index,
          })),
        })
        stock = dto.variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
        price = Math.min(...dto.variants.map(v => v.price))
      }
    }

    if (stock !== undefined && stock === 0 && !status) {
      status = 'OUT_OF_STOCK'
    } else if (stock !== undefined && stock > 0 && existing.status === 'OUT_OF_STOCK' && !status) {
      status = 'ACTIVE'
    }

    const allowPickup = dto.allow_pickup ?? existing.allow_pickup
    const allowDelivery = dto.allow_delivery ?? existing.allow_delivery
    this.assertDeliveryModes(allowPickup, allowDelivery)

    const imageUrls = dto.images !== undefined
      ? this.resolveImageUrls({ images: dto.images })
      : dto.image_url !== undefined
        ? this.resolveImageUrls({ image_url: dto.image_url })
        : undefined

    const categoryId = await this.resolveProductCategoryId(dto)
    const finalCategoryId = categoryId !== undefined ? categoryId : existing.category_id
    await this.assertShopProductCategory(shop.id, finalCategoryId)

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        price,
        stock_quantity: stock,
        ...(categoryId !== undefined ? { category_id: categoryId } : {}),
        ...(imageUrls !== undefined ? { image_url: imageUrls[0] ?? null } : {}),
        allow_pickup: dto.allow_pickup,
        allow_delivery: dto.allow_delivery,
        status,
      },
    })

    if (imageUrls !== undefined) {
      await this.syncProductImages(productId, imageUrls)
    }

    const withImages = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        variants: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        ...this.productImagesInclude,
      },
    })
    void this.searchService.syncProduct(productId)
    return this.attachProductImages(withImages)
  }

  async deleteProduct(userId: string, productId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, shop_id: shop.id },
    })
    if (!existing) throw new NotFoundException('Produit introuvable')
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    })
    void this.searchService.removeProduct(productId)
    return { success: true }
  }

  // ─── Cart ────────────────────────────────────────────────────────────────────

  private cartItemInclude = {
    menu_item: {
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        image_url: true,
        is_available: true,
        prep_minutes: true,
        merchant: {
          select: {
            id: true,
            business_name: true,
            slug: true,
            logo: true,
            is_active: true,
            food_prep_minutes: true,
          },
        },
      },
    },
    product: {
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        stock_quantity: true,
        image_url: true,
        status: true,
        shop_id: true,
        allow_pickup: true,
        allow_delivery: true,
        category_id: true,
        variants: { select: { id: true, name: true, price: true, stock_quantity: true } },
        shop: true,
      },
    },
    variant: {
      select: { id: true, name: true, price: true, stock_quantity: true },
    },
  } as const

  private filterActiveCartItems(
    items: Awaited<ReturnType<MarketplaceService['getOrCreateCart']>>['items'],
  ): Awaited<ReturnType<MarketplaceService['getOrCreateCart']>>['items'] {
    return items.filter(i => {
      if (i.menu_item_id) return i.menu_item?.is_available ?? false
      return i.product?.status === 'ACTIVE'
    })
  }

  private resolveOrderOwnerId(order: {
    shop?: { owner_id: string } | null
    merchant?: { owner_id: string } | null
  }) {
    return order.shop?.owner_id ?? order.merchant?.owner_id
  }

  private resolveOrderMerchantMeta(order: {
    merchant?: { id: string; business_name: string; slug: string } | null
    shop?: { id: string; name: string; slug: string } | null
    merchant_id?: string | null
    shop_id?: string | null
  }) {
    return {
      id: order.merchant?.id ?? order.shop?.id ?? order.merchant_id ?? '',
      business_name: order.merchant?.business_name ?? order.shop?.name ?? '',
      slug: order.merchant?.slug ?? order.shop?.slug ?? '',
    }
  }

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
      include: {
        items: { include: this.cartItemInclude },
      },
    })
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)
    const items = this.filterActiveCartItems(cart.items)
    return this.buildCartResponse(cart, items)
  }

  async addToCart(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        shop: true,
        variants: true,
      },
    })
    if (!product || product.status !== 'ACTIVE') {
      throw new BadRequestException('Produit indisponible')
    }
    if (isMenuMirrorProductSlug(product.slug)) {
      throw new BadRequestException(
        'Ce produit provient d\'un ancien flux menu — recommandez depuis le menu du restaurant.',
      )
    }
    if (!product.shop.is_active || product.shop.status !== 'ACTIVE') {
      throw new BadRequestException('Boutique indisponible')
    }

    const cart = await this.getOrCreateCart(userId)
    this.assertHomogeneousCartFromRaw(cart.items, false)

    const hasVariants = product.variants.length > 0
    let variant: (typeof product.variants)[number] | null = null

    if (hasVariants) {
      if (!dto.variantId) {
        throw new BadRequestException('Sélectionnez une variante pour ce produit')
      }
      variant = product.variants.find(v => v.id === dto.variantId) ?? null
      if (!variant) throw new BadRequestException('Variante introuvable')
    } else if (dto.variantId) {
      throw new BadRequestException('Ce produit n\'a pas de variantes')
    }

    const availableStock = this.resolveAvailableStock(product, variant)
    if (availableStock < dto.quantity) {
      throw new BadRequestException('Stock insuffisant')
    }

    const variantId = variant?.id ?? null

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: product.id,
        variant_id: variantId,
      },
    })

    if (existing) {
      const newQty = existing.quantity + dto.quantity
      if (availableStock < newQty) {
        throw new BadRequestException('Stock insuffisant')
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await this.prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: product.id,
          variant_id: variantId,
          quantity: dto.quantity,
        },
      })
    }

    return this.getCart(userId)
  }

  /** Ajoute un plat du menu au panier — entité MenuItem, sans produit boutique. */
  async addMenuItemToCart(
    userId: string,
    menuItemId: string,
    quantity: number,
    optionIds?: string[],
  ) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, is_available: true },
      include: {
        merchant: { select: { id: true, is_active: true } },
        modifier_groups: {
          orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
          include: {
            options: {
              where: { is_available: true },
              orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
            },
          },
        },
      },
    })
    if (!menuItem) throw new NotFoundException('Plat introuvable ou indisponible')
    if (!menuItem.merchant.is_active) {
      throw new BadRequestException('Ce restaurant n\'accepte pas de commandes pour le moment')
    }

    const groups: MenuModifierGroupRow[] = menuItem.modifier_groups.map(group => ({
      id: group.id,
      name: group.name,
      min_select: group.min_select,
      max_select: group.max_select,
      sort_order: group.sort_order,
      options: group.options.map(option => ({
        id: option.id,
        name: option.name,
        price_delta: option.price_delta,
        is_available: option.is_available,
        sort_order: option.sort_order,
      })),
    }))

    let selectedModifiers: ReturnType<typeof parseSelectedModifiers> = []
    try {
      selectedModifiers = validateMenuModifierSelections(groups, optionIds ?? [])
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'Options invalides')
    }

    const cart = await this.getOrCreateCart(userId)
    this.assertHomogeneousCartFromRaw(cart.items, true)

    const targetSignature = modifiersSignature(selectedModifiers)
    const existing = cart.items.find(i => {
      if (i.menu_item_id !== menuItemId) return false
      return modifiersSignature(parseSelectedModifiers(i.selected_modifiers)) === targetSignature
    })

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      await this.prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          menu_item_id: menuItemId,
          quantity,
          selected_modifiers: selectedModifiers as unknown as Prisma.InputJsonValue,
        },
      })
    }

    return this.getCart(userId)
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId)
    const item = cart.items.find(i => i.id === itemId)
    if (!item) throw new NotFoundException('Article introuvable dans le panier')

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } })
    } else if (item.menu_item_id) {
      if (!item.menu_item?.is_available) {
        throw new BadRequestException('Plat indisponible')
      }
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
    } else if (item.product) {
      const availableStock = this.resolveAvailableStock(item.product, item.variant)
      if (availableStock < quantity) {
        throw new BadRequestException('Stock insuffisant')
      }
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
    }

    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)
    await this.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } })
    return { success: true }
  }

  // ─── Checkout & Orders ─────────────────────────────────────────────────────

  async applyCartPromo(userId: string, code: string, shopIdFilter?: string) {
    const rawCart = await this.getOrCreateCart(userId)
    const activeItems = this.filterActiveCartItems(rawCart.items)
    const retailItems = activeItems.filter(i => i.product_id && !i.menu_item_id)
    if (!retailItems.length) {
      throw new BadRequestException(
        'Les codes promo s\'appliquent aux achats marketplace, pas aux commandes restaurant.',
      )
    }

    const cart = this.buildCartResponse(rawCart, retailItems)
    const shopGroups = new Map<string, { subtotal: number; name: string; merchantId: string | null }>()

    for (const item of cart.items) {
      const sid = item.product.shop_id
      const shop = item.product.shop
      if (!sid || !shop) continue
      const existing = shopGroups.get(sid)
      if (existing) {
        existing.subtotal += item.line_total
      } else {
        shopGroups.set(sid, {
          subtotal: item.line_total,
          name: shop.name,
          merchantId: shop.merchant_id ?? null,
        })
      }
    }

    const applications: Array<{
      shop_id: string
      shop_name: string
      valid: boolean
      code: string
      promotion_id?: string
      promotion_title?: string
      discount: number
      free_delivery: boolean
      message: string
    }> = []

    for (const [shopId, group] of shopGroups) {
      if (shopIdFilter && shopId !== shopIdFilter) continue

      if (!group.merchantId) {
        applications.push({
          shop_id: shopId,
          shop_name: group.name,
          valid: false,
          code: code.trim().toUpperCase(),
          discount: 0,
          free_delivery: false,
          message: 'Promotions indisponibles pour cette boutique',
        })
        continue
      }

      const shopLineItems = cart.items
        .filter(i => i.product.shop_id === shopId)
        .map(i => ({
          category_id: i.product.category_id ?? null,
          line_total: i.line_total,
        }))

      const result = await this.promotionsService.validateForShop({
        code,
        merchantId: group.merchantId,
        shopId,
        subtotal: group.subtotal,
        lineItems: shopLineItems,
      })

      applications.push({
        shop_id: shopId,
        shop_name: group.name,
        valid: result.valid,
        code: code.trim().toUpperCase(),
        promotion_id: result.valid ? result.promotion.id : undefined,
        promotion_title: result.valid ? result.promotion.title : undefined,
        discount: result.valid ? result.discount : 0,
        free_delivery: result.valid ? result.free_delivery : false,
        message: result.message,
      })
    }

    const total_discount = applications.reduce((sum, a) => sum + (a.valid ? a.discount : 0), 0)

    return { applications, total_discount }
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const rawCart = await this.getOrCreateCart(userId)
    const activeItems = this.filterActiveCartItems(rawCart.items)
    if (!activeItems.length) {
      throw new BadRequestException('Panier vide')
    }

    const cartKind = this.detectCartKindFromRaw(activeItems)
    if (cartKind === 'mixed') {
      throw new BadRequestException('Panier incompatible — videz-le et recommencez.')
    }
    if (cartKind === 'food') {
      return this.checkoutFoodOrder(userId, dto, rawCart, activeItems)
    }

    return this.checkoutMarketplaceOrder(userId, dto, rawCart, activeItems)
  }

  private async checkoutMarketplaceOrder(
    userId: string,
    dto: CheckoutDto,
    rawCart: Awaited<ReturnType<MarketplaceService['getOrCreateCart']>>,
    activeItems: typeof rawCart.items,
  ) {
    const isDelivery = dto.delivery_type === 'DELIVERY'

    if (isDelivery) {
      const hasStructured =
        dto.delivery_city_id?.trim() && dto.delivery_commune_id?.trim()
      const hasLegacy = dto.delivery_address?.trim()
      if (!hasStructured && !hasLegacy) {
        throw new BadRequestException('Adresse de livraison requise (ville, commune et quartier)')
      }
    }

    if (isDelivery) {
      const blocked = activeItems.filter(i => i.product && !i.product.allow_delivery)
      if (blocked.length) {
        const names = blocked.map(i => i.product!.name).join(', ')
        throw new BadRequestException(
          `Livraison indisponible pour : ${names}. Retirez ces articles ou choisissez le retrait sur place.`,
        )
      }
    }

    if (dto.delivery_type === 'PICKUP') {
      const blocked = activeItems.filter(i => i.product && !i.product.allow_pickup)
      if (blocked.length) {
        const names = blocked.map(i => i.product!.name).join(', ')
        throw new BadRequestException(
          `Retrait sur place indisponible pour : ${names}.`,
        )
      }
    }

    const cart = this.buildCartResponse(rawCart, activeItems)

    for (const item of cart.items) {
      const availableStock = item.variant
        ? item.variant.stock_quantity
        : item.product.stock_quantity
      if (availableStock < item.quantity) {
        const label = item.variant
          ? `${item.product.name} (${item.variant.name})`
          : item.product.name
        throw new BadRequestException(`Stock insuffisant pour ${label}`)
      }
    }

    const groups = new Map<string, typeof cart.items>()
    const subtotals: Record<string, number> = {}
    for (const item of cart.items) {
      const sid = item.product.shop_id
      if (!sid) {
        throw new BadRequestException('Article marketplace invalide dans le panier')
      }
      const list = groups.get(sid) ?? []
      list.push(item)
      groups.set(sid, list)
      subtotals[sid] = (subtotals[sid] ?? 0) + item.line_total
    }

    let deliveryQuotes: Awaited<ReturnType<DeliveryZonesService['quote']>> | null = null
    let cityName: string | undefined
    let communeName: string | undefined

    if (isDelivery && dto.delivery_city_id && dto.delivery_commune_id) {
      const [city, commune] = await Promise.all([
        this.prisma.geoCity.findUnique({ where: { id: dto.delivery_city_id } }),
        this.prisma.geoCommune.findUnique({ where: { id: dto.delivery_commune_id } }),
      ])
      cityName = city?.name
      communeName = commune?.name

      deliveryQuotes = await this.deliveryZones.quote({
        shop_ids: Array.from(groups.keys()),
        city_id: dto.delivery_city_id,
        commune_id: dto.delivery_commune_id,
        subtotals,
        order_flow: 'marketplace',
      })

      const unavailable = deliveryQuotes.quotes.filter(q => !q.available)
      if (unavailable.length) {
        const names = unavailable.map(q => q.shop_name).join(', ')
        throw new BadRequestException(
          `Livraison indisponible pour : ${names}. ${unavailable[0].message ?? ''}`.trim(),
        )
      }
    }

    const promoByShop = new Map(
      (dto.applied_promotions ?? []).map(p => [p.shop_id, p]),
    )

    const deliveryAddress = isDelivery
      ? dto.delivery_address?.trim()
        || [dto.delivery_district, communeName, cityName, dto.delivery_address_detail]
          .filter(Boolean)
          .join(', ')
      : undefined

    const checkoutOrders = await this.prisma.$transaction(async tx => {
      const results: Array<{
        orderId: string
        paymentId: string
        reference: string
        amount: number
        subtotal: number
        discount_amount: number
        delivery_fee: number
        shop: { id: string; name: string; slug: string }
        merchant: { id: string; business_name: string; slug: string }
      }> = []

      for (const [groupShopId, items] of groups) {
        const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
        const reference = generatePaymentReference()
        const shopInfo = items[0].product.shop
        if (!shopInfo) {
          throw new BadRequestException('Boutique introuvable pour cette commande')
        }
        const linkedMerchantId = shopInfo.merchant_id ?? null

        let deliveryFee = 0
        if (isDelivery && deliveryQuotes) {
          const quote = deliveryQuotes.quotes.find(q => q.shop_id === groupShopId)
          deliveryFee = quote?.fee ?? 0
        }

        let discountAmount = 0
        let promotionId: string | null = null
        const applied = promoByShop.get(groupShopId)

        if (applied && linkedMerchantId) {
          const shopLineItems = items.map(i => ({
            category_id: i.product.category_id ?? null,
            line_total: i.line_total,
          }))
          const validation = await this.promotionsService.validateForShop({
            code: applied.code,
            merchantId: linkedMerchantId,
            shopId: groupShopId,
            subtotal,
            lineItems: shopLineItems,
          })
          if (!validation.valid || validation.promotion.id !== applied.promotion_id) {
            throw new BadRequestException(
              `Code promo invalide pour ${shopInfo.name}`,
            )
          }
          discountAmount = validation.discount
          promotionId = validation.promotion.id
          if (validation.free_delivery) {
            deliveryFee = 0
          }
        }

        const total = Math.max(0, subtotal - discountAmount + deliveryFee)

        const order = await tx.order.create({
          data: {
            user_id: userId,
            shop_id: groupShopId,
            merchant_id: linkedMerchantId,
            promotion_id: promotionId,
            status: 'PENDING',
            delivery_type: dto.delivery_type,
            delivery_address: deliveryAddress,
            delivery_city_id: dto.delivery_city_id,
            delivery_commune_id: dto.delivery_commune_id,
            delivery_district: dto.delivery_district,
            customer_note: dto.customer_note,
            customer_phone: dto.customer_phone,
            subtotal,
            discount_amount: discountAmount,
            delivery_fee: deliveryFee,
            total,
            items: {
              create: items.map(item => ({
                product_id: item.product.id,
                variant_id: item.variant_id,
                product_name: item.product.name,
                variant_name: item.variant?.name ?? null,
                unit_price: item.unit_price,
                quantity: item.quantity,
                line_total: item.line_total,
              })),
            },
          },
        })

        if (promotionId && discountAmount > 0) {
          await tx.promotionRedemption.create({
            data: {
              promotion_id: promotionId,
              order_id: order.id,
              user_id: userId,
              amount_saved: discountAmount,
            },
          })
          await tx.promotion.update({
            where: { id: promotionId },
            data: { uses_count: { increment: 1 } },
          })
        } else if (promotionId) {
          await tx.promotion.update({
            where: { id: promotionId },
            data: { uses_count: { increment: 1 } },
          })
        }

        const payment = await tx.paymentTransaction.create({
          data: {
            user_id: userId,
            shop_id: groupShopId,
            merchant_id: linkedMerchantId,
            purpose: 'ORDER',
            amount: total,
            reference,
            order_id: order.id,
            metadata: {
              simulator: true,
              order_id: order.id,
              discount_amount: discountAmount,
              delivery_fee: deliveryFee,
            },
          },
        })

        const shopPayload = {
          id: shopInfo.id,
          name: shopInfo.name,
          slug: shopInfo.slug,
        }
        results.push({
          orderId: order.id,
          paymentId: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          subtotal,
          discount_amount: discountAmount,
          delivery_fee: deliveryFee,
          shop: shopPayload,
          merchant: {
            id: shopPayload.id,
            business_name: shopPayload.name,
            slug: shopPayload.slug,
          },
        })
      }

      return results
    })

    const total = checkoutOrders.reduce((sum, o) => sum + o.amount, 0)
    const totalDiscount = checkoutOrders.reduce((sum, o) => sum + o.discount_amount, 0)
    const totalDelivery = checkoutOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
    const first = checkoutOrders[0]

    return {
      orders: checkoutOrders,
      total,
      total_discount: totalDiscount,
      total_delivery_fee: totalDelivery,
      currency: 'XOF',
      provider: 'SIMULATOR',
      instructions: 'Confirmez avec simulateResult success ou failure.',
      orderId: first.orderId,
      paymentId: first.paymentId,
      reference: first.reference,
      amount: total,
    }
  }

  private async checkoutFoodOrder(
    userId: string,
    dto: CheckoutDto,
    rawCart: Awaited<ReturnType<MarketplaceService['getOrCreateCart']>>,
    activeItems: typeof rawCart.items,
  ) {
    const isDelivery = dto.delivery_type === 'DELIVERY'

    if (isDelivery) {
      const hasStructured =
        dto.delivery_city_id?.trim() && dto.delivery_commune_id?.trim()
      const hasLegacy = dto.delivery_address?.trim()
      if (!hasStructured && !hasLegacy) {
        throw new BadRequestException('Adresse de livraison requise (ville, commune et quartier)')
      }
    }

    const cart = this.buildCartResponse(rawCart, activeItems)
    const groups = new Map<string, typeof cart.items>()
    const subtotals: Record<string, number> = {}

    for (const item of cart.items) {
      const mid = item.product.merchant.id
      const list = groups.get(mid) ?? []
      list.push(item)
      groups.set(mid, list)
      subtotals[mid] = (subtotals[mid] ?? 0) + item.line_total
    }

    let deliveryQuotes: Awaited<ReturnType<DeliveryZonesService['quote']>> | null = null
    let cityName: string | undefined
    let communeName: string | undefined

    if (isDelivery && dto.delivery_city_id && dto.delivery_commune_id) {
      const [city, commune] = await Promise.all([
        this.prisma.geoCity.findUnique({ where: { id: dto.delivery_city_id } }),
        this.prisma.geoCommune.findUnique({ where: { id: dto.delivery_commune_id } }),
      ])
      cityName = city?.name
      communeName = commune?.name

      deliveryQuotes = await this.deliveryZones.quote({
        merchant_ids: Array.from(groups.keys()),
        city_id: dto.delivery_city_id,
        commune_id: dto.delivery_commune_id,
        subtotals,
        order_flow: 'food',
      })

      const unavailable = deliveryQuotes.quotes.filter(q => !q.available)
      if (unavailable.length) {
        const names = unavailable.map(q => q.shop_name).join(', ')
        throw new BadRequestException(
          `Livraison indisponible pour : ${names}. ${unavailable[0].message ?? ''}`.trim(),
        )
      }
    }

    const deliveryAddress = isDelivery
      ? dto.delivery_address?.trim()
        || [dto.delivery_district, communeName, cityName, dto.delivery_address_detail]
          .filter(Boolean)
          .join(', ')
      : undefined

    const checkoutOrders = await this.prisma.$transaction(async tx => {
      const results: Array<{
        orderId: string
        paymentId: string
        reference: string
        amount: number
        subtotal: number
        discount_amount: number
        delivery_fee: number
        shop: { id: string; name: string; slug: string }
        merchant: { id: string; business_name: string; slug: string }
      }> = []

      for (const [merchantId, items] of groups) {
        const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
        const reference = generatePaymentReference()
        const merchantInfo = items[0].product.merchant

        let deliveryFee = 0
        if (isDelivery && deliveryQuotes) {
          const quote = deliveryQuotes.quotes.find(
            q => q.merchant_id === merchantId || q.shop_id === merchantId,
          )
          deliveryFee = quote?.fee ?? 0
        }

        const total = subtotal + deliveryFee

        const order = await tx.order.create({
          data: {
            user_id: userId,
            shop_id: null,
            merchant_id: merchantId,
            order_source: 'FOOD',
            status: 'PENDING',
            delivery_type: dto.delivery_type,
            delivery_address: deliveryAddress,
            delivery_city_id: dto.delivery_city_id,
            delivery_commune_id: dto.delivery_commune_id,
            delivery_district: dto.delivery_district,
            customer_note: dto.customer_note,
            customer_phone: dto.customer_phone,
            subtotal,
            discount_amount: 0,
            delivery_fee: deliveryFee,
            total,
            items: {
              create: items.map(item => ({
                menu_item_id: item.menu_item_id,
                product_id: null,
                variant_id: null,
                product_name: item.menu_item?.name ?? item.product.name,
                variant_name: item.modifiers_label ?? null,
                unit_price: item.unit_price,
                quantity: item.quantity,
                line_total: item.line_total,
                modifiers: (item.selected_modifiers ?? []) as unknown as Prisma.InputJsonValue,
              })),
            },
          },
        })

        const payment = await tx.paymentTransaction.create({
          data: {
            user_id: userId,
            shop_id: null,
            merchant_id: merchantId,
            purpose: 'ORDER',
            amount: total,
            reference,
            order_id: order.id,
            metadata: {
              simulator: true,
              order_id: order.id,
              order_source: 'FOOD',
              delivery_fee: deliveryFee,
            },
          },
        })

        const merchantPayload = {
          id: merchantInfo.id,
          business_name: merchantInfo.business_name,
          slug: merchantInfo.slug,
        }
        results.push({
          orderId: order.id,
          paymentId: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          subtotal,
          discount_amount: 0,
          delivery_fee: deliveryFee,
          shop: {
            id: merchantPayload.id,
            name: merchantPayload.business_name,
            slug: merchantPayload.slug,
          },
          merchant: merchantPayload,
        })
      }

      return results
    })

    const total = checkoutOrders.reduce((sum, o) => sum + o.amount, 0)
    const totalDelivery = checkoutOrders.reduce((sum, o) => sum + o.delivery_fee, 0)
    const first = checkoutOrders[0]

    return {
      orders: checkoutOrders,
      total,
      total_discount: 0,
      total_delivery_fee: totalDelivery,
      currency: 'XOF',
      provider: 'SIMULATOR',
      instructions: 'Confirmez avec simulateResult success ou failure.',
      orderId: first.orderId,
      paymentId: first.paymentId,
      reference: first.reference,
      amount: total,
    }
  }

  private async removeOrderItemsFromCart(
    userId: string,
    orderItems: Array<{
      product_id: string | null
      menu_item_id?: string | null
      variant_id: string | null
      modifiers?: unknown
    }>,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const cart = await tx.cart.findUnique({ where: { user_id: userId } })
    if (!cart) return

    for (const item of orderItems) {
      if (item.menu_item_id) {
        const orderSignature = modifiersSignature(parseSelectedModifiers(item.modifiers))
        const cartItems = await tx.cartItem.findMany({
          where: { cart_id: cart.id, menu_item_id: item.menu_item_id },
        })
        for (const cartItem of cartItems) {
          const cartSignature = modifiersSignature(parseSelectedModifiers(cartItem.selected_modifiers))
          if (cartSignature === orderSignature) {
            await tx.cartItem.delete({ where: { id: cartItem.id } })
          }
        }
        continue
      }
      if (!item.product_id) continue
      await tx.cartItem.deleteMany({
        where: {
          cart_id: cart.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
        },
      })
    }
  }

  private async decrementStockForOrderItem(
    item: { product_id: string | null; variant_id: string | null; quantity: number },
    tx: Prisma.TransactionClient,
  ) {
    if (!item.product_id) return

    if (item.variant_id) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } })
      if (!variant) return
      const newStock = Math.max(0, variant.stock_quantity - item.quantity)
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock_quantity: newStock },
      })
      await this.syncProductStockFromVariants(item.product_id, tx)
      return
    }

    const product = await tx.product.findUnique({ where: { id: item.product_id } })
    if (!product) return
    const newStock = Math.max(0, product.stock_quantity - item.quantity)
    await tx.product.update({
      where: { id: product.id },
      data: {
        stock_quantity: newStock,
        status: newStock === 0 ? 'OUT_OF_STOCK' : product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status,
      },
    })
  }

  async confirmOrderPayment(userId: string, dto: ConfirmOrderPaymentDto) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: dto.paymentId, user_id: userId, purpose: 'ORDER' },
      include: {
        order: {
          include: {
            items: true,
            merchant: { select: { business_name: true, owner_id: true } },
            shop: { select: { name: true, owner_id: true, slug: true } },
          },
        },
      },
    })
    if (!payment?.order) throw new NotFoundException('Paiement introuvable')
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Ce paiement a déjà été traité')
    }

    if (dto.simulateResult === 'failure') {
      await this.prisma.$transaction([
        this.prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        }),
        this.prisma.order.update({
          where: { id: payment.order!.id },
          data: { status: 'CANCELLED' },
        }),
      ])
      return { status: 'FAILED', message: 'Paiement refusé par le simulateur.' }
    }

    const order = payment.order
    const now = new Date()

    await this.prisma.$transaction(async tx => {
      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', paid_at: now },
      })
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      })

      for (const item of order.items) {
        await this.decrementStockForOrderItem(item, tx)
      }

      await this.removeOrderItemsFromCart(userId, order.items, tx)
    })

    const ownerId = this.resolveOrderOwnerId(order)
    if (ownerId) {
      await this.notificationQueue.enqueuePush({
        userId: ownerId,
        type: 'order_created',
        title: 'Nouvelle commande',
        body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
        data: { order_id: order.id, shop_id: order.shop_id, merchant_id: order.merchant_id },
      })
    }

    return {
      status: 'SUCCESS',
      orderId: order.id,
      message: 'Commande confirmée. Merci pour votre achat !',
    }
  }

  async confirmBatchOrderPayments(userId: string, dto: ConfirmBatchOrderPaymentDto) {
    const payments = await this.prisma.paymentTransaction.findMany({
      where: {
        id: { in: dto.paymentIds },
        user_id: userId,
        purpose: 'ORDER',
        status: 'PENDING',
      },
      include: {
        order: {
          include: {
            items: true,
            merchant: { select: { business_name: true, owner_id: true } },
            shop: { select: { name: true, owner_id: true, slug: true } },
          },
        },
      },
    })

    if (!payments.length) {
      throw new NotFoundException('Aucun paiement en attente trouvé')
    }

    if (dto.simulateResult === 'failure') {
      await this.prisma.$transaction(
        payments.flatMap(p => [
          this.prisma.paymentTransaction.update({
            where: { id: p.id },
            data: { status: 'FAILED' },
          }),
          this.prisma.order.update({
            where: { id: p.order!.id },
            data: { status: 'CANCELLED' },
          }),
        ]),
      )
      return {
        status: 'FAILED' as const,
        message: 'Paiements refusés par le simulateur.',
        orderIds: payments.map(p => p.order!.id),
      }
    }

    const now = new Date()
    const orderIds: string[] = []

    await this.prisma.$transaction(async tx => {
      for (const payment of payments) {
        const order = payment.order!
        orderIds.push(order.id)

        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', paid_at: now },
        })
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED' },
        })

        for (const item of order.items) {
          await this.decrementStockForOrderItem(item, tx)
        }

        await this.removeOrderItemsFromCart(userId, order.items, tx)
      }
    })

    for (const payment of payments) {
      const order = payment.order!
      const ownerId = this.resolveOrderOwnerId(order)
      if (!ownerId) continue
      await this.notificationQueue.enqueuePush({
        userId: ownerId,
        type: 'order_created',
        title: 'Nouvelle commande',
        body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
        data: { order_id: order.id, shop_id: order.shop_id, merchant_id: order.merchant_id },
      })
    }

    return {
      status: 'SUCCESS' as const,
      orderIds,
      message:
        orderIds.length > 1
          ? `${orderIds.length} commandes confirmées. Merci pour vos achats !`
          : 'Commande confirmée. Merci pour votre achat !',
    }
  }

  async resumePendingPayments(userId: string, orderIds: string[]) {
    if (!orderIds.length) {
      throw new BadRequestException('Au moins une commande est requise')
    }

    const uniqueIds = [...new Set(orderIds)]
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: uniqueIds },
        user_id: userId,
        status: 'PENDING',
      },
      include: {
        items: true,
        shop: { select: { id: true, name: true, slug: true } },
        merchant: { select: { id: true, business_name: true, slug: true } },
        payment: true,
      },
      orderBy: { created_at: 'asc' },
    })

    if (orders.length !== uniqueIds.length) {
      throw new BadRequestException('Commande(s) introuvable(s) ou déjà traitée(s)')
    }

    if (orders.some(o => !o.payment || o.payment.status !== 'PENDING')) {
      throw new BadRequestException('Paiement déjà traité ou expiré')
    }

    const checkoutOrders = orders.map(o => ({
      orderId: o.id,
      paymentId: o.payment!.id,
      reference: o.payment!.reference,
      amount: o.total,
      merchant: this.resolveOrderMerchantMeta(o),
    }))

    const total = orders.reduce((sum, o) => sum + o.total, 0)
    const totalDiscount = orders.reduce((sum, o) => sum + o.discount_amount, 0)
    const totalDelivery = orders.reduce((sum, o) => sum + o.delivery_fee, 0)
    const first = orders[0]

    const items = orders.flatMap(o => {
      const merchantMeta = this.resolveOrderMerchantMeta(o)
      return o.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        variant_id: item.variant_id,
        variant: item.variant_name ? { name: item.variant_name } : null,
        product: {
          id: item.product_id ?? item.menu_item_id ?? item.id,
          name: item.product_name,
          slug: '',
          image_url: null,
          shop_id: o.shop_id,
          merchant: merchantMeta,
        },
      }))
    })

    return {
      checkoutResult: {
        orders: checkoutOrders,
        total,
        total_discount: totalDiscount,
        total_delivery_fee: totalDelivery,
        currency: first.currency,
        provider: 'SIMULATOR',
        instructions: 'Confirmez avec simulateResult success ou failure.',
        orderId: checkoutOrders[0].orderId,
        paymentId: checkoutOrders[0].paymentId,
        reference: checkoutOrders[0].reference,
        amount: total,
      },
      cartSnapshot: {
        items,
        subtotal: orders.reduce((sum, o) => sum + o.subtotal, 0),
        currency: first.currency,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0),
        merchant_count: orders.length,
        merchants: orders.map(o => {
          const merchantMeta = this.resolveOrderMerchantMeta(o)
          return {
            id: merchantMeta.id,
            business_name: merchantMeta.business_name,
            slug: merchantMeta.slug,
            subtotal: o.subtotal,
            item_count: o.items.reduce((sum, i) => sum + i.quantity, 0),
          }
        }),
        merchant: null,
      },
      deliveryType: first.delivery_type,
      deliveryAddress: first.delivery_address ?? undefined,
      customerPhone: first.customer_phone ?? undefined,
      customerNote: first.customer_note ?? undefined,
      discountAmount: totalDiscount,
      deliveryFee: totalDelivery,
    }
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
        shop: { select: { name: true, slug: true, logo: true } },
        merchant: { select: { business_name: true, slug: true, logo: true } },
        payment: { select: { id: true, status: true, reference: true, paid_at: true } },
      },
      take: 50,
    })
  }

  async getMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        items: true,
        shop: { select: { name: true, slug: true, phone: true, whatsapp: true } },
        merchant: { select: { business_name: true, slug: true, phone: true, whatsapp: true, logo: true } },
        payment: { select: { id: true, status: true, reference: true, paid_at: true } },
        delivery_job: {
          select: {
            id: true,
            status: true,
            tracking_token: true,
            eta_minutes: true,
            assigned_at: true,
            picked_up_at: true,
            delivered_at: true,
            courier: { select: { full_name: true, phone: true, vehicle: true } },
          },
        },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    return order
  }

  async getMerchantOrder(userId: string, orderId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...this.merchantOrderScope(shop) },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                image_url: true,
              },
            },
            menu_item: {
              select: { id: true, image_url: true },
            },
          },
        },
        shop: { select: { name: true, slug: true, phone: true, whatsapp: true } },
        merchant: { select: { business_name: true, slug: true, phone: true, whatsapp: true, logo: true } },
        user: { select: { id: true, full_name: true, email: true, phone: true } },
        payment: { select: { id: true, status: true, reference: true, paid_at: true } },
        promotion: { select: { title: true, code: true } },
        delivery_job: {
          select: {
            id: true,
            status: true,
            tracking_token: true,
            eta_minutes: true,
            assigned_at: true,
            picked_up_at: true,
            delivered_at: true,
            courier: { select: { id: true, full_name: true, phone: true, vehicle: true } },
          },
        },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')

    const [delivery_city, delivery_commune] = await Promise.all([
      order.delivery_city_id
        ? this.prisma.geoCity.findUnique({
            where: { id: order.delivery_city_id },
            select: { id: true, name: true },
          })
        : null,
      order.delivery_commune_id
        ? this.prisma.geoCommune.findUnique({
            where: { id: order.delivery_commune_id },
            select: { id: true, name: true },
          })
        : null,
    ])

    return { ...order, delivery_city, delivery_commune }
  }

  async listMerchantOrders(userId: string, shopId?: string, status?: OrderStatus) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    return this.prisma.order.findMany({
      where: {
        ...this.merchantOrderScope(shop),
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
        user: { select: { full_name: true, email: true, phone: true } },
        payment: { select: { status: true, reference: true } },
      },
      take: 100,
    })
  }

  async updateOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...this.merchantOrderScope(shop) },
      include: { user: { select: { id: true } } },
    })
    if (!order) throw new NotFoundException('Commande introuvable')

    const allowed: Record<string, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PENDING', 'PREPARING', 'CANCELLED', 'REFUNDED'],
      PREPARING: ['CONFIRMED', 'READY', 'CANCELLED', 'REFUNDED'],
      READY: ['PREPARING', 'COMPLETED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['READY', 'DELIVERED', 'COMPLETED'],
      DELIVERED: ['OUT_FOR_DELIVERY', 'COMPLETED'],
      COMPLETED: ['READY', 'REFUNDED'],
      CANCELLED: ['PENDING'],
      REFUNDED: [],
    }
    if (!allowed[order.status]?.includes(dto.status)) {
      throw new BadRequestException(`Transition ${order.status} → ${dto.status} non autorisée`)
    }

    if (dto.status === 'OUT_FOR_DELIVERY' && order.delivery_type === 'DELIVERY') {
      await this.deliveryService.createJobForOrder(orderId)
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
    })

    await this.notificationQueue.enqueuePush({
      userId: order.user.id,
      type: 'order_status',
      title: 'Mise à jour commande',
      body: `Votre commande est maintenant : ${dto.status}`,
      data: { order_id: order.id, status: dto.status },
    })

    return updated
  }

  async getFeaturedProducts(limit = 8) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock_quantity: { gt: 0 },
        shop: {
          is_active: true,
          status: 'ACTIVE',
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        image_url: true,
        shop: { select: { name: true, slug: true } },
      },
    }).then(rows =>
      rows.map(row => ({
        ...row,
        merchant: {
          business_name: row.shop.name,
          slug: row.shop.slug,
        },
      })),
    )
  }

  async listMarketplaceProducts(query?: {
    q?: string
    merchant?: string
    shop?: string
    category?: string
    sort?: string
    maxPrice?: number
    country?: string
  }) {
    const countryCode = query?.country?.trim().toUpperCase()
    if (query?.q?.trim()) {
      const meili = await this.searchService.searchProducts({
        q: query.q.trim(),
        category: query?.category,
        shop: query?.shop ?? query?.merchant,
        country: countryCode,
        sort:
          query?.sort === 'price_asc'
            ? 'price_asc'
            : query?.sort === 'price_desc'
              ? 'price_desc'
              : 'newest',
        maxPrice: query?.maxPrice,
        limit: 100,
      })
      if (meili) return meili.data
    }

    const orderBy =
      query?.sort === 'price_asc'
        ? { price: 'asc' as const }
        : query?.sort === 'price_desc'
          ? { price: 'desc' as const }
          : { created_at: 'desc' as const }

    let categoryId: string | undefined
    if (query?.category?.trim()) {
      const cat = await this.prisma.productCategory.findFirst({
        where: { slug: query.category.trim(), is_active: true },
        select: { id: true },
      })
      categoryId = cat?.id
      if (!categoryId) return []
    }

    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock_quantity: { gt: 0 },
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(query?.maxPrice != null && query.maxPrice > 0
          ? { price: { lte: query.maxPrice } }
          : {}),
        ...(query?.q
          ? { name: { contains: query.q, mode: 'insensitive' as const } }
          : {}),
        shop: {
          is_active: true,
          status: 'ACTIVE',
          ...(countryCode ? { country: countryCode } : {}),
          ...(query?.merchant || query?.shop
            ? { slug: query.shop ?? query.merchant }
            : {}),
        },
      },
      orderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        image_url: true,
        created_at: true,
        category: { select: { id: true, name: true, slug: true } },
        shop: { select: { name: true, slug: true, logo: true } },
      },
    }).then(rows =>
      rows.map(row => ({
        ...row,
        merchant: {
          business_name: row.shop.name,
          slug: row.shop.slug,
          logo: row.shop.logo,
        },
      })),
    )
  }

  async listMarketplaceMerchants(limit = 20) {
    return this.listMarketplaceShops(limit)
  }

  async getMarketplaceSpotlightLimit(): Promise<number> {
    const row = await this.prisma.platformSetting.findUnique({
      where: { key: 'marketplace_spotlight_limit' },
    })
    const parsed = Number(row?.value ?? 8)
    if (!Number.isFinite(parsed) || parsed < 1) return 8
    return Math.min(Math.floor(parsed), 20)
  }

  async setMarketplaceSpotlightLimit(limit: number) {
    const value = Math.min(Math.max(Math.floor(limit), 1), 20)
    await this.prisma.platformSetting.upsert({
      where: { key: 'marketplace_spotlight_limit' },
      create: { key: 'marketplace_spotlight_limit', value: String(value) },
      update: { value: String(value) },
    })
    return { marketplace_spotlight_limit: value }
  }

  async listMarketplaceSpotlight(requestedLimit?: number) {
    const cap = requestedLimit
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 20)
      : await this.getMarketplaceSpotlightLimit()

    const now = new Date()

    const [shops, marketplaceCampaigns] = await Promise.all([
      this.prisma.shop.findMany({
        where: {
          is_active: true,
          status: 'ACTIVE',
          products: { some: { status: 'ACTIVE', stock_quantity: { gt: 0 } } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          marketplace_featured: true,
          merchant: {
            select: { id: true, is_sponsored: true },
          },
        },
      }),
      this.prisma.adCampaign.findMany({
        where: {
          placement: 'MARKETPLACE',
          status: 'ACTIVE',
          starts_at: { lte: now },
          ends_at: { gte: now },
        },
        select: { merchant_id: true },
      }),
    ])

    const sponsoredMerchantIds = new Set(marketplaceCampaigns.map(c => c.merchant_id))

    const ranked = shops
      .map(shop => {
        const merchantId = shop.merchant?.id
        const hasMarketplaceAd = merchantId ? sponsoredMerchantIds.has(merchantId) : false
        const isAdminFeatured = shop.marketplace_featured
        const isMerchantSponsored = shop.merchant?.is_sponsored ?? false

        if (!isAdminFeatured && !hasMarketplaceAd && !isMerchantSponsored) return null

        const priority =
          (isAdminFeatured ? 300 : 0) +
          (hasMarketplaceAd ? 200 : 0) +
          (isMerchantSponsored ? 100 : 0)

        return {
          id: shop.id,
          business_name: shop.name,
          slug: shop.slug,
          logo: shop.logo,
          is_sponsored: hasMarketplaceAd || isMerchantSponsored,
          is_admin_featured: isAdminFeatured,
          priority,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.priority - a.priority || a.business_name.localeCompare(b.business_name, 'fr'))

    return ranked.slice(0, cap)
  }

  async setShopMarketplaceFeatured(shopId: string, featured: boolean) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Boutique introuvable')

    if (featured) {
      const limit = await this.getMarketplaceSpotlightLimit()
      const current = await this.prisma.shop.count({
        where: { marketplace_featured: true, id: { not: shopId } },
      })
      if (current >= limit) {
        throw new BadRequestException(
          `Maximum ${limit} boutique(s) en avant sur la marketplace. Retirez une sélection admin ou augmentez la limite.`,
        )
      }
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: { marketplace_featured: featured },
      select: { id: true, name: true, slug: true, marketplace_featured: true },
    })
  }

  async listMarketplaceShops(limit = 20) {
    return this.prisma.shop.findMany({
      where: {
        is_active: true,
        status: 'ACTIVE',
        products: { some: { status: 'ACTIVE', stock_quantity: { gt: 0 } } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    }).then(rows =>
      rows.map(row => ({
        id: row.id,
        business_name: row.name,
        slug: row.slug,
        logo: row.logo,
      })),
    )
  }

  /** Upsert produits démo pour les boutiques (seed idempotent). */
  async seedDemoProducts() {
    const catalog: Array<{
      merchantSlug: string
      products: Array<{
        name: string
        slug: string
        price: number
        stock: number
        image: string
        desc: string
        variants?: Array<{ name: string; price: number; stock: number }>
      }>
    }> = [
      {
        merchantSlug: 'yale-design',
        products: [
          {
            name: 'Robe Wax Élégance',
            slug: 'robe-wax-elegance',
            price: 42000,
            stock: 12,
            image: 'https://images.unsplash.com/photo-1594633312681-425a7b9569e2?auto=format&fit=crop&q=80&w=800',
            desc: 'Robe en wax premium, coupe moderne.',
            variants: [
              { name: 'Taille S', price: 42000, stock: 4 },
              { name: 'Taille M', price: 45000, stock: 5 },
              { name: 'Taille L', price: 48000, stock: 3 },
            ],
          },
          { name: 'Sac Tissé Main', slug: 'sac-tisse-main', price: 28000, stock: 8, image: 'https://images.unsplash.com/photo-1590875127128-5de792a5c2a8?auto=format&fit=crop&q=80&w=800', desc: 'Sac artisanal tissé à la main.' },
          { name: 'Boubou Homme Premium', slug: 'boubou-homme-premium', price: 65000, stock: 5, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800', desc: 'Boubou brodé, finitions soignées.' },
        ],
      },
      {
        merchantSlug: 'galerie-korhogo',
        products: [
          { name: 'Masque Senoufo', slug: 'masque-senoufo', price: 85000, stock: 3, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', desc: 'Masque traditionnel authentique.' },
          {
            name: 'Tissu Kita',
            slug: 'tissu-kita',
            price: 22000,
            stock: 15,
            image: 'https://images.unsplash.com/photo-1558171818-61854a5d1d4f?auto=format&fit=crop&q=80&w=800',
            desc: 'Tissu Kita, motifs géométriques.',
            variants: [
              { name: '3 yards', price: 22000, stock: 8 },
              { name: '6 yards', price: 35000, stock: 7 },
            ],
          },
          { name: 'Bronze Baoulé', slug: 'bronze-baoule', price: 120000, stock: 2, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40f68d55?auto=format&fit=crop&q=80&w=800', desc: 'Sculpture bronze signée artiste local.' },
        ],
      },
    ]

    let count = 0
    const skipped: string[] = []
    for (const group of catalog) {
      const shop = await this.prisma.shop.findFirst({
        where: {
          OR: [
            { slug: group.merchantSlug },
            { merchant: { slug: group.merchantSlug } },
          ],
        },
        select: { id: true, slug: true },
      })
      if (!shop) {
        skipped.push(group.merchantSlug)
        continue
      }
      for (const p of group.products) {
        const hasVariants = (p.variants?.length ?? 0) > 0
        const stock = hasVariants
          ? p.variants!.reduce((sum, v) => sum + v.stock, 0)
          : p.stock
        const price = hasVariants ? Math.min(...p.variants!.map(v => v.price)) : p.price

        const product = await this.prisma.product.upsert({
          where: { shop_id_slug: { shop_id: shop.id, slug: p.slug } },
          update: {
            name: p.name,
            price,
            stock_quantity: stock,
            image_url: p.image,
            description: p.desc,
            status: 'ACTIVE',
          },
          create: {
            shop_id: shop.id,
            name: p.name,
            slug: p.slug,
            price,
            stock_quantity: stock,
            image_url: p.image,
            description: p.desc,
            status: 'ACTIVE',
          },
        })

        if (hasVariants) {
          await this.prisma.productVariant.deleteMany({ where: { product_id: product.id } })
          await this.prisma.productVariant.createMany({
            data: p.variants!.map((v, index) => ({
              product_id: product.id,
              name: v.name,
              price: v.price,
              stock_quantity: v.stock,
              sort_order: index,
            })),
          })
        }

        count++
      }
    }
    return { created_or_updated: count, skipped_merchants: skipped }
  }
}
