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
  ProductStatus,
} from '../../generated/prisma/client'
import {
  AddCartItemDto,
  CheckoutDto,
  ConfirmOrderPaymentDto,
  CreateProductDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
} from './dto/marketplace.dto'
import { BOUTIQUE_CATEGORY_SLUGS, generatePaymentReference, slugify } from './marketplace.util'

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  private async resolveOwnerMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      include: { category: { select: { slug: true } } },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  private assertBoutique(categorySlug: string) {
    if (!BOUTIQUE_CATEGORY_SLUGS.includes(categorySlug)) {
      throw new ForbiddenException('La marketplace est réservée aux boutiques pour le moment')
    }
  }

  private async resolveMerchantBySlug(slug: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { slug, is_active: true },
      include: { category: { select: { slug: true, name: true } } },
    })
    if (!merchant) throw new NotFoundException('Commerce introuvable')
    this.assertBoutique(merchant.category.slug)
    return merchant
  }

  // ─── Products (public) ───────────────────────────────────────────────────────

  async listPublicProducts(merchantSlug: string) {
    const merchant = await this.resolveMerchantBySlug(merchantSlug)
    return this.prisma.product.findMany({
      where: { merchant_id: merchant.id, status: 'ACTIVE' },
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
      },
    })
  }

  async getPublicProduct(merchantSlug: string, productSlug: string) {
    const merchant = await this.resolveMerchantBySlug(merchantSlug)
    const product = await this.prisma.product.findFirst({
      where: {
        merchant_id: merchant.id,
        slug: productSlug,
        status: { in: ['ACTIVE', 'OUT_OF_STOCK'] },
      },
    })
    if (!product) throw new NotFoundException('Produit introuvable')
    return {
      ...product,
      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        slug: merchant.slug,
        category: merchant.category,
      },
    }
  }

  // ─── Products (merchant) ───────────────────────────────────────────────────

  async listMyProducts(userId: string, merchantId?: string) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    this.assertBoutique(merchant.category.slug)
    return this.prisma.product.findMany({
      where: { merchant_id: merchant.id },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
    })
  }

  async createProduct(userId: string, dto: CreateProductDto, merchantId?: string) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    this.assertBoutique(merchant.category.slug)

    const limits = getPlanLimits(merchant.subscription_plan)
    if (!limits.marketplace) {
      throw new ForbiddenException('Marketplace non disponible pour ce plan')
    }

    const count = await this.prisma.product.count({ where: { merchant_id: merchant.id } })
    if (!isWithinLimit(count, limits.maxProducts)) {
      throw new ForbiddenException(`Limite de ${limits.maxProducts} produits atteinte pour votre plan`)
    }

    let baseSlug = slugify(dto.name)
    let slug = baseSlug
    let n = 1
    while (await this.prisma.product.findFirst({ where: { merchant_id: merchant.id, slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const stock = dto.stock_quantity ?? 0
    const status = dto.status ?? (stock > 0 ? 'ACTIVE' : 'DRAFT')

    return this.prisma.product.create({
      data: {
        merchant_id: merchant.id,
        name: dto.name,
        slug,
        description: dto.description,
        price: dto.price,
        stock_quantity: stock,
        image_url: dto.image_url,
        status,
      },
    })
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto, merchantId?: string) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    this.assertBoutique(merchant.category.slug)

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Produit introuvable')

    let status = dto.status
    if (dto.stock_quantity !== undefined && dto.stock_quantity === 0 && !status) {
      status = 'OUT_OF_STOCK'
    } else if (dto.stock_quantity !== undefined && dto.stock_quantity > 0 && existing.status === 'OUT_OF_STOCK' && !status) {
      status = 'ACTIVE'
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock_quantity: dto.stock_quantity,
        image_url: dto.image_url,
        status,
      },
    })
  }

  async deleteProduct(userId: string, productId: string, merchantId?: string) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Produit introuvable')
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    })
    return { success: true }
  }

  // ─── Cart ────────────────────────────────────────────────────────────────────

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
      include: {
        items: {
          include: {
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
                merchant_id: true,
                merchant: {
                  select: {
                    id: true,
                    business_name: true,
                    slug: true,
                    category: { select: { slug: true } },
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)
    const items = cart.items.filter(i => i.product.status === 'ACTIVE')
    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    const merchant = items[0]?.product.merchant ?? null
    return {
      id: cart.id,
      merchant_id: cart.merchant_id,
      items: items.map(i => ({
        id: i.id,
        quantity: i.quantity,
        line_total: i.product.price * i.quantity,
        product: i.product,
      })),
      subtotal,
      currency: 'XOF',
      merchant,
      item_count: items.reduce((n, i) => n + i.quantity, 0),
    }
  }

  async addToCart(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { merchant: { include: { category: true } } },
    })
    if (!product || product.status !== 'ACTIVE') {
      throw new BadRequestException('Produit indisponible')
    }
    this.assertBoutique(product.merchant.category.slug)
    if (product.stock_quantity < dto.quantity) {
      throw new BadRequestException('Stock insuffisant')
    }

    const cart = await this.getOrCreateCart(userId)
    if (cart.items.length > 0 && cart.merchant_id && cart.merchant_id !== product.merchant_id) {
      throw new BadRequestException('Votre panier contient déjà des articles d\'un autre commerce. Videz-le d\'abord.')
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { merchant_id: product.merchant_id },
    })

    await this.prisma.cartItem.upsert({
      where: { cart_id_product_id: { cart_id: cart.id, product_id: product.id } },
      create: { cart_id: cart.id, product_id: product.id, quantity: dto.quantity },
      update: { quantity: { increment: dto.quantity } },
    })

    return this.getCart(userId)
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId)
    const item = cart.items.find(i => i.product_id === productId)
    if (!item) throw new NotFoundException('Article introuvable dans le panier')

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } })
    } else {
      if (item.product.stock_quantity < quantity) {
        throw new BadRequestException('Stock insuffisant')
      }
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } })
    }

    const remaining = await this.prisma.cartItem.count({ where: { cart_id: cart.id } })
    if (remaining === 0) {
      await this.prisma.cart.update({ where: { id: cart.id }, data: { merchant_id: null } })
    }

    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)
    await this.prisma.cartItem.deleteMany({ where: { cart_id: cart.id } })
    await this.prisma.cart.update({ where: { id: cart.id }, data: { merchant_id: null } })
    return { success: true }
  }

  // ─── Checkout & Orders ─────────────────────────────────────────────────────

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.getCart(userId)
    if (!cart.items.length || !cart.merchant_id) {
      throw new BadRequestException('Panier vide')
    }
    if (dto.delivery_type === 'DELIVERY' && !dto.delivery_address?.trim()) {
      throw new BadRequestException('Adresse de livraison requise')
    }

    for (const item of cart.items) {
      if (item.product.stock_quantity < item.quantity) {
        throw new BadRequestException(`Stock insuffisant pour ${item.product.name}`)
      }
    }

    const subtotal = cart.subtotal
    const reference = generatePaymentReference()

    const result = await this.prisma.$transaction(async tx => {
      const order = await tx.order.create({
        data: {
          user_id: userId,
          merchant_id: cart.merchant_id!,
          status: 'PENDING',
          delivery_type: dto.delivery_type,
          delivery_address: dto.delivery_address,
          customer_note: dto.customer_note,
          customer_phone: dto.customer_phone,
          subtotal,
          total: subtotal,
          items: {
            create: cart.items.map(item => ({
              product_id: item.product.id,
              product_name: item.product.name,
              unit_price: item.product.price,
              quantity: item.quantity,
              line_total: item.product.price * item.quantity,
            })),
          },
        },
        include: { items: true, merchant: { select: { business_name: true, owner_id: true } } },
      })

      const payment = await tx.paymentTransaction.create({
        data: {
          user_id: userId,
          merchant_id: cart.merchant_id!,
          purpose: 'ORDER',
          amount: subtotal,
          reference,
          order_id: order.id,
          metadata: { simulator: true, order_id: order.id },
        },
      })

      return { order, payment }
    })

    return {
      orderId: result.order.id,
      paymentId: result.payment.id,
      reference: result.payment.reference,
      amount: result.payment.amount,
      currency: result.payment.currency,
      provider: 'SIMULATOR',
      instructions: 'Confirmez avec simulateResult success ou failure.',
    }
  }

  async confirmOrderPayment(userId: string, dto: ConfirmOrderPaymentDto) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: dto.paymentId, user_id: userId, purpose: 'ORDER' },
      include: {
        order: { include: { items: true, merchant: { select: { business_name: true, owner_id: true } } } },
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
        if (!item.product_id) continue
        const product = await tx.product.findUnique({ where: { id: item.product_id } })
        if (!product) continue
        const newStock = Math.max(0, product.stock_quantity - item.quantity)
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock_quantity: newStock,
            status: newStock === 0 ? 'OUT_OF_STOCK' : product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status,
          },
        })
      }

      const cart = await tx.cart.findUnique({ where: { user_id: userId } })
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cart_id: cart.id } })
        await tx.cart.update({ where: { id: cart.id }, data: { merchant_id: null } })
      }
    })

    await this.notificationQueue.enqueuePush({
      userId: order.merchant.owner_id,
      type: 'order_created',
      title: 'Nouvelle commande',
      body: `Commande confirmée — ${order.total.toLocaleString('fr-CI')} FCFA`,
      data: { order_id: order.id, merchant_id: order.merchant_id },
    })

    return {
      status: 'SUCCESS',
      orderId: order.id,
      message: 'Commande confirmée. Merci pour votre achat !',
    }
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        items: true,
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
        merchant: { select: { business_name: true, slug: true, phone: true, whatsapp: true } },
        payment: { select: { status: true, reference: true, paid_at: true } },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    return order
  }

  async listMerchantOrders(userId: string, merchantId?: string, status?: OrderStatus) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    return this.prisma.order.findMany({
      where: {
        merchant_id: merchant.id,
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

  async updateOrderStatus(userId: string, orderId: string, dto: UpdateOrderStatusDto, merchantId?: string) {
    const merchant = await this.resolveOwnerMerchant(userId, merchantId)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, merchant_id: merchant.id },
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
        merchant: {
          is_active: true,
          category: { slug: { in: BOUTIQUE_CATEGORY_SLUGS } },
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
        merchant: { select: { business_name: true, slug: true } },
      },
    })
  }

  /** Upsert produits démo pour les boutiques (seed idempotent). */
  async seedDemoProducts() {
    const catalog: Array<{ merchantSlug: string; products: Array<{ name: string; slug: string; price: number; stock: number; image: string; desc: string }> }> = [
      {
        merchantSlug: 'yale-design',
        products: [
          { name: 'Robe Wax Élégance', slug: 'robe-wax-elegance', price: 45000, stock: 12, image: 'https://images.unsplash.com/photo-1594633312681-425a7b9569e2?auto=format&fit=crop&q=80&w=800', desc: 'Robe en wax premium, coupe moderne.' },
          { name: 'Sac Tissé Main', slug: 'sac-tisse-main', price: 28000, stock: 8, image: 'https://images.unsplash.com/photo-1590875127128-5de792a5c2a8?auto=format&fit=crop&q=80&w=800', desc: 'Sac artisanal tissé à la main.' },
          { name: 'Boubou Homme Premium', slug: 'boubou-homme-premium', price: 65000, stock: 5, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800', desc: 'Boubou brodé, finitions soignées.' },
        ],
      },
      {
        merchantSlug: 'galerie-korhogo',
        products: [
          { name: 'Masque Senoufo', slug: 'masque-senoufo', price: 85000, stock: 3, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', desc: 'Masque traditionnel authentique.' },
          { name: 'Tissu Kita', slug: 'tissu-kita', price: 35000, stock: 15, image: 'https://images.unsplash.com/photo-1558171818-61854a5d1d4f?auto=format&fit=crop&q=80&w=800', desc: 'Tissu Kita 6 yards, motifs géométriques.' },
          { name: 'Bronze Baoulé', slug: 'bronze-baoule', price: 120000, stock: 2, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40f68d55?auto=format&fit=crop&q=80&w=800', desc: 'Sculpture bronze signée artiste local.' },
        ],
      },
    ]

    let count = 0
    const skipped: string[] = []
    for (const group of catalog) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { slug: group.merchantSlug },
        select: { id: true, slug: true },
      })
      if (!merchant) {
        skipped.push(group.merchantSlug)
        continue
      }
      for (const p of group.products) {
        await this.prisma.product.upsert({
          where: { merchant_id_slug: { merchant_id: merchant.id, slug: p.slug } },
          update: { name: p.name, price: p.price, stock_quantity: p.stock, image_url: p.image, description: p.desc, status: 'ACTIVE' },
          create: { merchant_id: merchant.id, name: p.name, slug: p.slug, price: p.price, stock_quantity: p.stock, image_url: p.image, description: p.desc, status: 'ACTIVE' },
        })
        count++
      }
    }
    return { created_or_updated: count, skipped_merchants: skipped }
  }
}
