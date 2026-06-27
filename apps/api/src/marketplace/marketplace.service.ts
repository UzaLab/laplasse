import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { shopAccessibleWhere } from '../shops/shop-access.util'
import { NotificationQueueService } from '../queue/notification-queue.service'
import {
  merchantOrderNotificationData,
} from '../notifications/notification-links'
import { AdminNotificationsService } from '../notifications/admin-notifications.service'
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
import type { DeliveryQuoteItem } from '../delivery-zones/delivery-zones.service'
import { PromotionsService } from '../promotions/promotions.service'
import { SearchService } from '../search/search.service'
import { ShopCollectionsService } from '../shop-collections/shop-collections.service'
import { DeliveryService } from '../delivery/delivery.service'
import { DeliveryEtaService } from '../delivery/delivery-eta.service'
import { orderStatusLabelFr } from '../common/order-status-labels'
import { buildOrderStatusPushMessage } from '../common/order-push-messages'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { CourierReviewsService } from '../couriers/courier-reviews.service'
import { DeliveryProofService } from '../delivery/delivery-proof.service'
import { DeliveryDisputesService } from '../delivery/delivery-disputes.service'
import { CreateDeliveryDisputeDto } from '../delivery/dto/create-delivery-dispute.dto'
import { AuthService } from '../auth/auth.service'
import { AdsService } from '../ads/ads.service'
import {
  GuestCartItemDto,
  GuestCheckoutDto,
} from './dto/marketplace.dto'

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
    private readonly deliveryEta: DeliveryEtaService,
    private readonly loyalty: LoyaltyService,
    private readonly courierReviews: CourierReviewsService,
    private readonly deliveryProof: DeliveryProofService,
    private readonly deliveryDisputes: DeliveryDisputesService,
    private readonly authService: AuthService,
    private readonly ads: AdsService,
    private readonly adminNotifications: AdminNotificationsService,
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

  private readonly orderItemDetailInclude = {
    product: {
      select: {
        id: true,
        slug: true,
        image_url: true,
        images: { select: { url: true }, orderBy: { sort_order: 'asc' as const } },
      },
    },
    menu_item: { select: { id: true, image_url: true } },
    variant: { select: { id: true, image_url: true } },
  } as const

  private resolveOrderItemImageFromRelations<
    T extends {
      menu_item_id?: string | null
      variant_id?: string | null
      variant?: { image_url: string | null } | null
      product?: { image_url: string | null; images?: { url: string }[] } | null
      menu_item?: { image_url: string | null } | null
    },
  >(item: T): string | null {
    if (item.menu_item_id && item.menu_item?.image_url?.trim()) {
      return item.menu_item.image_url.trim()
    }
    if (item.variant_id && item.variant?.image_url?.trim()) {
      return item.variant.image_url.trim()
    }
    if (item.product?.image_url?.trim()) {
      return item.product.image_url.trim()
    }
    const galleryUrl = item.product?.images?.[0]?.url?.trim()
    if (galleryUrl) return galleryUrl
    if (item.menu_item?.image_url?.trim()) {
      return item.menu_item.image_url.trim()
    }
    return null
  }

  private async resolveCartLineImageUrl(
    item: ReturnType<MarketplaceService['mapRawCartItem']>,
  ): Promise<string | null> {
    if (item.line_kind === 'menu') {
      return item.menu_item?.image_url?.trim() ?? item.product.image_url?.trim() ?? null
    }
    if (item.variant_id) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variant_id },
        select: { image_url: true },
      })
      if (variant?.image_url?.trim()) return variant.image_url.trim()
    }
    return item.product.image_url?.trim() ?? null
  }

  private mapOrderItemWithImage<
    T extends {
      image_url?: string | null
      menu_item_id?: string | null
      variant_id?: string | null
      variant?: { image_url: string | null } | null
      product?: ({ image_url: string | null; images?: { url: string }[] } & Record<string, unknown>) | null
      menu_item?: { image_url: string | null } | null
    },
  >(item: T) {
    const image_url =
      item.image_url?.trim()
      || this.resolveOrderItemImageFromRelations(item)
    const product = item.product
      ? (() => {
          const { images: _images, ...rest } = item.product!
          return {
            ...rest,
            image_url: rest.image_url ?? item.product!.images?.[0]?.url ?? null,
          }
        })()
      : null
    return { ...item, product, image_url }
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

  /** Produits catalogue marketplace réellement ajoutables au panier (hors miroirs menu). */
  private marketplaceCartProductWhere(
    extra: Prisma.ProductWhereInput = {},
  ): Prisma.ProductWhereInput {
    return {
      status: 'ACTIVE',
      slug: { not: { startsWith: MENU_MIRROR_SLUG_PREFIX } },
      OR: [
        { variants: { none: {} }, stock_quantity: { gt: 0 } },
        { variants: { some: { stock_quantity: { gt: 0 }, is_disabled: false } } },
      ],
      shop: { is_active: true, status: 'ACTIVE' },
      ...extra,
    }
  }

  private marketplaceCatalogSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      price: true,
      currency: true,
      image_url: true,
      created_at: true,
      category: { select: { id: true, name: true, slug: true } },
      shop: { select: { name: true, slug: true, logo: true, merchant_id: true } },
      variants: {
        where: { stock_quantity: { gt: 0 }, is_disabled: false },
        orderBy: { created_at: 'asc' as const },
        select: { id: true, stock_quantity: true },
      },
      _count: { select: { variants: true } },
    }
  }

  private mapCatalogProductRow(
    row: {
      id: string
      name: string
      slug: string
      price: number
      currency: string
      image_url: string | null
      created_at?: Date
      category?: { id: string; name: string; slug: string } | null
      shop: { name: string; slug: string; logo?: string | null; merchant_id: string | null }
      variants: { id: string; stock_quantity: number }[]
      _count: { variants: number }
    },
    extras?: { is_sponsored?: boolean; ad_campaign_id?: string | null },
  ) {
    const inStockVariants = row.variants
    const hasVariants = row._count.variants > 0
    const canQuickAdd = !hasVariants || inStockVariants.length === 1
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      currency: row.currency,
      image_url: row.image_url,
      merchant_id: row.shop.merchant_id ?? undefined,
      ...(row.created_at ? { created_at: row.created_at.toISOString() } : {}),
      ...(row.category ? { category: row.category } : {}),
      merchant: {
        business_name: row.shop.name,
        slug: row.shop.slug,
        logo: row.shop.logo ?? null,
      },
      has_variants: hasVariants,
      can_quick_add: canQuickAdd,
      default_variant_id: inStockVariants.length === 1 ? inStockVariants[0].id : null,
      ...extras,
    }
  }

  private async enrichMeiliCatalogProducts(
    hits: Array<{ id: string; slug: string; _formatted?: Record<string, string> }>,
  ) {
    const visible = hits.filter(h => !isMenuMirrorProductSlug(h.slug))
    if (!visible.length) return []

    const rows = await this.prisma.product.findMany({
      where: {
        id: { in: visible.map(h => h.id) },
        ...this.marketplaceCartProductWhere(),
      },
      select: this.marketplaceCatalogSelect(),
    })
    const byId = new Map(rows.map(r => [r.id, r]))

    const mapped = visible.flatMap(hit => {
      const row = byId.get(hit.id)
      if (!row) return []
      return [{
        ...this.mapCatalogProductRow(row),
        ...(hit._formatted ? { _formatted: hit._formatted } : {}),
      }]
    })
    return this.promotionsService.enrichProductsWithPromotions(mapped)
  }

  /** Résout la variante panier — auto-sélection si une seule variante en stock (quick-add marketplace). */
  private resolveCartVariant<
    T extends { id: string; stock_quantity: number },
  >(
    product: { variants: T[] },
    variantId?: string,
  ): T | null {
    const variants = product.variants ?? []
    if (variants.length === 0) {
      if (variantId) {
        throw new BadRequestException('Ce produit n\'a pas de variantes')
      }
      return null
    }

    if (variantId) {
      const variant = variants.find(v => v.id === variantId) ?? null
      if (!variant) throw new BadRequestException('Variante introuvable')
      return variant
    }

    const inStock = variants.filter(v => v.stock_quantity > 0)
    if (inStock.length === 0) {
      throw new BadRequestException('Produit indisponible')
    }
    if (inStock.length > 1) {
      throw new BadRequestException('Sélectionnez une variante pour ce produit')
    }
    return inStock[0]
  }

  private assertDeliveryModes(allowPickup?: boolean, allowDelivery?: boolean) {
    const pickup = allowPickup ?? true
    const delivery = allowDelivery ?? true
    if (!pickup && !delivery) {
      throw new BadRequestException('Activez au moins un mode de livraison (retrait ou livraison)')
    }
  }

  private assertPublishRequirements(opts: {
    name: string
    price: number
    imageUrls: string[]
    hasVariants: boolean
    variants?: { price: number }[] | null
    description?: string | null
    short_description?: string | null
  }) {
    if (opts.name.trim().length < 5) {
      throw new BadRequestException('Le nom du produit doit contenir au moins 5 caractères')
    }
    // Anti-spam : pas de numéro de téléphone dans le nom
    if (/\b(?:0[1-9]|[1-9]\d)\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\b/.test(opts.name)) {
      throw new BadRequestException('Le nom du produit ne doit pas contenir de numéro de téléphone')
    }
    const effectivePrice = opts.hasVariants && opts.variants?.length
      ? Math.min(...opts.variants.map(v => v.price))
      : opts.price
    if (effectivePrice <= 0) {
      throw new BadRequestException('Le prix doit être supérieur à 0 pour publier un produit')
    }
    if (effectivePrice < 100) {
      throw new BadRequestException('Le prix minimum de publication est 100 XOF')
    }
    if (opts.imageUrls.length === 0) {
      throw new BadRequestException('Au moins une image est requise pour publier un produit')
    }
    // Sanitize HTML descriptions — rejeter les balises interdites
    const forbiddenTagPattern = /<\s*(script|iframe|object|embed|form|input|button|a\s|link\s)[^>]*>/i
    for (const field of [opts.description, opts.short_description]) {
      if (field && forbiddenTagPattern.test(field)) {
        throw new BadRequestException('La description contient des balises HTML non autorisées')
      }
    }
  }

  /**
   * Sanitize les champs HTML pour supprimer les éléments dangereux
   * tout en conservant la mise en forme basique (p, ul, li, strong, em).
   */
  private sanitizeHtml(html?: string | null): string | undefined {
    if (!html) return html === null ? undefined : undefined
    return html
      .replace(/<\s*(script|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<\s*\/?(script|iframe|object|embed|form|input|button)[^>]*>/gi, '')
      .replace(/<\s*a\s[^>]*href\s*=\s*["'](?!https?:\/\/laplasse)[^"']*["'][^>]*>/gi, '<span>')
      .replace(/<\s*\/a\s*>/gi, '</span>')
      .trim() || undefined
  }

  private async syncAttributeValues(
    productId: string,
    values: { attribute_id: string; value: string }[],
  ) {
    if (!values.length) {
      await this.prisma.productAttributeValue.deleteMany({ where: { product_id: productId } })
      return
    }
    await this.prisma.$transaction(
      values.map(v =>
        this.prisma.productAttributeValue.upsert({
          where: { product_id_attribute_id: { product_id: productId, attribute_id: v.attribute_id } },
          update: { value: v.value.trim() },
          create: { product_id: productId, attribute_id: v.attribute_id, value: v.value.trim() },
        }),
      ),
    )
    // Remove values not in the new list
    const incoming = values.map(v => v.attribute_id)
    await this.prisma.productAttributeValue.deleteMany({
      where: { product_id: productId, attribute_id: { notIn: incoming } },
    })
  }

  private normalizeSpecifications(
    specs?: { label?: string; value?: string }[] | null,
  ): { label: string; value: string }[] | undefined {
    if (specs == null) return specs === null ? [] : undefined
    return specs
      .map(s => ({ label: s.label?.trim() ?? '', value: s.value?.trim() ?? '' }))
      .filter(s => s.label && s.value)
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

  private shopOrderScope(shopId: string) {
    return { shop_id: shopId }
  }

  private foodOrderScope(merchantId: string) {
    return { merchant_id: merchantId, order_source: 'FOOD' as const }
  }

  /** Résout le périmètre commandes : boutique (produits) ou établissement (menu), jamais les deux. */
  private async resolveOrderContext(
    userId: string,
    scope?: { shopId?: string; merchantId?: string },
  ) {
    const shopSelect = {
      id: true,
      merchant_id: true,
      owner_id: true,
      name: true,
      delivery_fulfilment_default: true,
    } as const

    if (scope?.shopId) {
      const shop = await this.prisma.shop.findFirst({
        where: shopAccessibleWhere(userId, scope.shopId),
        select: shopSelect,
      })
      if (!shop) {
        throw new NotFoundException('Boutique introuvable')
      }
      return {
        scope: this.shopOrderScope(shop.id),
        shop,
        merchantId: shop.merchant_id,
      }
    }

    if (scope?.merchantId) {
      const merchant = await this.prisma.merchant.findFirst({
        where: { id: scope.merchantId, owner_id: userId },
        select: { id: true, owner_id: true, delivery_fulfilment_default: true },
      })
      if (!merchant) {
        throw new NotFoundException('Établissement introuvable')
      }

      const linkedShop = await this.prisma.shop.findFirst({
        where: { merchant_id: merchant.id, ...shopAccessibleWhere(userId) },
        select: shopSelect,
      })

      return {
        scope: this.foodOrderScope(merchant.id),
        shop: linkedShop,
        merchantId: merchant.id,
      }
    }

    const shop = await this.prisma.shop.findFirst({
      where: shopAccessibleWhere(userId),
      orderBy: { created_at: 'asc' },
      select: shopSelect,
    })
    if (shop) {
      return {
        scope: this.shopOrderScope(shop.id),
        shop,
        merchantId: shop.merchant_id,
      }
    }

    const merchant = await this.prisma.merchant.findFirst({
      where: { owner_id: userId },
      select: { id: true, owner_id: true, delivery_fulfilment_default: true },
    })
    if (!merchant) {
      throw new NotFoundException('Aucune boutique ou établissement trouvé')
    }

    return {
      scope: this.foodOrderScope(merchant.id),
      shop: null,
      merchantId: merchant.id,
    }
  }

  private async resolveShopBySlug(slug: string) {
    return this.shopsService.getByMerchantSlug(slug)
  }

  private async enrichShopCatalogProducts<T extends { id: string; price: number; category_id?: string | null }>(
    products: T[],
    shop: { id: string; merchant_id: string | null },
  ) {
    if (!products.length || !shop.merchant_id) return products
    return this.promotionsService.enrichProductsWithPromotions(
      products.map(p => ({ ...p, shop_id: shop.id })),
      shop.id,
      shop.merchant_id,
    )
  }

  private async getShopProductSalesCounts(shopId: string): Promise<Map<string, number>> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        product_id: { not: null },
        order: {
          shop_id: shopId,
          status: { in: ['COMPLETED', 'DELIVERED'] },
        },
      },
      select: { product_id: true, quantity: true },
    })

    const map = new Map<string, number>()
    for (const item of items) {
      if (!item.product_id) continue
      map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity)
    }
    return map
  }

  private pickBestSellerProductIds(salesMap: Map<string, number>, limit = 3): Set<string> {
    return new Set(
      [...salesMap.entries()]
        .filter(([, qty]) => qty > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id),
    )
  }

  private async attachProductCatalogMeta<
    T extends { id: string; created_at?: Date | string | null },
  >(products: T[], shopId: string) {
    if (!products.length) return []

    const salesMap = await this.getShopProductSalesCounts(shopId)
    const bestSellerIds = this.pickBestSellerProductIds(salesMap)

    return products.map(product => {
      const createdAt =
        product.created_at instanceof Date
          ? product.created_at.toISOString()
          : product.created_at ?? null
      const salesCount = salesMap.get(product.id) ?? 0

      return {
        ...product,
        created_at: createdAt,
        sales_count: salesCount,
        is_best_seller: bestSellerIds.has(product.id),
      }
    })
  }

  private readonly publicVariantSelect = {
    id: true,
    name: true,
    kind: true,
    color_hex: true,
    image_url: true,
    price: true,
    stock_quantity: true,
    sku: true,
    is_disabled: true,
  } as const

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
      let products = await this.fetchPublicProductsByIds(shop, productIds, { enrich: false })

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

      return this.attachProductCatalogMeta(
        await this.enrichShopCatalogProducts(products, shop),
        shop.id,
      )
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
        return this.fetchPublicProductsByIds(shop, ids)
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
        created_at: true,
        category_id: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: this.publicVariantSelect,
        },
      },
    })
    const filtered = products.filter(
      p => p.stock_quantity > 0 || p.variants.some(v => v.stock_quantity > 0),
    )
    return this.attachProductCatalogMeta(
      await this.enrichShopCatalogProducts(filtered, shop),
      shop.id,
    )
  }

  private async fetchPublicProductsByIds(
    shop: { id: string; merchant_id: string | null },
    ids: string[],
    options?: { enrich?: boolean },
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        shop_id: shop.id,
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
        created_at: true,
        category_id: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: this.publicVariantSelect,
        },
      },
    })
    const order = new Map(ids.map((id, index) => [id, index]))
    const filtered = products
      .filter(p => p.stock_quantity > 0 || p.variants.some(v => v.stock_quantity > 0))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    if (options?.enrich === false) return filtered
    return this.attachProductCatalogMeta(
      await this.enrichShopCatalogProducts(filtered, shop),
      shop.id,
    )
  }

  async listPublicShopProductCategories(shopSlug: string) {
    const shop = await this.resolveShopBySlug(shopSlug)
    const enabledIds = await this.shopsService.getEnabledProductCategoryIds(shop.id)

    const productRows = await this.prisma.product.findMany({
      where: {
        shop_id: shop.id,
        status: 'ACTIVE',
        category_id: { not: null },
        slug: { not: { startsWith: MENU_MIRROR_SLUG_PREFIX } },
      },
      select: { category_id: true },
      distinct: ['category_id'],
    })

    const productCategoryIds = productRows
      .map(row => row.category_id)
      .filter((id): id is string => id != null)

    let categoryIds = enabledIds.length > 0
      ? enabledIds.filter(id => productCategoryIds.includes(id))
      : productCategoryIds

    if (!categoryIds.length && productCategoryIds.length) {
      categoryIds = productCategoryIds
    }

    if (!categoryIds.length) return []

    return this.prisma.productCategory.findMany({
      where: { id: { in: categoryIds }, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        parent_id: true,
        sort_order: true,
      },
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
          select: this.publicVariantSelect,
        },
        category: { select: { id: true, name: true, slug: true, legal_notice: true } },
        attribute_values: {
          include: {
            attribute: {
              select: { id: true, label: true, key: true, attribute_type: true, unit: true },
            },
          },
        },
        ...this.productImagesInclude,
      },
    })
    if (!product) {
      // Vérifier si le produit existe mais est archivé — pour rediriger le frontend
      const archived = await this.prisma.product.findFirst({
        where: { shop_id: shop.id, slug: productSlug, status: 'ARCHIVED' },
        select: { id: true },
      })
      if (archived) {
        throw new NotFoundException('ARCHIVED')
      }
      throw new NotFoundException('Produit introuvable')
    }
    const attached = this.attachProductImages({
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
    const [enriched] = await this.enrichShopCatalogProducts([attached], shop)
    const [withMeta] = await this.attachProductCatalogMeta([enriched ?? attached], shop.id)
    return withMeta
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
    if (hasVariants && dto.variants!.length > 100) {
      throw new BadRequestException('Un produit ne peut pas avoir plus de 100 variantes')
    }
    const stock = hasVariants
      ? dto.variants!.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0)
      : dto.stock_quantity ?? 0
    const price = hasVariants
      ? Math.min(...dto.variants!.map(v => v.price))
      : dto.price ?? 0
    const requestedStatus = dto.status ?? 'DRAFT'
    const status = requestedStatus === 'ACTIVE' ? 'PENDING_REVIEW' : requestedStatus
    const isDraft = status === 'DRAFT'
    if (!isDraft) {
      this.assertDeliveryModes(dto.allow_pickup, dto.allow_delivery)
    }
    const imageUrls = this.resolveImageUrls(dto)
    if (!isDraft) {
      this.assertPublishRequirements({
        name: dto.name, price, imageUrls, hasVariants, variants: dto.variants,
        description: dto.description, short_description: dto.short_description,
      })
    }
    const categoryId = await this.resolveProductCategoryId(dto)
    if (!isDraft) {
      await this.assertShopProductCategory(shop.id, categoryId)
    }
    const specifications = this.normalizeSpecifications(dto.specifications)

    const created = await this.prisma.product.create({
      data: {
        shop_id: shop.id,
        category_id: categoryId ?? undefined,
        name: dto.name,
        slug,
        sku: dto.sku ?? null,
        short_description: dto.short_description,
        description: this.sanitizeHtml(dto.description),
        composition: this.sanitizeHtml(dto.composition),
        seo_title: dto.seo_title ?? null,
        seo_description: dto.seo_description ?? null,
        condition: dto.condition as any,
        origin: dto.origin as any,
        tags: dto.tags ?? [],
        weight_grams: dto.weight_grams,
        dimensions: dto.dimensions,
        preparation_delay_days: dto.preparation_delay_days,
        is_made_to_order: dto.is_made_to_order ?? false,
        ...(specifications !== undefined ? { specifications } : {}),
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
                kind: v.kind ?? 'TEXT',
                color_hex: v.color_hex ?? null,
                image_url: v.image_url ?? null,
                price: v.price,
                stock_quantity: v.stock_quantity ?? 0,
                sku: v.sku,
                is_disabled: v.is_disabled ?? false,
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
    // Persist attribute_values (CategoryAttribute dynamic fields)
    if (dto.attribute_values?.length) {
      await this.syncAttributeValues(created.id, dto.attribute_values)
    }
    void this.searchService.syncProduct(created.id)
    if (created.status === 'PENDING_REVIEW') {
      void this.adminNotifications.productPendingReview(created.id, created.name)
    }
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
    if (status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      status = 'PENDING_REVIEW'
    }

    // Re-modération si changement critique sur un produit ACTIVE
    const isCurrentlyActive = existing.status === 'ACTIVE'
    if (isCurrentlyActive && !status) {
      const nameChanged = dto.name !== undefined && dto.name.trim() !== existing.name
      const categoryChanged = dto.category_id !== undefined && dto.category_id !== existing.category_id
      const categorySlugChanged = dto.category_slug !== undefined // résolution async vérifiée plus loin
      const imagesChanged = dto.images !== undefined || dto.image_url !== undefined
      if (nameChanged || categoryChanged || categorySlugChanged || imagesChanged) {
        status = 'PENDING_REVIEW'
      }
    }

    let stock = dto.stock_quantity
    let price = dto.price

    if (dto.variants) {
      if (dto.variants.length > 100) {
        throw new BadRequestException('Un produit ne peut pas avoir plus de 100 variantes')
      }
      await this.prisma.productVariant.deleteMany({ where: { product_id: productId } })
      if (dto.variants.length > 0) {
        await this.prisma.productVariant.createMany({
          data: dto.variants.map((v, index) => ({
            product_id: productId,
            name: v.name,
            kind: v.kind ?? 'TEXT',
            color_hex: v.color_hex ?? null,
            image_url: v.image_url ?? null,
            price: v.price,
            stock_quantity: v.stock_quantity ?? 0,
            sku: v.sku,
            is_disabled: v.is_disabled ?? false,
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
    const savingAsDraft = dto.status === 'DRAFT'
    if (!savingAsDraft) {
      this.assertDeliveryModes(allowPickup, allowDelivery)
    }

    const imageUrls = dto.images !== undefined
      ? this.resolveImageUrls({ images: dto.images })
      : dto.image_url !== undefined
        ? this.resolveImageUrls({ image_url: dto.image_url })
        : undefined

    if (!savingAsDraft && status === 'PENDING_REVIEW') {
      const effectiveImageUrls = imageUrls ?? (existing.image_url ? [existing.image_url] : [])
      const hasVariants = (dto.variants?.length ?? 0) > 0 || (existing.variants?.length ?? 0) > 0
      this.assertPublishRequirements({
        name: dto.name ?? existing.name,
        price: price ?? existing.price,
        imageUrls: effectiveImageUrls,
        hasVariants,
        variants: dto.variants,
        description: dto.description,
        short_description: dto.short_description,
      })
    }

    const categoryId = await this.resolveProductCategoryId(dto)
    const finalCategoryId = categoryId !== undefined ? categoryId : existing.category_id
    if (!savingAsDraft) {
      await this.assertShopProductCategory(shop.id, finalCategoryId)
    }

    const specifications = this.normalizeSpecifications(dto.specifications)

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        ...(dto.sku !== undefined ? { sku: dto.sku || null } : {}),
        short_description: dto.short_description,
        description: dto.description !== undefined ? this.sanitizeHtml(dto.description) : undefined,
        composition: dto.composition !== undefined ? this.sanitizeHtml(dto.composition) : undefined,
        ...(dto.seo_title !== undefined ? { seo_title: dto.seo_title || null } : {}),
        ...(dto.seo_description !== undefined ? { seo_description: dto.seo_description || null } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition as any } : {}),
        ...(dto.origin !== undefined ? { origin: dto.origin as any } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.weight_grams !== undefined ? { weight_grams: dto.weight_grams } : {}),
        ...(dto.dimensions !== undefined ? { dimensions: dto.dimensions } : {}),
        ...(dto.preparation_delay_days !== undefined ? { preparation_delay_days: dto.preparation_delay_days } : {}),
        ...(dto.is_made_to_order !== undefined ? { is_made_to_order: dto.is_made_to_order } : {}),
        ...(specifications !== undefined ? { specifications } : {}),
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

    if (dto.attribute_values !== undefined) {
      await this.syncAttributeValues(productId, dto.attribute_values)
    }

    const withImages = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        variants: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] },
        ...this.productImagesInclude,
      },
    })
    void this.searchService.syncProduct(productId)
    if (withImages.status === 'PENDING_REVIEW' && existing.status !== 'PENDING_REVIEW') {
      void this.adminNotifications.productPendingReview(withImages.id, withImages.name)
    }
    return this.attachProductImages(withImages)
  }

  async getShopTrustScore(shopSlug: string): Promise<{
    score: number | null
    total_orders: number
    fulfilled_orders: number
    cancelled_orders: number
    label: string
    badge: 'trusted' | 'good' | 'new' | null
  }> {
    const shop = await this.resolveShopBySlug(shopSlug)
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const [fulfilled, cancelled, total] = await Promise.all([
      this.prisma.order.count({
        where: {
          shop_id: shop.id,
          status: { in: ['DELIVERED', 'COMPLETED'] },
          created_at: { gte: since },
        },
      }),
      this.prisma.order.count({
        where: {
          shop_id: shop.id,
          status: 'CANCELLED',
          created_at: { gte: since },
        },
      }),
      this.prisma.order.count({
        where: {
          shop_id: shop.id,
          status: { in: ['DELIVERED', 'COMPLETED', 'CANCELLED'] },
          created_at: { gte: since },
        },
      }),
    ])

    if (total < 3) {
      return { score: null, total_orders: total, fulfilled_orders: fulfilled, cancelled_orders: cancelled, label: 'Nouveau vendeur', badge: 'new' }
    }

    const score = Math.round((fulfilled / total) * 100)
    const badge: 'trusted' | 'good' | 'new' = score >= 92 ? 'trusted' : score >= 75 ? 'good' : 'new'
    const label = badge === 'trusted' ? 'Vendeur de confiance' : badge === 'good' ? 'Vendeur fiable' : 'En cours d\'évaluation'
    return { score, total_orders: total, fulfilled_orders: fulfilled, cancelled_orders: cancelled, label, badge }
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

    const variant = this.resolveCartVariant(product, dto.variantId)

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

  private mergeGuestCartLines(items: GuestCartItemDto[]): GuestCartItemDto[] {
    const map = new Map<string, GuestCartItemDto>()
    for (const item of items) {
      const key = `${item.productId}:${item.variantId ?? ''}`
      const existing = map.get(key)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        map.set(key, { ...item })
      }
    }
    return Array.from(map.values())
  }

  private async buildGuestPreviewItems(items: GuestCartItemDto[]) {
    const merged = this.mergeGuestCartLines(items)
    const rawItems: Parameters<MarketplaceService['mapRawCartItem']>[0][] = []

    for (const line of merged) {
      const product = await this.prisma.product.findUnique({
        where: { id: line.productId },
        include: {
          shop: true,
          variants: true,
        },
      })
      if (!product || product.status !== 'ACTIVE') {
        throw new BadRequestException('Produit indisponible')
      }
      if (isMenuMirrorProductSlug(product.slug)) {
        throw new BadRequestException('Produit indisponible')
      }
      if (!product.shop.is_active || product.shop.status !== 'ACTIVE') {
        throw new BadRequestException('Boutique indisponible')
      }

      const variant = this.resolveCartVariant(product, line.variantId)

      const availableStock = this.resolveAvailableStock(product, variant)
      if (availableStock < line.quantity) {
        throw new BadRequestException('Stock insuffisant')
      }

      rawItems.push({
        id: `guest-${product.id}-${variant?.id ?? 'base'}`,
        quantity: line.quantity,
        variant_id: variant?.id ?? null,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          currency: product.currency,
          stock_quantity: product.stock_quantity,
          image_url: product.image_url,
          status: product.status,
          shop_id: product.shop_id,
          category_id: product.category_id,
          allow_pickup: product.allow_pickup,
          allow_delivery: product.allow_delivery,
          variants: product.variants.map(v => ({
            id: v.id,
            name: v.name,
            price: v.price,
            stock_quantity: v.stock_quantity,
          })),
          shop: product.shop,
        },
        variant: variant
          ? {
              id: variant.id,
              name: variant.name,
              price: variant.price,
              stock_quantity: variant.stock_quantity,
            }
          : null,
      })
    }

    return rawItems
  }

  async previewGuestCart(items: GuestCartItemDto[]) {
    const rawItems = await this.buildGuestPreviewItems(items)
    return this.buildCartResponse({ id: 'guest' }, rawItems)
  }

  async guestCheckout(dto: GuestCheckoutDto) {
    if (!dto.cart_items?.length) {
      throw new BadRequestException('Panier vide')
    }

    const session = await this.authService.resolveGuestForCheckout({
      first_name: dto.guest_first_name,
      last_name: dto.guest_last_name,
      phone: dto.customer_phone,
      create_account: dto.create_account,
      email: dto.email,
      password: dto.password,
    })

    const userId = session.user.id as string

    await this.clearCart(userId)
    for (const item of this.mergeGuestCartLines(dto.cart_items)) {
      await this.addToCart(userId, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })
    }

    const checkoutPayload: CheckoutDto = {
      delivery_type: dto.delivery_type,
      delivery_address: dto.delivery_address,
      delivery_city_id: dto.delivery_city_id,
      delivery_commune_id: dto.delivery_commune_id,
      delivery_district: dto.delivery_district,
      delivery_address_detail: dto.delivery_address_detail,
      delivery_latitude: dto.delivery_latitude,
      delivery_longitude: dto.delivery_longitude,
      customer_note: dto.customer_note,
      customer_phone: dto.customer_phone,
      applied_promotions: dto.applied_promotions,
      shop_deliveries: dto.shop_deliveries,
    }

    const checkout = await this.checkout(userId, checkoutPayload)

    return {
      checkout,
      user: session.user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }
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
        const shopLineItems = cart.items
          .filter(i => i.product.shop_id === shopId)
          .map(i => ({
            product_id: i.product.id,
            category_id: i.product.category_id ?? null,
            line_total: i.line_total,
          }))

        const result = await this.promotionsService.validateForShop({
          code,
          merchantId: null,
          shopId,
          subtotal: group.subtotal,
          userId,
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
        continue
      }

      const shopLineItems = cart.items
        .filter(i => i.product.shop_id === shopId)
        .map(i => ({
          product_id: i.product.id,
          category_id: i.product.category_id ?? null,
          line_total: i.line_total,
        }))

      const result = await this.promotionsService.validateForShop({
        code,
        merchantId: group.merchantId,
        shopId,
        subtotal: group.subtotal,
        userId,
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

  private resolveShopDeliveries(
    dto: CheckoutDto,
    shopIds: string[],
  ) {
    const globalType = dto.delivery_type ?? 'PICKUP'
    const byShop = new Map((dto.shop_deliveries ?? []).map(s => [s.shop_id, s]))
    return new Map(
      shopIds.map(shopId => {
        const specific = byShop.get(shopId)
        return [
          shopId,
          {
            shop_id: shopId,
            delivery_type: specific?.delivery_type ?? globalType,
            delivery_city_id: specific?.delivery_city_id ?? dto.delivery_city_id,
            delivery_commune_id: specific?.delivery_commune_id ?? dto.delivery_commune_id,
            delivery_district: specific?.delivery_district ?? dto.delivery_district,
            delivery_address_detail:
              specific?.delivery_address_detail ?? dto.delivery_address_detail,
            delivery_address: specific?.delivery_address ?? dto.delivery_address,
            delivery_latitude: specific?.delivery_latitude ?? dto.delivery_latitude,
            delivery_longitude: specific?.delivery_longitude ?? dto.delivery_longitude,
            city_name: undefined as string | undefined,
            commune_name: undefined as string | undefined,
            formatted_address: undefined as string | undefined,
          },
        ] 
      }),
    )
  }

  private async enrichShopDeliveryPlans(
    plans: ReturnType<MarketplaceService['resolveShopDeliveries']>,
  ) {
    for (const plan of plans.values()) {
      if (plan.delivery_type !== 'DELIVERY') continue

      const hasStructured =
        plan.delivery_city_id?.trim() && plan.delivery_commune_id?.trim()
      const hasLegacy = plan.delivery_address?.trim()
      if (!hasStructured && !hasLegacy) {
        throw new BadRequestException(
          'Adresse de livraison requise pour chaque boutique en mode livraison',
        )
      }

      if (plan.delivery_city_id && plan.delivery_commune_id) {
        const [city, commune] = await Promise.all([
          this.prisma.geoCity.findUnique({ where: { id: plan.delivery_city_id } }),
          this.prisma.geoCommune.findUnique({ where: { id: plan.delivery_commune_id } }),
        ])
        plan.city_name = city?.name
        plan.commune_name = commune?.name
      }

      plan.formatted_address =
        plan.delivery_address?.trim()
        || [plan.delivery_district, plan.commune_name, plan.city_name, plan.delivery_address_detail]
          .filter(Boolean)
          .join(', ')
    }
  }

  async reorderFromOrder(userId: string, orderId: string) {
    const reorderable = new Set([
      'COMPLETED',
      'DELIVERED',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
    ])

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: { items: true },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (!reorderable.has(order.status)) {
      throw new BadRequestException('Cette commande ne peut pas être recommandée')
    }

    await this.clearCart(userId)

    const added: string[] = []
    const skipped: Array<{ name: string; reason: string }> = []

    for (const item of order.items) {
      try {
        if (item.menu_item_id) {
          const optionIds = parseSelectedModifiers(item.modifiers).map(m => m.option_id)
          await this.addMenuItemToCart(userId, item.menu_item_id, item.quantity, optionIds)
          added.push(item.product_name)
        } else if (item.product_id) {
          await this.addToCart(userId, {
            productId: item.product_id,
            quantity: item.quantity,
            variantId: item.variant_id ?? undefined,
          })
          added.push(item.product_name)
        } else {
          skipped.push({ name: item.product_name, reason: 'Article non disponible' })
        }
      } catch (err) {
        skipped.push({
          name: item.product_name,
          reason:
            err instanceof BadRequestException
              ? String(err.message)
              : 'Indisponible',
        })
      }
    }

    if (!added.length && skipped.length) {
      throw new BadRequestException(
        skipped.map(s => `${s.name} : ${s.reason}`).join(' · '),
      )
    }

    const cart = await this.getCart(userId)
    return { cart, added_count: added.length, added, skipped }
  }

  private async checkoutMarketplaceOrder(
    userId: string,
    dto: CheckoutDto,
    rawCart: Awaited<ReturnType<MarketplaceService['getOrCreateCart']>>,
    activeItems: typeof rawCart.items,
  ) {
    if (!dto.shop_deliveries?.length && !dto.delivery_type) {
      throw new BadRequestException('Mode de livraison requis')
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

    const shopDeliveries = this.resolveShopDeliveries(dto, Array.from(groups.keys()))

    for (const [shopId, items] of groups) {
      const plan = shopDeliveries.get(shopId)!
      if (plan.delivery_type === 'DELIVERY') {
        const blocked = items.filter(i => i.product && !i.product.allow_delivery)
        if (blocked.length) {
          const names = blocked.map(i => i.product!.name).join(', ')
          throw new BadRequestException(
            `Livraison indisponible pour : ${names}. Retirez ces articles ou choisissez le retrait sur place.`,
          )
        }
      } else {
        const blocked = items.filter(i => i.product && !i.product.allow_pickup)
        if (blocked.length) {
          const names = blocked.map(i => i.product!.name).join(', ')
          throw new BadRequestException(
            `Retrait sur place indisponible pour : ${names}.`,
          )
        }
      }
    }

    await this.enrichShopDeliveryPlans(shopDeliveries)

    const deliveryQuotes: DeliveryQuoteItem[] = []
    for (const [shopId, plan] of shopDeliveries) {
      if (plan.delivery_type !== 'DELIVERY') continue
      if (!plan.delivery_city_id || !plan.delivery_commune_id) continue

      const quoteResult = await this.deliveryZones.quote({
        shop_ids: [shopId],
        city_id: plan.delivery_city_id,
        commune_id: plan.delivery_commune_id,
        subtotals: { [shopId]: subtotals[shopId] ?? 0 },
        order_flow: 'marketplace',
      })

      const unavailable = quoteResult.quotes.filter(q => !q.available)
      if (unavailable.length) {
        const names = unavailable.map(q => q.shop_name).join(', ')
        throw new BadRequestException(
          `Livraison indisponible pour : ${names}. ${unavailable[0].message ?? ''}`.trim(),
        )
      }
      deliveryQuotes.push(...quoteResult.quotes)
    }

    const promoByShop = new Map(
      (dto.applied_promotions ?? []).map(p => [p.shop_id, p]),
    )

    const lineImages = new Map<string, string | null>()
    await Promise.all(
      cart.items.map(async item => {
        lineImages.set(item.id, await this.resolveCartLineImageUrl(item))
      }),
    )

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
        const plan = shopDeliveries.get(groupShopId)!
        const isShopDelivery = plan.delivery_type === 'DELIVERY'

        let deliveryFee = 0
        if (isShopDelivery) {
          const quote = deliveryQuotes.find(q => q.shop_id === groupShopId)
          deliveryFee = quote?.fee ?? 0
        }

        let discountAmount = 0
        let promotionId: string | null = null
        const applied = promoByShop.get(groupShopId)

        if (applied) {
          const shopLineItems = items.map(i => ({
            product_id: i.product.id,
            category_id: i.product.category_id ?? null,
            line_total: i.line_total,
          }))
          const validation = await this.promotionsService.validateForShop({
            code: applied.code,
            merchantId: linkedMerchantId,
            shopId: groupShopId,
            subtotal,
            userId,
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
            delivery_type: plan.delivery_type,
            delivery_fulfilment_mode: isShopDelivery
              ? ((await tx.shop.findUnique({
                where: { id: groupShopId },
                select: { delivery_fulfilment_default: true },
              }))?.delivery_fulfilment_default ?? 'PLATFORM_RIDER')
              : 'PLATFORM_RIDER',
            delivery_address: isShopDelivery ? plan.formatted_address : undefined,
            delivery_city_id: isShopDelivery ? plan.delivery_city_id : undefined,
            delivery_commune_id: isShopDelivery ? plan.delivery_commune_id : undefined,
            delivery_district: isShopDelivery ? plan.delivery_district : undefined,
            delivery_latitude: isShopDelivery ? plan.delivery_latitude : undefined,
            delivery_longitude: isShopDelivery ? plan.delivery_longitude : undefined,
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
                image_url: lineImages.get(item.id) ?? null,
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

  /** Vérifie si un établissement est ouvert à l'heure donnée selon ses BusinessHour. */
  private isMerchantOpenAt(
    hours: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>,
    at: Date,
  ): boolean {
    if (!hours.length) return true // pas d'horaires configurés → toujours ouvert
    const day = at.getDay() // 0=Dimanche, convention JS
    const hh = String(at.getHours()).padStart(2, '0')
    const mm = String(at.getMinutes()).padStart(2, '0')
    const timeStr = `${hh}:${mm}`
    const entry = hours.find(h => h.day === day)
    if (!entry || entry.is_closed) return false
    if (!entry.open_time || !entry.close_time) return false
    return timeStr >= entry.open_time && timeStr <= entry.close_time
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

    // ── Vérification horaires d'ouverture ────────────────────────────────────
    const checkAt = dto.preorder_for ? new Date(dto.preorder_for) : new Date()
    const isPreorder = !!dto.preorder_for

    const merchantIds = Array.from(groups.keys())
    const merchantHourRows = await this.prisma.merchant.findMany({
      where: { id: { in: merchantIds } },
      select: { id: true, business_name: true, hours: true, delivery_fulfilment_default: true },
    })

    for (const m of merchantHourRows) {
      if (!this.isMerchantOpenAt(m.hours, checkAt)) {
        if (isPreorder) {
          const timeLabel = checkAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          throw new BadRequestException(
            `${m.business_name} n'est pas ouvert à ${timeLabel}. Choisissez un créneau pendant les heures d'ouverture.`,
          )
        }
        throw new BadRequestException(
          `${m.business_name} est actuellement fermé. Commandez pendant les heures d'ouverture ou activez la pré-commande.`,
        )
      }
    }

    // ── Code promo food ───────────────────────────────────────────────────────
    const foodPromoMap = new Map<string, { discount: number; promotionId: string; free_delivery: boolean }>()
    if (dto.food_promo_code) {
      const code = dto.food_promo_code.trim().toUpperCase()
      for (const merchantId of merchantIds) {
        const result = await this.promotionsService.validateForMerchant({
          code,
          merchantId,
          subtotal: subtotals[merchantId] ?? 0,
          userId,
        })
        if (result.valid) {
          foodPromoMap.set(merchantId, {
            discount: result.discount,
            promotionId: result.promotion.id,
            free_delivery: result.free_delivery,
          })
        }
      }
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

        const promoApplied = foodPromoMap.get(merchantId)
        const discountAmount = promoApplied?.discount ?? 0

        let deliveryFee = 0
        if (isDelivery && deliveryQuotes) {
          const quote = deliveryQuotes.quotes.find(
            q => q.merchant_id === merchantId || q.shop_id === merchantId,
          )
          deliveryFee = promoApplied?.free_delivery ? 0 : (quote?.fee ?? 0)
        }

        const total = Math.max(0, subtotal - discountAmount + deliveryFee)

        const merchantRow = merchantHourRows.find(m => m.id === merchantId)
        const fulfilmentMode = merchantRow?.delivery_fulfilment_default ?? 'PLATFORM_RIDER'

        const order = await tx.order.create({
          data: {
            user_id: userId,
            shop_id: null,
            merchant_id: merchantId,
            order_source: 'FOOD',
            status: 'PENDING',
            delivery_type: dto.delivery_type,
            delivery_fulfilment_mode: fulfilmentMode,
            delivery_address: deliveryAddress,
            delivery_city_id: dto.delivery_city_id,
            delivery_commune_id: dto.delivery_commune_id,
            delivery_district: dto.delivery_district,
            delivery_latitude: dto.delivery_latitude,
            delivery_longitude: dto.delivery_longitude,
            customer_note: dto.customer_note,
            customer_phone: dto.customer_phone,
            subtotal,
            discount_amount: discountAmount,
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
                image_url: item.menu_item?.image_url?.trim() ?? item.product.image_url?.trim() ?? null,
                modifiers: (item.selected_modifiers ?? []) as unknown as Prisma.InputJsonValue,
              })),
            },
          },
        })

        if (promoApplied && userId) {
          await Promise.all([
            tx.promotionRedemption.create({
              data: {
                promotion_id: promoApplied.promotionId,
                order_id: order.id,
                user_id: userId,
                amount_saved: promoApplied.discount,
              },
            }),
            tx.promotion.update({
              where: { id: promoApplied.promotionId },
              data: { uses_count: { increment: 1 } },
            }),
          ])
        }

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
              discount_amount: discountAmount,
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
          discount_amount: discountAmount,
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
    const totalDiscount = checkoutOrders.reduce((sum, o) => sum + o.discount_amount, 0)
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
        data: merchantOrderNotificationData(order),
      })
    }

    await this.loyalty.earnPoints(userId, 'purchase', {
      order_id: order.id,
      amount: payment.amount,
    }).catch(() => {})

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
      if (ownerId) {
        await this.notificationQueue.enqueuePush({
          userId: ownerId,
          type: 'order_created',
          title: 'Nouvelle commande',
          body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
          data: merchantOrderNotificationData(order),
        })
      }
      await this.loyalty.earnPoints(userId, 'purchase', {
        order_id: order.id,
        amount: payment.amount,
      }).catch(() => {})
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
        delivery_job: { select: { status: true } },
      },
      take: 50,
    })
  }

  async createCourierReview(
    userId: string,
    orderId: string,
    dto: { rating: number; comment?: string },
  ) {
    return this.courierReviews.createForOrder(userId, orderId, dto)
  }

  async createDeliveryDispute(userId: string, orderId: string, dto: CreateDeliveryDisputeDto) {
    return this.deliveryDisputes.createForOrder(userId, orderId, dto)
  }

  async getMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: {
        items: {
          include: this.orderItemDetailInclude,
        },
        shop: { select: { name: true, slug: true, phone: true, whatsapp: true, logo: true } },
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
            proof_otp: true,
            proof_otp_expires_at: true,
            proof_confirmed_at: true,
            courier: { select: { full_name: true, phone: true, vehicle: true } },
            courier_profile: {
              select: {
                phone: true,
                vehicle: true,
                rating_avg: true,
                user: { select: { full_name: true } },
              },
            },
          },
        },
        courier_review: {
          select: { id: true, rating: true, comment: true, status: true, created_at: true },
        },
        delivery_dispute: {
          select: { id: true, reason: true, description: true, status: true, created_at: true, admin_note: true },
        },
        return_request: true,
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')

    const deliveryCode = order.delivery_job
      ? this.deliveryProof.clientDeliveryCode(order.delivery_job)
      : null

    return {
      ...order,
      items: order.items.map(item => this.mapOrderItemWithImage(item)),
      delivery_job: order.delivery_job
        ? { ...order.delivery_job, delivery_code: deliveryCode }
        : null,
    }
  }

  async getMerchantOrder(
    userId: string,
    orderId: string,
    scope?: { shopId?: string; merchantId?: string },
  ) {
    const ctx = await this.resolveOrderContext(userId, scope)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...ctx.scope },
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

  async listMerchantOrders(
    userId: string,
    scope?: { shopId?: string; merchantId?: string },
    status?: OrderStatus,
  ) {
    const ctx = await this.resolveOrderContext(userId, scope)
    return this.prisma.order.findMany({
      where: {
        ...ctx.scope,
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
        user: { select: { full_name: true, email: true, phone: true } },
        payment: { select: { status: true, reference: true } },
      },
      take: 500,
    })
  }

  /** @deprecated alias — utilise listMerchantOrders avec merchantId */
  async listMerchantFoodOrders(userId: string, merchantId?: string, status?: OrderStatus) {
    return this.listMerchantOrders(userId, merchantId ? { merchantId } : undefined, status)
  }

  /** @deprecated alias — utilise updateOrderStatus avec merchantId */
  async updateFoodOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto, merchantId?: string) {
    return this.updateOrderStatus(userId, orderId, dto, merchantId ? { merchantId } : undefined)
  }

  async exportMerchantOrdersCsv(
    userId: string,
    scope?: { shopId?: string; merchantId?: string },
    days = 90,
  ) {
    const ctx = await this.resolveOrderContext(userId, scope)
    const periodDays = Math.min(Math.max(days, 1), 365)
    const since = new Date()
    since.setDate(since.getDate() - periodDays)

    const orders = await this.prisma.order.findMany({
      where: {
        ...ctx.scope,
        created_at: { gte: since },
      },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
        user: { select: { full_name: true, email: true, phone: true } },
        payment: { select: { status: true, reference: true } },
      },
    })

    const escape = (value: string | number | null | undefined) => {
      const str = value == null ? '' : String(value)
      if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
      return str
    }

    const header = [
      'reference',
      'date',
      'statut',
      'client',
      'telephone',
      'email',
      'mode',
      'adresse_livraison',
      'articles',
      'total_fcfa',
      'paiement',
      'ref_paiement',
    ].join(',')

    const rows = orders.map(order => {
      const itemsSummary = order.items
        .map(i => `${i.quantity}x ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''}`)
        .join(' · ')
      return [
        order.id.slice(-8).toUpperCase(),
        order.created_at.toISOString(),
        orderStatusLabelFr(order.status),
        order.user?.full_name ?? order.customer_phone ?? '',
        order.customer_phone ?? order.user?.phone ?? '',
        order.user?.email ?? '',
        order.delivery_type === 'DELIVERY' ? 'Livraison' : 'Retrait',
        order.delivery_address ?? '',
        itemsSummary,
        order.total,
        order.payment?.status ?? '',
        order.payment?.reference ?? '',
      ].map(escape).join(',')
    })

    return [header, ...rows].join('\n')
  }

  async getMerchantShopAnalytics(userId: string, shopId?: string, days = 30) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const periodDays = Math.min(Math.max(days, 7), 90)
    const since = new Date()
    since.setDate(since.getDate() - periodDays)
    since.setHours(0, 0, 0, 0)

    const scope = this.shopOrderScope(shop.id)
    const periodWhere = { ...scope, created_at: { gte: since } }

    const completedStatuses = [
      'COMPLETED',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ] as const

    const [
      statusGroups,
      completedAgg,
      stalePendingCount,
      periodOrders,
      orderItems,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: periodWhere,
        _count: { status: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...periodWhere,
          status: { in: [...completedStatuses] },
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      this.prisma.order.count({
        where: {
          ...scope,
          status: 'PENDING',
          created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.order.findMany({
        where: periodWhere,
        select: { created_at: true, total: true, status: true },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            ...periodWhere,
            status: { in: [...completedStatuses] },
          },
        },
        select: {
          product_id: true,
          menu_item_id: true,
          product_name: true,
          quantity: true,
          line_total: true,
        },
      }),
    ])

    const ordersByStatus = statusGroups.map(g => ({
      status: g.status,
      count: g._count.status,
    }))

    const ordersTotal = statusGroups.reduce((sum, g) => sum + g._count.status, 0)
    const ordersCompleted = completedAgg._count
    const ordersPending = statusGroups.find(g => g.status === 'PENDING')?._count.status ?? 0
    const ordersCancelled =
      (statusGroups.find(g => g.status === 'CANCELLED')?._count.status ?? 0) +
      (statusGroups.find(g => g.status === 'REFUNDED')?._count.status ?? 0)

    const checkoutAttempts = ordersCompleted + ordersCancelled + ordersPending
    const conversionRate =
      checkoutAttempts > 0 ? Math.round((ordersCompleted / checkoutAttempts) * 1000) / 10 : 0

    const topMap = new Map<
      string,
      { product_id: string | null; menu_item_id: string | null; name: string; quantity_sold: number; revenue: number }
    >()
    for (const item of orderItems) {
      const key = item.product_id ?? item.menu_item_id ?? item.product_name
      const existing = topMap.get(key)
      if (existing) {
        existing.quantity_sold += item.quantity
        existing.revenue += item.line_total
      } else {
        topMap.set(key, {
          product_id: item.product_id,
          menu_item_id: item.menu_item_id,
          name: item.product_name,
          quantity_sold: item.quantity,
          revenue: item.line_total,
        })
      }
    }
    const topProducts = [...topMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const chartMap = new Map<string, { revenue: number; orders: number }>()
    for (let i = 0; i < periodDays; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      chartMap.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 })
    }
    for (const order of periodOrders) {
      const day = order.created_at.toISOString().slice(0, 10)
      const entry = chartMap.get(day)
      if (!entry) continue
      entry.orders += 1
      if (completedStatuses.includes(order.status as (typeof completedStatuses)[number])) {
        entry.revenue += order.total
      }
    }
    const revenueChart = [...chartMap.entries()].map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orders: v.orders,
    }))

    return {
      period_days: periodDays,
      summary: {
        revenue: completedAgg._sum.total ?? 0,
        orders_total: ordersTotal,
        orders_completed: ordersCompleted,
        orders_pending: ordersPending,
        orders_cancelled: ordersCancelled,
        avg_order_value: completedAgg._avg.total
          ? Math.round(completedAgg._avg.total)
          : 0,
        conversion_rate: conversionRate,
        abandoned_checkouts: stalePendingCount,
      },
      orders_by_status: ordersByStatus,
      top_products: topProducts,
      revenue_chart: revenueChart,
    }
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
    scope?: { shopId?: string; merchantId?: string },
  ) {
    const ctx = await this.resolveOrderContext(userId, scope)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...ctx.scope },
      include: {
        user: { select: { id: true } },
        merchant: { select: { food_prep_minutes: true, business_name: true } },
        shop: { select: { name: true } },
      },
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

    if (dto.status === 'PREPARING') {
      const prepMinutes = order.merchant?.food_prep_minutes ?? 25
      await this.deliveryEta.startPrepTimer(orderId, prepMinutes).catch(() => {})
    } else if (['READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(dto.status)) {
      void this.deliveryEta.refreshOrderEta(orderId).catch(() => {})
    }

    const pushMessage = buildOrderStatusPushMessage(
      dto.status,
      order.delivery_type,
      order.merchant?.business_name ?? order.shop?.name,
    )
    await this.notificationQueue.enqueuePush({
      userId: order.user.id,
      type: 'order_status',
      title: pushMessage.title,
      body: pushMessage.body,
      data: {
        order_id: order.id,
        status: dto.status,
        delivery_type: order.delivery_type,
      },
    })

    return updated
  }

  async getOrderEta(userId: string, orderId: string) {
    return this.deliveryEta.getOrderEta(orderId, userId)
  }

  async getMerchantOrderEta(
    userId: string,
    orderId: string,
    scope?: { shopId?: string; merchantId?: string },
  ) {
    const ctx = await this.resolveOrderContext(userId, scope)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, ...ctx.scope },
      select: { id: true },
    })
    if (!order) return null
    return this.deliveryEta.getOrderEta(orderId)
  }

  async getFeaturedProducts(limit = 8) {
    const sponsoredIds = await this.ads.getActiveProductIdsForPlacement('MARKETPLACE_FEATURED_PRODUCTS')
    const campaigns = await this.ads.getActiveCampaignTargets('MARKETPLACE_FEATURED_PRODUCTS')
    const campaignByProduct = new Map(
      campaigns.filter(c => c.product_id).map(c => [c.product_id!, c.id]),
    )

    const catalogSelect = this.marketplaceCatalogSelect()

    const [sponsoredRows, regularRows] = await Promise.all([
      sponsoredIds.length
        ? this.prisma.product.findMany({
            where: this.marketplaceCartProductWhere({ id: { in: sponsoredIds } }),
            select: catalogSelect,
          })
        : Promise.resolve([]),
      this.prisma.product.findMany({
        where: this.marketplaceCartProductWhere(
          sponsoredIds.length ? { id: { notIn: sponsoredIds } } : {},
        ),
        orderBy: { created_at: 'desc' },
        take: limit,
        select: catalogSelect,
      }),
    ])

    const sponsoredById = new Map(sponsoredRows.map(r => [r.id, r]))
    const orderedSponsored = sponsoredIds
      .map(id => sponsoredById.get(id))
      .filter((r): r is (typeof sponsoredRows)[number] => Boolean(r))

    const rows = [...orderedSponsored, ...regularRows].slice(0, limit)

    const mapped = rows.map(row =>
      this.mapCatalogProductRow(row, {
        is_sponsored: campaignByProduct.has(row.id),
        ad_campaign_id: campaignByProduct.get(row.id) ?? null,
      }),
    )
    return this.promotionsService.enrichProductsWithPromotions(mapped)
  }

  async listMarketplaceProducts(query?: {
    q?: string
    merchant?: string
    shop?: string
    category?: string
    condition?: string
    origin?: string
    sort?: string
    maxPrice?: number
    country?: string
    limit?: number
    offset?: number
  }) {
    const countryCode = query?.country?.trim().toUpperCase()
    const paginate = query?.limit != null
    const limit = paginate
      ? Math.min(Math.max(Math.floor(query!.limit!), 1), 100)
      : undefined
    const offset = paginate ? Math.max(Math.floor(query?.offset ?? 0), 0) : 0

    const sortParam =
      query?.sort === 'price_asc'
        ? 'price_asc'
        : query?.sort === 'price_desc'
          ? 'price_desc'
          : 'newest'

    if (query?.q?.trim()) {
      const meili = await this.searchService.searchProducts({
        q: query.q.trim(),
        category: query?.category,
        shop: query?.shop ?? query?.merchant,
        country: countryCode,
        sort: sortParam,
        maxPrice: query?.maxPrice,
        limit: limit ?? 100,
        offset,
      })
      if (meili) {
        const data = await this.enrichMeiliCatalogProducts(meili.data)
        if (!paginate) return data
        return {
          data,
          meta: {
            total: meili.meta.total,
            limit: limit!,
            offset,
            hasMore: offset + data.length < meili.meta.total,
          },
        }
      }
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
      if (!categoryId) {
        if (!paginate) return []
        return {
          data: [],
          meta: { total: 0, limit: limit!, offset, hasMore: false },
        }
      }
    }

    const VALID_CONDITIONS = ['NEW', 'USED_GOOD', 'USED_FAIR', 'REFURBISHED']
    const VALID_ORIGINS = ['LOCAL_CI', 'IMPORTED', 'HANDMADE']
    const conditionFilter = query?.condition && VALID_CONDITIONS.includes(query.condition.toUpperCase())
      ? query.condition.toUpperCase()
      : undefined
    const originFilter = query?.origin && VALID_ORIGINS.includes(query.origin.toUpperCase())
      ? query.origin.toUpperCase()
      : undefined

    const catalogSelect = this.marketplaceCatalogSelect()
    const where = this.marketplaceCartProductWhere({
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(conditionFilter ? { condition: conditionFilter as any } : {}),
      ...(originFilter ? { origin: originFilter as any } : {}),
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
    })

    if (!paginate) {
      return this.prisma.product
        .findMany({ where, orderBy, select: catalogSelect })
        .then(async rows => {
          const mapped = rows.map(row => this.mapCatalogProductRow(row))
          return this.promotionsService.enrichProductsWithPromotions(mapped)
        })
    }

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        select: catalogSelect,
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where }),
    ])

    const mapped = rows.map(row => this.mapCatalogProductRow(row))
    const data = await this.promotionsService.enrichProductsWithPromotions(mapped)
    return {
      data,
      meta: {
        total,
        limit: limit!,
        offset,
        hasMore: offset + data.length < total,
      },
    }
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
          merchant_id: true,
          merchant: {
            select: { id: true, is_sponsored: true },
          },
        },
      }),
      this.ads.getActiveCampaignTargets('MARKETPLACE'),
    ])

    const shopCampaignById = new Map<string, string>()
    const merchantCampaignById = new Map<string, string>()
    for (const c of marketplaceCampaigns) {
      if (c.target_type === 'SHOP' && c.shop_id) {
        shopCampaignById.set(c.shop_id, c.id)
      } else if (c.merchant_id) {
        merchantCampaignById.set(c.merchant_id, c.id)
      }
    }

    const ranked = shops
      .map(shop => {
        const merchantId = shop.merchant?.id ?? shop.merchant_id
        const hasShopAd = shopCampaignById.has(shop.id)
        const hasLegacyMerchantAd = merchantId ? merchantCampaignById.has(merchantId) : false
        const hasMarketplaceAd = hasShopAd || hasLegacyMerchantAd
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
          ad_campaign_id: shopCampaignById.get(shop.id) ?? (merchantId ? merchantCampaignById.get(merchantId) ?? null : null),
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

  private static readonly RETURN_ELIGIBLE_STATUSES: OrderStatus[] = [
    'DELIVERED',
    'COMPLETED',
    'READY',
  ]

  async createOrderReturn(
    userId: string,
    orderId: string,
    dto: { reason: string; description?: string },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (!MarketplaceService.RETURN_ELIGIBLE_STATUSES.includes(order.status)) {
      throw new BadRequestException('Cette commande n\'est pas éligible à un retour')
    }
    if (order.order_source === 'FOOD') {
      throw new BadRequestException('Les retours food se font directement auprès du restaurant')
    }

    const existing = await this.prisma.orderReturn.findUnique({ where: { order_id: orderId } })
    if (existing) {
      throw new BadRequestException('Une demande de retour existe déjà pour cette commande')
    }

    return this.prisma.orderReturn.create({
      data: {
        order_id: orderId,
        user_id: userId,
        shop_id: order.shop_id,
        reason: dto.reason,
        description: dto.description ?? null,
      },
    })
  }

  async listMerchantReturns(
    userId: string,
    shopId?: string,
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED',
  ) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    return this.prisma.orderReturn.findMany({
      where: {
        shop_id: shop.id,
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            created_at: true,
            user: { select: { full_name: true, email: true, phone: true } },
            items: { select: { product_name: true, quantity: true } },
          },
        },
      },
      take: 500,
    })
  }

  async updateOrderReturn(
    userId: string,
    returnId: string,
    dto: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; merchant_note?: string },
    shopId?: string,
  ) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    const row = await this.prisma.orderReturn.findFirst({
      where: { id: returnId, shop_id: shop.id },
      include: { order: true },
    })
    if (!row) throw new NotFoundException('Demande de retour introuvable')
    if (row.status !== 'PENDING' && dto.status !== row.status) {
      throw new BadRequestException('Cette demande a déjà été traitée')
    }

    const now = new Date()
    const updated = await this.prisma.orderReturn.update({
      where: { id: returnId },
      data: {
        status: dto.status,
        merchant_note: dto.merchant_note ?? row.merchant_note,
        resolved_at: ['APPROVED', 'REJECTED', 'REFUNDED'].includes(dto.status) ? now : null,
      },
    })

    if (dto.status === 'REFUNDED' && row.order.status !== 'REFUNDED') {
      await this.prisma.order.update({
        where: { id: row.order_id },
        data: { status: 'REFUNDED' },
      })
    }

    await this.notificationQueue.enqueuePush({
      userId: row.user_id,
      type: 'order_return',
      title: 'Demande de retour',
      body: dto.status === 'APPROVED'
        ? 'Votre demande de retour a été acceptée.'
        : dto.status === 'REFUNDED'
          ? 'Votre remboursement a été enregistré.'
          : dto.status === 'REJECTED'
            ? 'Votre demande de retour a été refusée.'
            : 'Mise à jour de votre demande de retour.',
      data: { order_id: row.order_id, return_id: returnId, status: dto.status },
    })

    return updated
  }
}
