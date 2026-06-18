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
import { generatePaymentReference, slugify } from './marketplace.util'
import { ShopsService } from '../shops/shops.service'

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly shopsService: ShopsService,
  ) {}

  private shopPublicSelect = {
    id: true,
    name: true,
    slug: true,
    logo: true,
    merchant_id: true,
  } as const

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

  private mapCartItem(
    item: {
      id: string
      quantity: number
      variant_id: string | null
      product: {
        id: string
        name: string
        slug: string
        price: number
        currency: string
        stock_quantity: number
        image_url: string | null
        status: ProductStatus
        shop_id: string
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
      }
      variant?: { id: string; name: string; price: number; stock_quantity: number } | null
    },
  ) {
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
        allow_pickup: item.product.allow_pickup,
        allow_delivery: item.product.allow_delivery,
        shop: item.product.shop,
        merchant: {
          id: item.product.shop.id,
          business_name: item.product.shop.name,
          slug: item.product.shop.slug,
        },
        has_variants: (item.product.variants?.length ?? 0) > 0,
      },
    }
  }

  private buildCartResponse(
    cart: { id: string },
    rawItems: Parameters<MarketplaceService['mapCartItem']>[0][],
  ) {
    const items = rawItems.map(i => this.mapCartItem(i))
    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
    const shopMap = new Map<
      string,
      { id: string; name: string; slug: string; subtotal: number; item_count: number }
    >()

    for (const item of items) {
      const s = item.product.shop
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

  private async resolveShopBySlug(slug: string) {
    return this.shopsService.getByMerchantSlug(slug)
  }

  // ─── Products (public) ───────────────────────────────────────────────────────

  async listPublicProducts(shopSlug: string) {
    const shop = await this.resolveShopBySlug(shopSlug)
    const products = await this.prisma.product.findMany({
      where: { shop_id: shop.id, status: 'ACTIVE' },
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
      },
    })
    if (!product) throw new NotFoundException('Produit introuvable')
    return {
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
    }
  }

  // ─── Products (boutique) ─────────────────────────────────────────────────────

  async listMyProducts(userId: string, shopId?: string) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    return this.prisma.product.findMany({
      where: { shop_id: shop.id },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      include: {
        variants: {
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        },
      },
    })
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

    return this.prisma.product.create({
      data: {
        shop_id: shop.id,
        name: dto.name,
        slug,
        description: dto.description,
        composition: dto.composition,
        price,
        stock_quantity: stock,
        image_url: dto.image_url,
        allow_pickup: dto.allow_pickup ?? true,
        allow_delivery: dto.allow_delivery ?? true,
        status,
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
      include: { variants: true },
    })
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

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        composition: dto.composition,
        price,
        stock_quantity: stock,
        image_url: dto.image_url,
        allow_pickup: dto.allow_pickup,
        allow_delivery: dto.allow_delivery,
        status,
      },
      include: { variants: { orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }] } },
    })
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
    return { success: true }
  }

  // ─── Cart ────────────────────────────────────────────────────────────────────

  private cartItemInclude = {
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
        variants: { select: { id: true, name: true, price: true, stock_quantity: true } },
        shop: true,
      },
    },
    variant: {
      select: { id: true, name: true, price: true, stock_quantity: true },
    },
  } as const

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
    const items = cart.items.filter(i => i.product.status === 'ACTIVE')
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
    if (!product.shop.is_active || product.shop.status !== 'ACTIVE') {
      throw new BadRequestException('Boutique indisponible')
    }

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

    const cart = await this.getOrCreateCart(userId)
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

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId)
    const item = cart.items.find(i => i.id === itemId)
    if (!item) throw new NotFoundException('Article introuvable dans le panier')

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } })
    } else {
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

  async checkout(userId: string, dto: CheckoutDto) {
    if (dto.delivery_type === 'DELIVERY' && !dto.delivery_address?.trim()) {
      throw new BadRequestException('Adresse de livraison requise')
    }

    const rawCart = await this.getOrCreateCart(userId)
    const activeItems = rawCart.items.filter(i => i.product.status === 'ACTIVE')
    if (!activeItems.length) {
      throw new BadRequestException('Panier vide')
    }

    if (dto.delivery_type === 'DELIVERY') {
      const blocked = activeItems.filter(i => !i.product.allow_delivery)
      if (blocked.length) {
        const names = blocked.map(i => i.product.name).join(', ')
        throw new BadRequestException(
          `Livraison indisponible pour : ${names}. Retirez ces articles ou choisissez le retrait sur place.`,
        )
      }
    }

    if (dto.delivery_type === 'PICKUP') {
      const blocked = activeItems.filter(i => !i.product.allow_pickup)
      if (blocked.length) {
        const names = blocked.map(i => i.product.name).join(', ')
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
    for (const item of cart.items) {
      const sid = item.product.shop_id
      const list = groups.get(sid) ?? []
      list.push(item)
      groups.set(sid, list)
    }

    const checkoutOrders = await this.prisma.$transaction(async tx => {
      const results: Array<{
        orderId: string
        paymentId: string
        reference: string
        amount: number
        shop: { id: string; name: string; slug: string }
        merchant: { id: string; business_name: string; slug: string }
      }> = []

      for (const [groupShopId, items] of groups) {
        const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
        const reference = generatePaymentReference()
        const shopInfo = items[0].product.shop
        const linkedMerchantId = shopInfo.merchant_id ?? null

        const order = await tx.order.create({
          data: {
            user_id: userId,
            shop_id: groupShopId,
            merchant_id: linkedMerchantId,
            status: 'PENDING',
            delivery_type: dto.delivery_type,
            delivery_address: dto.delivery_address,
            customer_note: dto.customer_note,
            customer_phone: dto.customer_phone,
            subtotal,
            total: subtotal,
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

        const payment = await tx.paymentTransaction.create({
          data: {
            user_id: userId,
            shop_id: groupShopId,
            merchant_id: linkedMerchantId,
            purpose: 'ORDER',
            amount: subtotal,
            reference,
            order_id: order.id,
            metadata: { simulator: true, order_id: order.id },
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
    const first = checkoutOrders[0]

    return {
      orders: checkoutOrders,
      total,
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
    orderItems: Array<{ product_id: string | null; variant_id: string | null }>,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const cart = await tx.cart.findUnique({ where: { user_id: userId } })
    if (!cart) return

    for (const item of orderItems) {
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

    await this.notificationQueue.enqueuePush({
      userId: order.shop.owner_id,
      type: 'order_created',
      title: 'Nouvelle commande',
      body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
      data: { order_id: order.id, shop_id: order.shop_id },
    })

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
      await this.notificationQueue.enqueuePush({
        userId: order.shop.owner_id,
        type: 'order_created',
        title: 'Nouvelle commande',
        body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
        data: { order_id: order.id, shop_id: order.shop_id },
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

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
        shop: { select: { name: true, slug: true, logo: true } },
        merchant: { select: { business_name: true, slug: true, logo: true } },
        payment: { select: { status: true, reference: true, paid_at: true } },
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
        merchant: { select: { business_name: true, slug: true, phone: true, whatsapp: true } },
        payment: { select: { status: true, reference: true, paid_at: true } },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    return order
  }

  async listMerchantOrders(userId: string, shopId?: string, status?: OrderStatus) {
    const shop = await this.shopsService.resolveOwnerShop(userId, shopId)
    return this.prisma.order.findMany({
      where: {
        shop_id: shop.id,
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
      where: { id: orderId, shop_id: shop.id },
      include: { user: { select: { id: true } } },
    })
    if (!order) throw new NotFoundException('Commande introuvable')

    const allowed: Record<string, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      REFUNDED: [],
    }
    if (!allowed[order.status]?.includes(dto.status)) {
      throw new BadRequestException(`Transition ${order.status} → ${dto.status} non autorisée`)
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
    sort?: string
    maxPrice?: number
  }) {
    const orderBy =
      query?.sort === 'price_asc'
        ? { price: 'asc' as const }
        : query?.sort === 'price_desc'
          ? { price: 'desc' as const }
          : { created_at: 'desc' as const }

    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock_quantity: { gt: 0 },
        ...(query?.maxPrice != null && query.maxPrice > 0
          ? { price: { lte: query.maxPrice } }
          : {}),
        ...(query?.q
          ? { name: { contains: query.q, mode: 'insensitive' as const } }
          : {}),
        shop: {
          is_active: true,
          status: 'ACTIVE',
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
