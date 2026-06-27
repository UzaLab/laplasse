import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Query, NotFoundException, BadRequestException } from '@nestjs/common'
import { hash } from 'bcryptjs'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { ComplaintsService } from '../complaints/complaints.service'
import { SearchService } from '../search/search.service'
import { MerchantsService } from '../merchants/merchants.service'
import { NotificationsService } from '../notifications/notifications.service'
import { AuditService } from '../audit/audit.service'
import { MarketplaceService } from '../marketplace/marketplace.service'
import { ProductCategoriesService } from '../marketplace/product-categories.service'
import { GeoService } from '../geo/geo.service'
import { AdminSeedService } from './admin-seed.service'
import { CourierReviewsService } from '../couriers/courier-reviews.service'
import { DeliveryDisputesService } from '../delivery/delivery-disputes.service'
import { DeliveryService } from '../delivery/delivery.service'
import { LogisticsPartnersService } from '../logistics/logistics-partners.service'
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service'
import { CourierStatus, DeliveryDisputeStatus, AdCampaignStatus, OrderStatus, ShopStatus, ProductStatus } from '../../generated/prisma/client'
import { AdsService } from '../ads/ads.service'
import { UpdateAdminShopActiveDto, UpdateAdminShopStatusDto } from './dto/admin-shop.dto'

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly complaintsService: ComplaintsService,
    private readonly searchService: SearchService,
    private readonly merchantsService: MerchantsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly marketplace: MarketplaceService,
    private readonly productCategories: ProductCategoriesService,
    private readonly geo: GeoService,
    private readonly adminSeed: AdminSeedService,
    private readonly courierReviews: CourierReviewsService,
    private readonly deliveryDisputes: DeliveryDisputesService,
    private readonly deliveryService: DeliveryService,
    private readonly logisticsPartners: LogisticsPartnersService,
    private readonly deliveryZones: DeliveryZonesService,
    private readonly ads: AdsService,
  ) {}

  // ── Stats globales ──────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const [merchantTotal, merchantPending, merchantVerified, users, reviewTotal, reviewPending, productReviewPending, complaintOpen, courierReviewPending, courierPendingKyc, shopsPending, productsPending] =
      await Promise.all([
        this.prisma.merchant.count(),
        this.prisma.merchant.count({ where: { verification_status: 'PENDING' } }),
        this.prisma.merchant.count({ where: { verification_status: 'VERIFIED' } }),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.review.count(),
        this.prisma.review.count({ where: { status: 'PENDING' } }),
        this.prisma.productReview.count({ where: { status: 'PENDING' } }),
        this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
        this.prisma.courierReview.count({ where: { status: 'PENDING' } }),
        this.prisma.courierProfile.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.shop.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
      ])

    return {
      merchants: { total: merchantTotal, pending: merchantPending, verified: merchantVerified },
      users,
      reviews: { total: reviewTotal, pending: reviewPending },
      product_reviews: { pending: productReviewPending },
      courier_reviews: { pending: courierReviewPending },
      couriers: { pending_kyc: courierPendingKyc },
      complaints: { open: complaintOpen },
      shops: { pending: shopsPending },
      products: { pending: productsPending },
    }
  }

  // ── Marchands ───────────────────────────────────────────────────────────────

  @Get('merchants')
  async getMerchants(
    @Query('filter') filter?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit ?? 20), 100)
    const skip = (Math.max(Number(page ?? 1), 1) - 1) * take

    const statusFilter = filter === 'pending' ? { verification_status: 'PENDING' as const }
      : filter === 'verified' ? { verification_status: 'VERIFIED' as const }
      : filter === 'rejected' ? { verification_status: 'REJECTED' as const }
      : filter === 'inactive' ? { is_active: false }
      : {}

    const searchFilter = q?.trim() ? {
      OR: [
        { business_name: { contains: q.trim(), mode: 'insensitive' as const } },
        { slug: { contains: q.trim(), mode: 'insensitive' as const } },
        { owner: { email: { contains: q.trim(), mode: 'insensitive' as const } } },
        { owner: { full_name: { contains: q.trim(), mode: 'insensitive' as const } } },
      ],
    } : {}

    const where = { ...statusFilter, ...searchFilter }

    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        where,
        select: {
          id: true, business_name: true, slug: true, verification_status: true,
          is_active: true, is_sponsored: true, subscription_plan: true,
          created_at: true, trust_score: true,
          category: { select: { name: true } },
          location: { select: { city: true, district: true, country: true } },
          owner: { select: { id: true, email: true, full_name: true } },
          _count: { select: { reviews: true, complaints: true, orders: true } },
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      this.prisma.merchant.count({ where }),
    ])

    return { merchants, total, page: Number(page ?? 1), limit: take }
  }

  @Get('merchants/:id')
  async getMerchantDetail(@Param('id') id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        owner: { select: { id: true, email: true, full_name: true, phone: true, role: true, created_at: true } },
        subscription: true,
        complaints: {
          orderBy: { created_at: 'desc' },
          take: 10,
          select: { id: true, reason: true, status: true, created_at: true },
        },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { created_at: 'desc' },
          take: 5,
          select: { id: true, rating: true, content: true, created_at: true, user: { select: { full_name: true, email: true } } },
        },
        _count: { select: { reviews: true, complaints: true, orders: true, favorites: true } },
      },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    const avgRating = await this.prisma.review.aggregate({
      where: { merchant_id: id, status: 'APPROVED' },
      _avg: { rating: true },
    })

    return { ...merchant, avg_rating: avgRating._avg.rating ?? 0 }
  }

  @Patch('merchants/:id')
  async updateMerchant(
    @Param('id') id: string,
    @Body() body: {
      business_name?: string
      description?: string
      phone?: string
      whatsapp?: string
      email?: string
      website?: string
      category_id?: string
      is_active?: boolean
      is_sponsored?: boolean
      trust_score?: number
      food_prep_minutes?: number
      location?: { city?: string; district?: string; address?: string; country?: string; latitude?: number; longitude?: number }
    },
  ) {
    const { location, ...merchantData } = body
    const updated = await this.prisma.merchant.update({
      where: { id },
      data: merchantData,
    })
    if (location) {
      await this.prisma.merchantLocation.upsert({
        where: { merchant_id: id },
        create: { merchant_id: id, city: '', ...location },
        update: location,
      })
    }
    this.searchService.syncMerchant(id).catch(() => {})
    await this.audit.log({ action: 'UPDATE', entityType: 'Merchant', entityId: id, payload: body })
    return updated
  }

  @Patch('merchants/:id/owner')
  async reassignMerchantOwner(
    @Param('id') id: string,
    @Body() body: { new_owner_id: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: body.new_owner_id }, select: { id: true, email: true } })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    const [, updated] = await this.prisma.$transaction([
      this.prisma.shop.updateMany({
        where: { merchant_id: id },
        data: { owner_id: body.new_owner_id },
      }),
      this.prisma.merchant.update({
        where: { id },
        data: { owner_id: body.new_owner_id },
        select: { id: true, business_name: true, owner: { select: { id: true, email: true, full_name: true } } },
      }),
    ])
    await this.audit.log({ action: 'UPDATE', entityType: 'Merchant', entityId: id, payload: { action: 'reassign_owner', new_owner_id: body.new_owner_id } })
    return updated
  }

  @Patch('merchants/:id/subscription')
  async updateMerchantSubscription(
    @Param('id') id: string,
    @Body() body: {
      plan?: string
      status?: string
      billing_cycle?: string
      expires_at?: string | null
    },
  ) {
    const sub = await this.prisma.subscription.upsert({
      where: { merchant_id: id },
      create: {
        merchant_id: id,
        plan: (body.plan ?? 'FREE') as never,
        status: (body.status ?? 'ACTIVE') as never,
        billing_cycle: body.billing_cycle,
        expires_at: body.expires_at ? new Date(body.expires_at) : undefined,
      },
      update: {
        plan: body.plan ? (body.plan as never) : undefined,
        status: body.status ? (body.status as never) : undefined,
        billing_cycle: body.billing_cycle ?? undefined,
        expires_at: body.expires_at !== undefined ? (body.expires_at ? new Date(body.expires_at) : null) : undefined,
      },
    })
    if (body.plan) {
      await this.prisma.merchant.update({ where: { id }, data: { subscription_plan: body.plan as never } })
    }
    await this.audit.log({ action: 'UPDATE', entityType: 'Merchant', entityId: id, payload: { action: 'update_subscription', ...body } })
    return sub
  }

  @Post('merchants')
  async createMerchant(
    @Body() body: {
      business_name: string
      owner_id: string
      category_id: string
      description?: string
      phone?: string
      email?: string
      country?: string
      city?: string
    },
  ) {
    if (!body.business_name || !body.owner_id || !body.category_id) {
      throw new BadRequestException('business_name, owner_id, category_id requis')
    }
    const user = await this.prisma.user.findUnique({ where: { id: body.owner_id }, select: { id: true } })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    const category = await this.prisma.category.findUnique({ where: { id: body.category_id }, select: { id: true } })
    if (!category) throw new NotFoundException('Catégorie introuvable')

    const slug = body.business_name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36)

    const merchant = await this.prisma.merchant.create({
      data: {
        business_name: body.business_name,
        slug,
        owner_id: body.owner_id,
        category_id: body.category_id,
        description: body.description,
        phone: body.phone,
        email: body.email,
        verification_status: 'UNVERIFIED',
        ...(body.city ? {
          location: { create: { city: body.city, country: body.country ?? 'CI' } },
        } : {}),
      },
      include: {
        owner: { select: { id: true, email: true, full_name: true } },
        category: { select: { name: true } },
        location: true,
      },
    })
    await this.audit.log({ action: 'CREATE', entityType: 'Merchant', entityId: merchant.id, payload: body })
    return merchant
  }

  // ── Boutiques marketplace ─────────────────────────────────────────────────────

  @Get('shops')
  async getShops(
    @Query('filter') filter?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit ?? 20), 100)
    const skip = (Math.max(Number(page ?? 1), 1) - 1) * take

    const statusFilter =
      filter === 'pending' ? { status: 'PENDING_REVIEW' as ShopStatus }
        : filter === 'active' ? { status: 'ACTIVE' as ShopStatus }
        : filter === 'draft' ? { status: 'DRAFT' as ShopStatus }
        : filter === 'suspended' ? { status: 'SUSPENDED' as ShopStatus }
        : filter === 'inactive' ? { is_active: false }
        : {}

    const typeFilter =
      type === 'standalone' ? { merchant_id: null }
        : type === 'linked' ? { merchant_id: { not: null } }
        : {}

    const searchFilter = q?.trim()
      ? {
          OR: [
            { name: { contains: q.trim(), mode: 'insensitive' as const } },
            { slug: { contains: q.trim(), mode: 'insensitive' as const } },
            { owner: { email: { contains: q.trim(), mode: 'insensitive' as const } } },
            { owner: { full_name: { contains: q.trim(), mode: 'insensitive' as const } } },
            { merchant: { business_name: { contains: q.trim(), mode: 'insensitive' as const } } },
          ],
        }
      : {}

    const where = { ...statusFilter, ...typeFilter, ...searchFilter }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          is_active: true,
          merchant_id: true,
          logo: true,
          city: true,
          country: true,
          created_at: true,
          updated_at: true,
          owner: { select: { id: true, email: true, full_name: true } },
          merchant: { select: { id: true, business_name: true, slug: true } },
          _count: { select: { products: true, orders: true } },
        },
      }),
      this.prisma.shop.count({ where }),
    ])

    return { shops, total, page: Math.max(Number(page ?? 1), 1), limit: take }
  }

  @Get('shops/:id')
  async getShopDetail(@Param('id') id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        cover_image: true,
        phone: true,
        whatsapp: true,
        email: true,
        city: true,
        district: true,
        address: true,
        country: true,
        status: true,
        is_active: true,
        enabled_modules: true,
        has_physical_location: true,
        delivery_fulfilment_default: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: { id: true, email: true, full_name: true, phone: true, created_at: true },
        },
        merchant: {
          select: { id: true, business_name: true, slug: true, verification_status: true },
        },
        products: {
          take: 30,
          orderBy: { updated_at: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            price: true,
            image_url: true,
            stock_quantity: true,
            updated_at: true,
          },
        },
        _count: { select: { products: true, orders: true } },
      },
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')
    return shop
  }

  @Patch('shops/:id/status')
  async updateShopStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdminShopStatusDto,
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!shop) throw new NotFoundException('Boutique introuvable')

    const updated = await this.prisma.shop.update({
      where: { id },
      data: { status: body.status as ShopStatus },
      select: { id: true, name: true, slug: true, status: true },
    })

    await this.audit.log({
      action: 'STATUS_CHANGE',
      entityType: 'shop',
      entityId: id,
      payload: { status: body.status },
    })

    return updated
  }

  @Patch('shops/:id/active')
  async updateShopActive(
    @Param('id') id: string,
    @Body() body: UpdateAdminShopActiveDto,
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id }, select: { id: true } })
    if (!shop) throw new NotFoundException('Boutique introuvable')

    const updated = await this.prisma.shop.update({
      where: { id },
      data: { is_active: body.is_active },
      select: { id: true, name: true, is_active: true, status: true },
    })

    await this.audit.log({
      action: 'UPDATE',
      entityType: 'shop',
      entityId: id,
      payload: { is_active: body.is_active },
    })

    return updated
  }

  // ── Produits marketplace ────────────────────────────────────────────────────────

  @Get('products')
  async getProducts(
    @Query('filter') filter?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit ?? 20), 100)
    const skip = (Math.max(Number(page ?? 1), 1) - 1) * take

    const statusFilter =
      filter === 'pending' ? { status: 'PENDING_REVIEW' as ProductStatus }
        : filter === 'active' ? { status: 'ACTIVE' as ProductStatus }
        : filter === 'draft' ? { status: 'DRAFT' as ProductStatus }
        : filter === 'archived' ? { status: 'ARCHIVED' as ProductStatus }
        : filter === 'out_of_stock' ? { status: 'OUT_OF_STOCK' as ProductStatus }
        : {}

    const searchFilter = q?.trim()
      ? {
          OR: [
            { name: { contains: q.trim(), mode: 'insensitive' as const } },
            { slug: { contains: q.trim(), mode: 'insensitive' as const } },
            { shop: { name: { contains: q.trim(), mode: 'insensitive' as const } } },
          ],
        }
      : {}

    const where = { ...statusFilter, ...searchFilter }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          price: true,
          image_url: true,
          stock_quantity: true,
          created_at: true,
          updated_at: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              merchant_id: true,
              owner: { select: { email: true, full_name: true } },
            },
          },
          category: { select: { name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return { products, total, page: Math.max(Number(page ?? 1), 1), limit: take }
  }

  @Get('products/:id')
  async getProductDetail(@Param('id') id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        composition: true,
        price: true,
        stock_quantity: true,
        image_url: true,
        status: true,
        allow_pickup: true,
        allow_delivery: true,
        created_at: true,
        updated_at: true,
        category: { select: { id: true, name: true } },
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            logo: true,
            owner: { select: { id: true, email: true, full_name: true } },
          },
        },
        images: { orderBy: { sort_order: 'asc' }, select: { url: true, sort_order: true } },
        variants: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            name: true,
            price: true,
            stock_quantity: true,
            kind: true,
            color_hex: true,
            image_url: true,
          },
        },
      },
    })
    if (!product) throw new NotFoundException('Produit introuvable')
    return product
  }

  @Patch('products/:id/status')
  async updateProductStatus(
    @Param('id') id: string,
    @Body() body: { status: ProductStatus },
  ) {
    const allowed: ProductStatus[] = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']
    if (!allowed.includes(body.status)) {
      throw new BadRequestException('Statut non autorisé')
    }

    const product = await this.prisma.product.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!product) throw new NotFoundException('Produit introuvable')

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, name: true, slug: true, status: true },
    })

    this.searchService.syncProduct(id).catch(() => {})
    await this.audit.log({
      action: 'STATUS_CHANGE',
      entityType: 'product',
      entityId: id,
      payload: { status: body.status },
    })

    return updated
  }

  // ── Catégories établissements ─────────────────────────────────────────────────

  @Get('categories')
  async listMerchantCategories() {
    return this.prisma.category.findMany({
      include: {
        children: {
          include: { _count: { select: { merchants: true } } },
          orderBy: { sort_order: 'asc' },
        },
        _count: { select: { merchants: true } },
      },
      where: { parent_id: null },
      orderBy: { sort_order: 'asc' },
    })
  }

  @Post('categories')
  async createMerchantCategory(
    @Body() body: { name: string; parent_id?: string; icon?: string; sort_order?: number },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Nom requis')
    const slug = body.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36)
    const cat = await this.prisma.category.create({
      data: {
        name: body.name.trim(),
        slug,
        parent_id: body.parent_id ?? null,
        icon: body.icon ?? null,
        sort_order: body.sort_order ?? 0,
      },
    })
    await this.audit.log({ action: 'CREATE', entityType: 'Category', entityId: cat.id, payload: body })
    return cat
  }

  @Patch('categories/:id')
  async updateMerchantCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; icon?: string | null; sort_order?: number; is_active?: boolean; parent_id?: string | null },
  ) {
    const cat = await this.prisma.category.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? undefined,
        icon: body.icon !== undefined ? body.icon : undefined,
        sort_order: body.sort_order ?? undefined,
        is_active: body.is_active ?? undefined,
        parent_id: body.parent_id !== undefined ? body.parent_id : undefined,
      },
    })
    await this.audit.log({ action: 'UPDATE', entityType: 'Category', entityId: id, payload: body })
    return cat
  }

  @Patch('merchants/:id/verify')
  async verifyMerchant(
    @Param('id') id: string,
    @Body() body: { status: string; trust_score?: number },
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        verification_status: body.status as never,
        trust_score: body.trust_score ?? undefined,
        is_active: body.status === 'VERIFIED',
      },
      select: {
        id: true, business_name: true, verification_status: true, is_active: true,
        owner_id: true,
      },
    })
    // Sync Meilisearch après changement de statut
    this.searchService.syncMerchant(id).catch(() => {})
    // Notification au propriétaire
    if (body.status === 'VERIFIED') {
      this.notifications.sendMerchantVerified(merchant.owner_id, merchant.business_name).catch(() => {})
    } else if (body.status === 'PENDING') {
      this.notifications.sendMerchantPending(merchant.owner_id, merchant.business_name).catch(() => {})
    }
    return merchant
  }

  @Patch('merchants/:id/sponsor')
  async toggleSponsored(
    @Param('id') id: string,
    @Body() body: { is_sponsored: boolean; subscription_plan?: string },
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id },
      data: {
        is_sponsored: body.is_sponsored,
        ...(body.subscription_plan ? { subscription_plan: body.subscription_plan as never } : {}),
      },
      select: { id: true, business_name: true, is_sponsored: true, subscription_plan: true },
    })
    this.searchService.syncMerchant(id).catch(() => {})
    return merchant
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────

  @Get('reviews')
  getReviews(@Query('filter') filter?: string) {
    const where = filter === 'pending' ? { status: 'PENDING' as const } : {}
    return this.prisma.review.findMany({
      where,
      include: {
        merchant: { select: { id: true, business_name: true, slug: true } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('reviews/:id')
  async moderateReview(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, status: true, merchant_id: true },
    })
    if (updated.merchant_id) {
      this.merchantsService.refreshMerchantAvgRating(updated.merchant_id).catch(() => {})
    }
    return { id: updated.id, status: updated.status }
  }

  @Patch('reviews/:id/moderate')
  async moderateReviewAction(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    if (body.action === 'delete') {
      const deleted = await this.prisma.review.findUnique({ where: { id }, select: { merchant_id: true } })
      await this.prisma.review.delete({ where: { id } })
      if (deleted?.merchant_id) {
        this.merchantsService.refreshMerchantAvgRating(deleted.merchant_id).catch(() => {})
      }
      return { deleted: true }
    }
    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: body.action === 'approve' ? 'APPROVED' : 'REJECTED' },
      select: {
        id: true, status: true,
        user_id: true,
        merchant_id: true,
        merchant: { select: { business_name: true } },
      },
    })
    if (body.action === 'approve') {
      this.notifications.sendReviewApproved(updated.user_id, updated.merchant.business_name).catch(() => {})
    }
    if (updated.merchant_id) {
      this.merchantsService.refreshMerchantAvgRating(updated.merchant_id).catch(() => {})
    }
    return { id: updated.id, status: updated.status }
  }

  // ── Avis produits ───────────────────────────────────────────────────────────

  @Get('product-reviews')
  getProductReviews(@Query('filter') filter?: string) {
    const where = filter === 'pending' ? { status: 'PENDING' as const } : {}
    return this.prisma.productReview.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true, shop: { select: { slug: true, name: true } } } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('product-reviews/:id/moderate')
  moderateProductReview(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    if (body.action === 'delete') {
      return this.prisma.productReview.delete({ where: { id } }).then(() => ({ deleted: true }))
    }
    return this.prisma.productReview.update({
      where: { id },
      data: { status: body.action === 'approve' ? 'APPROVED' : 'REJECTED' },
      select: { id: true, status: true },
    })
  }

  // ── Signalements ────────────────────────────────────────────────────────────

  @Get('complaints')
  getComplaints(@Query('filter') filter?: string) {
    return this.complaintsService.findAll(filter)
  }

  @Patch('complaints/:id')
  moderateComplaint(
    @Param('id') id: string,
    @Body() body: { action: 'review' | 'resolve' | 'dismiss' },
  ) {
    return this.complaintsService.moderate(id, body.action)
  }

  // ── Utilisateurs ────────────────────────────────────────────────────────────

  @Get('users')
  async getUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit ?? 20), 100)
    const skip = (Math.max(Number(page ?? 1), 1) - 1) * take

    const roles = ['USER', 'MERCHANT', 'COURIER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
    const roleFilter = role && roles.includes(role) ? { role: role as never } : {}
    const searchFilter = q?.trim() ? {
      OR: [
        { email: { contains: q.trim(), mode: 'insensitive' as const } },
        { full_name: { contains: q.trim(), mode: 'insensitive' as const } },
        { phone: { contains: q.trim(), mode: 'insensitive' as const } },
      ],
    } : {}
    const where = { ...roleFilter, ...searchFilter }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, full_name: true, role: true, phone: true,
          is_active: true, is_verified: true, created_at: true, country: true, city: true,
          _count: { select: { orders: true, merchants: true } },
        },
        orderBy: { created_at: 'desc' },
        take,
        skip,
      }),
      this.prisma.user.count({ where }),
    ])

    return { users, total, page: Number(page ?? 1), limit: take }
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, full_name: true, role: true, phone: true, avatar: true,
        is_active: true, is_verified: true, created_at: true, updated_at: true,
        country: true, city: true,
        merchants: {
          select: { id: true, business_name: true, slug: true, verification_status: true, subscription_plan: true, is_active: true },
          take: 10,
        },
        orders: {
          orderBy: { created_at: 'desc' },
          take: 10,
          select: {
            id: true, status: true, total: true, currency: true, created_at: true,
            shop: { select: { name: true } },
          },
        },
        loyalty_account: { select: { points: true, tier: true } },
        _count: { select: { orders: true, merchants: true, reviews: true, favorites: true } },
      },
    })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    return user
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; is_active?: boolean; is_verified?: boolean },
  ) {
    const roles = ['USER', 'MERCHANT', 'COURIER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
    if (body.role && !roles.includes(body.role)) throw new BadRequestException('Rôle invalide')
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: body.role ? (body.role as never) : undefined,
        is_active: body.is_active ?? undefined,
        is_verified: body.is_verified ?? undefined,
      },
      select: { id: true, email: true, role: true, is_active: true, is_verified: true },
    })
    await this.audit.log({ action: 'UPDATE', entityType: 'User', entityId: id, payload: body })
    return updated
  }

  @Post('users/set-password')
  async setUserPassword(@Body() body: { email: string; password: string }) {
    const email = body.email?.trim().toLowerCase()
    if (!email || !body.password?.trim()) {
      throw new BadRequestException('Email et mot de passe requis')
    }
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
    if (!user) throw new NotFoundException('Utilisateur introuvable')
    const password_hash = await hash(body.password, 12)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash, is_verified: true, is_active: true },
    })
    return { ok: true, email: user.email }
  }

  @Post('sync-search')
  async syncSearch() {
    await this.searchService.syncAllMerchants()
    await this.searchService.syncAllProducts()
    await this.searchService.syncAllMenuItems()
    return { ok: true, message: 'Meilisearch re-indexé (établissements + produits + menus)' }
  }

  @Post('seed-marketplace')
  async seedMarketplace() {
    const result = await this.marketplace.seedDemoProducts()
    return { ok: true, ...result }
  }

  @Post('seed-multipays')
  async seedMultipays(@Query('country') country?: string) {
    const code = (country ?? 'ALL').toUpperCase()
    if (code !== 'ALL' && code !== 'BF' && code !== 'SN') {
      throw new BadRequestException('country doit être BF, SN ou ALL')
    }
    return this.adminSeed.seedMultipays(code as 'BF' | 'SN' | 'ALL')
  }

  @Post('seed-product-categories')
  seedProductCategories() {
    return this.adminSeed.seedProductCategories()
  }

  // ── Trust Score ──────────────────────────────────────────────────────────────

  @Post('merchants/:id/trust-score/recalculate')
  async recalculateTrustScore(@Param('id') id: string) {
    const score = await this.merchantsService.recalculateTrustScore(id)
    return { id, trust_score: score }
  }

  @Post('trust-score/recalculate-all')
  async recalculateAllTrustScores() {
    const result = await this.merchantsService.recalculateAllTrustScores()
    return { ok: true, ...result }
  }

  // ── Growth Dashboard (KPIs) ──────────────────────────────────────────────────

  @Get('growth')
  async getGrowthKpis(@Query('days') days?: string) {
    const daysInt = Number(days ?? 30)
    const since = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000)

    const [
      newUsers, newMerchants, totalSearches, newReviews,
      activeMerchants, verifiedMerchants,
      dailyUsers, dailySearches,
    ] = await Promise.all([
      this.prisma.user.count({ where: { created_at: { gte: since } } }),
      this.prisma.merchant.count({ where: { created_at: { gte: since } } }),
      this.prisma.searchHistory.count({ where: { created_at: { gte: since } } }),
      this.prisma.review.count({ where: { created_at: { gte: since }, status: 'APPROVED' } }),
      this.prisma.merchant.count({ where: { is_active: true } }),
      this.prisma.merchant.count({ where: { verification_status: 'VERIFIED' } }),
      // New users per day
      this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE("created_at") as day, COUNT(*) as count
        FROM "User"
        WHERE "created_at" >= ${since}
        GROUP BY DATE("created_at")
        ORDER BY day ASC
      `,
      // Searches per day
      this.prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE("created_at") as day, COUNT(*) as count
        FROM "SearchHistory"
        WHERE "created_at" >= ${since}
        GROUP BY DATE("created_at")
        ORDER BY day ASC
      `,
    ])

    return {
      period_days: daysInt,
      kpis: {
        new_users: newUsers,
        new_merchants: newMerchants,
        total_searches: totalSearches,
        new_reviews: newReviews,
        active_merchants: activeMerchants,
        verified_merchants: verifiedMerchants,
      },
      charts: {
        daily_users: dailyUsers.map(r => ({ day: r.day, count: Number(r.count) })),
        daily_searches: dailySearches.map(r => ({ day: r.day, count: Number(r.count) })),
      },
    }
  }

  @Get('audit')
  getAuditLogs(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entity_type') entity_type?: string,
    @Query('q') q?: string,
  ) {
    return this.audit.listRecent(limit ? Number(limit) : 50, { action, entity_type, q })
  }

  // ── Marketplace spotlight ────────────────────────────────────────────────────

  @Get('marketplace/spotlight')
  async getMarketplaceSpotlightSettings() {
    const limit = await this.marketplace.getMarketplaceSpotlightLimit()
    const featured = await this.prisma.shop.findMany({
      where: { marketplace_featured: true },
      select: { id: true, name: true, slug: true, marketplace_featured: true },
      orderBy: { name: 'asc' },
    })
    return { marketplace_spotlight_limit: limit, featured_shops: featured }
  }

  @Patch('marketplace/spotlight/limit')
  async setMarketplaceSpotlightLimit(@Body() body: { limit: number }) {
    if (body.limit == null || !Number.isFinite(body.limit)) {
      throw new BadRequestException('Limite invalide')
    }
    return this.marketplace.setMarketplaceSpotlightLimit(body.limit)
  }

  @Patch('shops/:id/marketplace-featured')
  async toggleShopMarketplaceFeatured(
    @Param('id') id: string,
    @Body() body: { featured: boolean },
  ) {
    return this.marketplace.setShopMarketplaceFeatured(id, Boolean(body.featured))
  }

  @Get('shops')
  searchShops(@Query('q') q?: string, @Query('limit') limit?: string) {
    const take = Math.min(Number(limit ?? 30), 100)
    const term = q?.trim()
    return this.prisma.shop.findMany({
      where: term
        ? {
            OR: [
              { slug: { contains: term, mode: 'insensitive' } },
              { name: { contains: term, mode: 'insensitive' } },
            ],
          }
        : { status: { in: ['ACTIVE', 'DRAFT'] } },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        marketplace_featured: true,
      },
      orderBy: { name: 'asc' },
      take,
    })
  }

  // ── Catégories produit marketplace ───────────────────────────────────────────

  @Get('product-categories')
  listProductCategories() {
    return this.productCategories.listAdmin()
  }

  @Post('product-categories')
  createProductCategory(
    @Body() body: {
      name: string
      slug?: string
      icon?: string
      parent_id?: string
      sort_order?: number
      country_codes?: string[]
    },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Nom requis')
    return this.productCategories.create(body)
  }

  @Patch('product-categories/:id')
  updateProductCategory(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      icon?: string | null
      parent_id?: string | null
      sort_order?: number
      is_active?: boolean
      country_codes?: string[]
    },
  ) {
    return this.productCategories.update(id, body)
  }

  @Delete('product-categories/:id')
  deleteProductCategory(
    @Param('id') id: string,
    @Body() body: { transfer_to_id?: string },
  ) {
    return this.productCategories.delete(id, body.transfer_to_id)
  }

  // ── Référentiel géographique ─────────────────────────────────────────────────

  @Get('geo/cities')
  listGeoCities(@Query('country') country?: string) {
    return this.geo.listCitiesAdmin(country ?? 'CI')
  }

  @Get('geo/countries')
  listGeoCountries() {
    return this.geo.listCountriesAdmin()
  }

  @Patch('geo/countries/:code')
  updateGeoCountry(
    @Param('code') code: string,
    @Body() body: { name?: string; latitude?: number | null; longitude?: number | null; is_active?: boolean },
  ) {
    return this.geo.updateCountry(code, body)
  }

  @Post('geo/cities')
  createGeoCity(
    @Body() body: {
      country?: string
      name: string
      slug?: string
      is_default?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('Nom requis')
    return this.geo.createCity({
      country: body.country ?? 'CI',
      name: body.name,
      slug: body.slug,
      is_default: body.is_default,
      latitude: body.latitude,
      longitude: body.longitude,
    })
  }

  @Patch('geo/cities/:id')
  updateGeoCity(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      is_active?: boolean
      is_default?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    return this.geo.updateCity(id, body)
  }

  @Get('geo/cities/:cityId/communes')
  listGeoCommunes(@Param('cityId') cityId: string) {
    return this.geo.listCommunesAdmin(cityId)
  }

  @Post('geo/communes')
  createGeoCommune(@Body() body: {
    city_id: string
    name: string
    slug?: string
    latitude?: number | null
    longitude?: number | null
  }) {
    if (!body.city_id || !body.name?.trim()) {
      throw new BadRequestException('Ville et nom requis')
    }
    return this.geo.createCommune(body)
  }

  @Patch('geo/communes/:id')
  updateGeoCommune(
    @Param('id') id: string,
    @Body() body: {
      name?: string
      slug?: string
      is_active?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    return this.geo.updateCommune(id, body)
  }

  // ── Livraison (stats ops) ────────────────────────────────────────────────────

  @Get('courier-reviews')
  getCourierReviews(@Query('filter') filter?: string) {
    return this.courierReviews.listForAdmin(filter)
  }

  @Patch('courier-reviews/:id/moderate')
  moderateCourierReview(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'delete' },
  ) {
    return this.courierReviews.moderate(id, body.action)
  }

  @Get('delivery/disputes')
  getDeliveryDisputes(@Query('filter') filter?: string) {
    return this.deliveryDisputes.listForAdmin(filter)
  }

  @Get('delivery/jobs')
  getDeliveryJobs(@Query('filter') filter?: string) {
    return this.deliveryService.listJobsForAdmin(filter)
  }

  @Patch('delivery/jobs/:id/reassign')
  reassignDeliveryJob(
    @Param('id') id: string,
    @Body() body: { courier_profile_id: string },
  ) {
    return this.deliveryService.reassignJobToCourierProfile(id, body.courier_profile_id)
  }

  @Get('delivery/partners')
  getLogisticsPartners(@Query('filter') filter?: string) {
    return this.logisticsPartners.listForAdmin(filter)
  }

  @Patch('delivery/partners/:id/verify')
  verifyLogisticsPartner(
    @Param('id') id: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED' },
  ) {
    return this.logisticsPartners.verifyPartner(id, body.status)
  }

  @Post('logistics/payouts/:partnerId')
  createLogisticsPayout(
    @Param('partnerId') partnerId: string,
    @Body() body: {
      period_start: string
      period_end: string
      amount: number
      status?: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
      reference?: string
      note?: string
    },
  ) {
    return this.logisticsPartners.createPartnerPayout(partnerId, body)
  }

  @Get('logistics/payouts/:partnerId')
  listLogisticsPayouts(@Param('partnerId') partnerId: string) {
    return this.logisticsPartners.listPartnerPayouts(partnerId)
  }

  @Patch('delivery/disputes/:id')
  resolveDeliveryDispute(
    @Param('id') id: string,
    @Body() body: { status: DeliveryDisputeStatus; admin_note?: string },
  ) {
    return this.deliveryDisputes.resolve(id, body.status, body.admin_note)
  }

  @Get('couriers')
  getCouriers(
    @Query('filter') filter?: string,
    @Query('country') country?: string,
  ) {
    const countryCode = country?.toUpperCase()
    const where = {
      ...(filter === 'pending' ? { status: 'PENDING_REVIEW' as const } : {}),
      ...(filter === 'suspended' ? { status: 'SUSPENDED' as const } : {}),
      ...(filter === 'active' ? { status: 'ACTIVE' as const } : {}),
      ...(countryCode ? { country: countryCode } : {}),
    }
    return this.prisma.courierProfile.findMany({
      where,
      select: {
        id: true,
        kind: true,
        country: true,
        city: true,
        phone: true,
        vehicle: true,
        plate_number: true,
        status: true,
        is_online: true,
        rating_avg: true,
        rating_count: true,
        completed_jobs: true,
        created_at: true,
        user: { select: { id: true, email: true, full_name: true, phone: true } },
        service_zones: {
          where: { is_active: true },
          select: {
            all_communes: true,
            city: { select: { name: true } },
            communes: { select: { commune: { select: { name: true } } } },
          },
        },
        _count: { select: { jobs: true, reviews: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  @Patch('couriers/:id/status')
  async updateCourierStatus(
    @Param('id') id: string,
    @Body() body: { status: CourierStatus },
  ) {
    const allowed: CourierStatus[] = ['ACTIVE', 'SUSPENDED', 'PENDING_REVIEW']
    if (!allowed.includes(body.status)) {
      throw new BadRequestException('Statut non autorisé')
    }

    const profile = await this.prisma.courierProfile.findUnique({ where: { id } })
    if (!profile) throw new NotFoundException('Livreur introuvable')

    const updated = await this.prisma.courierProfile.update({
      where: { id },
      data: {
        status: body.status,
        is_online: body.status === 'ACTIVE' ? profile.is_online : false,
      },
      select: {
        id: true,
        status: true,
        is_online: true,
        user: { select: { email: true, full_name: true } },
      },
    })

    await this.audit.log({
      action: 'STATUS_CHANGE',
      entityType: 'courier_profile',
      entityId: id,
      payload: { from: profile.status, to: body.status },
    })

    return updated
  }

  @Get('delivery/stats')
  async getDeliveryStats(@Query('country') country?: string) {
    const countryCode = (country ?? 'CI').toUpperCase()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      jobsByStatus,
      activeCouriers,
      shopZonesActive,
      courierServiceZones,
      recentDeliveries,
      cities,
      zoneRules,
      couriersPendingKyc,
      deliveredWithEta,
      etaDelayedCount,
    ] = await Promise.all([
      this.prisma.deliveryJob.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: {
          created_at: { gte: since },
          order: { shop: { country: countryCode } },
        },
      }),
      this.prisma.courierProfile.count({
        where: { country: countryCode, status: 'ACTIVE' },
      }),
      this.prisma.shopDeliveryZone.count({
        where: { is_active: true, shop: { country: countryCode, is_active: true } },
      }),
      this.prisma.courierServiceZone.count({
        where: { is_active: true, courier: { country: countryCode, status: 'ACTIVE' } },
      }),
      this.prisma.deliveryJob.count({
        where: {
          status: 'DELIVERED',
          delivered_at: { gte: since },
          order: { shop: { country: countryCode } },
        },
      }),
      this.prisma.geoCity.findMany({
        where: { country: countryCode, is_active: true },
        select: {
          id: true,
          name: true,
          communes: { where: { is_active: true }, select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.shopDeliveryZoneRule.findMany({
        where: {
          zone: { is_active: true, shop: { country: countryCode, is_active: true } },
          city: { country: countryCode },
        },
        select: { city_id: true, all_communes: true, communes: { select: { commune_id: true } } },
      }),
      this.prisma.courierProfile.count({
        where: { country: countryCode, status: 'PENDING_REVIEW' },
      }),
      this.prisma.deliveryJob.findMany({
        where: {
          status: 'DELIVERED',
          delivered_at: { gte: since },
          order: { shop: { country: countryCode }, eta_initial_arrival_at: { not: null } },
        },
        select: {
          delivered_at: true,
          order: { select: { eta_initial_arrival_at: true } },
        },
        take: 500,
      }),
      this.prisma.order.count({
        where: {
          eta_delayed: true,
          updated_at: { gte: since },
          shop: { country: countryCode },
          delivery_type: 'DELIVERY',
        },
      }),
    ])

    const coveredCommuneIds = new Set<string>()
    for (const rule of zoneRules) {
      if (rule.all_communes) {
        const city = cities.find(c => c.id === rule.city_id)
        city?.communes.forEach(c => coveredCommuneIds.add(c.id))
      } else {
        rule.communes.forEach(zc => coveredCommuneIds.add(zc.commune_id))
      }
    }

    const uncoveredCommunes = cities.flatMap(city =>
      city.communes
        .filter(c => !coveredCommuneIds.has(c.id))
        .map(c => ({ city: city.name, commune: c.name, commune_id: c.id })),
    )

    const onTime = deliveredWithEta.filter(j =>
      j.delivered_at
      && j.order.eta_initial_arrival_at
      && j.delivered_at.getTime() <= j.order.eta_initial_arrival_at.getTime(),
    ).length
    const onTimePct = deliveredWithEta.length
      ? Math.round((onTime / deliveredWithEta.length) * 100)
      : null

    return {
      country: countryCode,
      period_days: 30,
      jobs_by_status: jobsByStatus.map(r => ({
        status: r.status,
        count: r._count._all,
      })),
      couriers_active: activeCouriers,
      zones_active: shopZonesActive,
      courier_service_zones: courierServiceZones,
      couriers_pending_kyc: couriersPendingKyc,
      deliveries_last_30d: recentDeliveries,
      on_time_pct: onTimePct,
      eta_delayed_count: etaDelayedCount,
      eta_sample_size: deliveredWithEta.length,
      uncovered_communes: uncoveredCommunes.slice(0, 100),
      uncovered_total: uncoveredCommunes.length,
      communes_total: cities.reduce((n, c) => n + c.communes.length, 0),
      communes_covered: coveredCommuneIds.size,
    }
  }

  // ── Pays (overview multi-pays) ───────────────────────────────────────────────

  @Get('countries/overview')
  async getCountriesOverview() {
    const supported = (process.env.SUPPORTED_COUNTRIES ?? 'CI,BF,SN')
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean)

    const countries = await Promise.all(
      supported.map(async code => {
        const [
          merchants,
          shops,
          orders,
          cities,
          communes,
          couriers,
          deliveryJobs,
          productCategories,
        ] = await Promise.all([
          this.prisma.merchant.count({
            where: { is_active: true, location: { country: code } },
          }),
          this.prisma.shop.count({ where: { country: code, is_active: true } }),
          this.prisma.order.count({ where: { shop: { country: code } } }),
          this.prisma.geoCity.count({ where: { country: code, is_active: true } }),
          this.prisma.geoCommune.count({
            where: { city: { country: code }, is_active: true },
          }),
          this.prisma.deliveryCourier.count({ where: { country: code, is_active: true } }),
          this.prisma.deliveryJob.count({ where: { courier: { country: code } } }),
          this.prisma.productCategoryCountry.count({ where: { country_code: code } }),
        ])

        return {
          code,
          active: true,
          merchants,
          shops,
          orders,
          cities,
          communes,
          couriers,
          delivery_jobs: deliveryJobs,
          product_categories: productCategories,
        }
      }),
    )

    return { countries }
  }

  // ── Modération (inbox) ───────────────────────────────────────────────────────

  @Get('moderation/summary')
  async getModerationSummary() {
    const [
      merchantsPending,
      reviewsPending,
      productReviewsPending,
      courierReviewsPending,
      complaintsOpen,
      couriersKyc,
      disputesOpen,
      shopsPending,
      productsPending,
      recentMerchants,
      recentReviews,
      recentComplaints,
      recentShops,
      recentProducts,
    ] = await Promise.all([
      this.prisma.merchant.count({ where: { verification_status: 'PENDING' } }),
      this.prisma.review.count({ where: { status: 'PENDING' } }),
      this.prisma.productReview.count({ where: { status: 'PENDING' } }),
      this.prisma.courierReview.count({ where: { status: 'PENDING' } }),
      this.prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.courierProfile.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.deliveryDispute.count({ where: { status: 'OPEN' } }),
      this.prisma.shop.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.merchant.findMany({
        where: { verification_status: 'PENDING' },
        take: 8,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, business_name: true, slug: true, created_at: true,
          category: { select: { name: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { status: 'PENDING' },
        take: 8,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, rating: true, created_at: true,
          merchant: { select: { business_name: true, slug: true } },
          user: { select: { email: true, full_name: true } },
        },
      }),
      this.prisma.complaint.findMany({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } },
        take: 8,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, reason: true, status: true, created_at: true,
          merchant: { select: { business_name: true, slug: true } },
        },
      }),
      this.prisma.shop.findMany({
        where: { status: 'PENDING_REVIEW' },
        take: 8,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true, name: true, slug: true, logo: true, city: true, updated_at: true,
          owner: { select: { email: true, full_name: true } },
        },
      }),
      this.prisma.product.findMany({
        where: { status: 'PENDING_REVIEW' },
        take: 8,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true, name: true, slug: true, image_url: true, price: true, updated_at: true,
          shop: { select: { name: true, slug: true } },
        },
      }),
    ])

    return {
      counts: {
        merchants_pending: merchantsPending,
        reviews_pending: reviewsPending,
        product_reviews_pending: productReviewsPending,
        courier_reviews_pending: courierReviewsPending,
        complaints_open: complaintsOpen,
        couriers_kyc: couriersKyc,
        disputes_open: disputesOpen,
        shops_pending: shopsPending,
        products_pending: productsPending,
      },
      recent: {
        merchants: recentMerchants,
        reviews: recentReviews,
        complaints: recentComplaints,
        shops: recentShops,
        products: recentProducts,
      },
    }
  }

  // ── Campagnes publicitaires ────────────────────────────────────────────────────

  @Get('ads/overview')
  async getAdsOverview() {
    const [placement_availability, campaigns_by_status] = await Promise.all([
      this.ads.getAllPlacementAvailability(),
      this.prisma.adCampaign.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ])
    return {
      placement_availability,
      campaigns_by_status: campaigns_by_status.map(r => ({
        status: r.status,
        count: r._count._all,
      })),
    }
  }

  @Get('ads/campaigns')
  listAdCampaigns(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = status as AdCampaignStatus | undefined
    const allowed: AdCampaignStatus[] = [
      'DRAFT', 'PENDING_PAYMENT', 'WAITLISTED', 'ACTIVE', 'EXPIRED', 'CANCELLED',
    ]
    const statusFilter = parsed && allowed.includes(parsed) ? parsed : undefined
    return this.ads.listCampaignsForAdmin(statusFilter, Number(limit ?? 50))
  }

  @Patch('ads/campaigns/:id/cancel')
  async cancelAdCampaign(@Param('id') id: string) {
    const result = await this.ads.adminCancelCampaign(id)
    await this.audit.log({
      action: 'MODERATION',
      entityType: 'AdCampaign',
      entityId: id,
      payload: { action: 'admin_cancel' },
    })
    return result
  }

  // ── Commandes ─────────────────────────────────────────────────────────────────

  @Get('orders')
  async listOrders(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit ?? 20), 100)
    const skip = (Math.max(Number(page ?? 1), 1) - 1) * take
    const allowed: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
    const statusFilter = status && allowed.includes(status as OrderStatus) ? { status: status as OrderStatus } : {}
    const searchFilter = q?.trim() ? {
      OR: [
        { id: { contains: q.trim(), mode: 'insensitive' as const } },
        { user: { email: { contains: q.trim(), mode: 'insensitive' as const } } },
        { user: { full_name: { contains: q.trim(), mode: 'insensitive' as const } } },
        { shop: { name: { contains: q.trim(), mode: 'insensitive' as const } } },
        { merchant: { business_name: { contains: q.trim(), mode: 'insensitive' as const } } },
      ],
    } : {}
    const where = { ...statusFilter, ...searchFilter }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take,
        skip,
        select: {
          id: true, status: true, total: true, currency: true,
          delivery_type: true, order_source: true, created_at: true,
          user: { select: { id: true, email: true, full_name: true } },
          shop: { select: { id: true, name: true, slug: true } },
          merchant: { select: { id: true, business_name: true, slug: true } },
          payment: { select: { id: true, status: true, reference: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ])
    return { orders, total, page: Number(page ?? 1), limit: take }
  }

  @Get('orders/:id')
  async getOrderDetail(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, full_name: true, phone: true } },
        shop: { select: { id: true, name: true, slug: true } },
        merchant: { select: { id: true, business_name: true, slug: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            menu_item: { select: { id: true, name: true } },
          },
        },
        payment: true,
        return_request: true,
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')

    const deliveryJob = await this.prisma.deliveryJob.findFirst({
      where: { order_id: id },
      include: {
        courier_profile: {
          select: {
            id: true, phone: true, vehicle: true, rating_avg: true,
            user: { select: { full_name: true, email: true } },
          },
        },
      },
    })

    return { ...order, delivery_job: deliveryJob ?? null }
  }

  // ── Tarifs réseau LaPlasse (PLATFORM_RIDER) ─────────────────────────────────

  @Get('platform-delivery-rates')
  listPlatformRates() {
    return this.deliveryZones.listPlatformRates()
  }

  @Post('platform-delivery-rates')
  createPlatformRate(@Body() dto: { city_id: string; commune_id?: string; vehicle?: 'MOTO' | 'TRICYCLE' | 'CAR' | 'VAN'; fee: number; min_order?: number }) {
    return this.deliveryZones.createPlatformRate(dto)
  }

  @Patch('platform-delivery-rates/:id')
  updatePlatformRate(@Param('id') id: string, @Body() dto: { fee?: number; min_order?: number; is_active?: boolean }) {
    return this.deliveryZones.updatePlatformRate(id, dto)
  }

  @Delete('platform-delivery-rates/:id')
  deletePlatformRate(@Param('id') id: string) {
    return this.deliveryZones.deletePlatformRate(id)
  }
}
