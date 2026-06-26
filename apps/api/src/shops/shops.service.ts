import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getHighestPlan, getPlanLimits, isWithinLimit } from '../common/plan-limits'
import { slugify } from '../marketplace/marketplace.util'
import { CreateShopDto, LinkShopMerchantDto, UpdateShopDto } from './dto/shops.dto'
import { SHOP_MINI_SELECT, shopAccessibleWhere } from './shop-access.util'
import { CrmService } from '../crm/crm.service'
import { StorageService } from '../storage/storage.service'
import { AdminNotificationsService } from '../notifications/admin-notifications.service'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const SHOP_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logo: true,
  cover_image: true,
  phone: true,
  whatsapp: true,
  email: true,
  country: true,
  city: true,
  district: true,
  address: true,
  city_id: true,
  commune_id: true,
  latitude: true,
  longitude: true,
  has_physical_location: true,
  merchant_id: true,
  status: true,
  is_active: true,
  enabled_modules: true,
  delivery_fulfilment_default: true,
  created_at: true,
  merchant: {
    select: {
      id: true,
      business_name: true,
      slug: true,
      logo: true,
      is_active: true,
      verification_status: true,
    },
  },
} as const

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crm: CrmService,
    private readonly storage: StorageService,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  private async assertShopLimit(userId: string) {
    const [shops, merchants] = await Promise.all([
      this.prisma.shop.count({ where: { owner_id: userId } }),
      this.prisma.merchant.findMany({
        where: { owner_id: userId },
        select: { subscription_plan: true },
      }),
    ])
    const plan = getHighestPlan(merchants)
    const limits = getPlanLimits(plan)
    if (!isWithinLimit(shops, limits.maxShops)) {
      throw new ForbiddenException(
        `Limite de ${limits.maxShops} boutique(s) atteinte pour votre plan. Passez au plan supérieur pour en créer davantage.`,
      )
    }
  }

  async create(userId: string, dto: CreateShopDto) {
    await this.assertShopLimit(userId)

    let merchantId: string | null = dto.merchant_id ?? null
    if (merchantId) {
      const merchant = await this.prisma.merchant.findFirst({
        where: { id: merchantId, owner_id: userId },
        include: { shop: { select: { id: true } } },
      })
      if (!merchant) throw new BadRequestException('Établissement introuvable')
      if (merchant.shop) {
        throw new BadRequestException('Cet établissement possède déjà une boutique liée')
      }
    }

    let baseSlug = slugify(dto.name)
    let slug = baseSlug
    let n = 1
    while (await this.prisma.shop.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const shop = await this.prisma.shop.create({
      data: {
        owner_id: userId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        phone: dto.phone ?? null,
        whatsapp: dto.whatsapp ?? null,
        email: dto.email ?? null,
        city: dto.city ?? 'Abidjan',
        district: dto.district ?? null,
        address: dto.address ?? null,
        city_id: dto.city_id ?? null,
        commune_id: dto.commune_id ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        has_physical_location: dto.latitude != null && dto.longitude != null,
        merchant_id: merchantId,
        status: 'DRAFT',
        is_active: true,
      },
      select: SHOP_PUBLIC_SELECT,
    })

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'MERCHANT' },
    })

    return shop
  }

  async listMine(userId: string) {
    return this.prisma.shop.findMany({
      where: shopAccessibleWhere(userId),
      orderBy: { created_at: 'asc' },
      select: SHOP_PUBLIC_SELECT,
    })
  }

  async listAccessibleMini(userId: string) {
    return this.prisma.shop.findMany({
      where: shopAccessibleWhere(userId),
      orderBy: { created_at: 'asc' },
      select: SHOP_MINI_SELECT,
    })
  }

  async getBySlug(slug: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { slug, is_active: true, status: 'ACTIVE' },
      select: SHOP_PUBLIC_SELECT,
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')
    return shop
  }

  /** Résolution par slug établissement (rétrocompatibilité /m/{slug}/boutique). */
  async getByMerchantSlug(merchantSlug: string) {
    const shop = await this.prisma.shop.findFirst({
      where: {
        is_active: true,
        status: 'ACTIVE',
        OR: [
          { slug: merchantSlug },
          { merchant: { slug: merchantSlug, is_active: true } },
        ],
      },
      select: SHOP_PUBLIC_SELECT,
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')
    return shop
  }

  async resolveOwnerShop(userId: string, shopId?: string) {
    const shop = await this.prisma.shop.findFirst({
      where: shopAccessibleWhere(userId, shopId),
      orderBy: { created_at: 'asc' },
      include: {
        merchant: { select: { id: true, subscription_plan: true } },
      },
    })
    if (!shop) {
      throw new NotFoundException(
        shopId
          ? 'Boutique introuvable'
          : 'Aucune boutique. Créez votre boutique pour vendre en ligne.',
      )
    }
    return shop
  }

  private async uniqueShopSlug(baseName: string, excludeShopId?: string): Promise<string> {
    let baseSlug = slugify(baseName)
    let slug = baseSlug
    let n = 1
    while (true) {
      const existing = await this.prisma.shop.findFirst({
        where: {
          slug,
          ...(excludeShopId ? { NOT: { id: excludeShopId } } : {}),
        },
        select: { id: true },
      })
      if (!existing) return slug
      slug = `${baseSlug}-${n++}`
    }
  }

  async update(userId: string, shopId: string, dto: UpdateShopDto) {
    const shop = await this.resolveOwnerShop(userId, shopId)

    let cityName = dto.city
    let districtName = dto.district
    if (dto.city_id) {
      const geoCity = await this.prisma.geoCity.findUnique({
        where: { id: dto.city_id },
        select: { id: true, name: true, country: true },
      })
      if (!geoCity) throw new BadRequestException('Ville invalide')
      cityName = geoCity.name
    }
    if (dto.commune_id) {
      const geoCommune = await this.prisma.geoCommune.findUnique({
        where: { id: dto.commune_id },
        select: { id: true, name: true, city_id: true },
      })
      if (!geoCommune) throw new BadRequestException('Commune invalide')
      if (dto.city_id && geoCommune.city_id !== dto.city_id) {
        throw new BadRequestException('La commune ne correspond pas à la ville sélectionnée')
      }
      districtName = geoCommune.name
    }

    const trimmedName = dto.name?.trim()
    let nextSlug: string | undefined
    if (trimmedName && trimmedName !== shop.name) {
      nextSlug = await this.uniqueShopSlug(trimmedName, shop.id)
    }

    let status = dto.status
    if (status !== undefined) {
      if (status === 'ACTIVE') status = 'PENDING_REVIEW'
      if (status === 'SUSPENDED') {
        throw new BadRequestException('Seul un administrateur peut suspendre une boutique')
      }
    }

    return this.prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: trimmedName,
        ...(nextSlug ? { slug: nextSlug } : {}),
        description: dto.description?.trim(),
        logo: dto.logo,
        cover_image: dto.cover_image,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        city: cityName,
        district: districtName,
        address: dto.address,
        city_id: dto.city_id,
        commune_id: dto.commune_id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        has_physical_location: dto.has_physical_location,
        status,
        enabled_modules: dto.enabled_modules,
        delivery_fulfilment_default: dto.delivery_fulfilment_default,
      },
      select: SHOP_PUBLIC_SELECT,
    }).then(updated => {
      if (updated.status === 'PENDING_REVIEW' && shop.status !== 'PENDING_REVIEW') {
        void this.adminNotifications.shopPendingReview(updated.id, updated.name)
      }
      return updated
    })
  }

  async linkMerchant(userId: string, shopId: string, dto: LinkShopMerchantDto) {
    const shop = await this.resolveOwnerShop(userId, shopId)

    if (!dto.merchant_id) {
      return this.prisma.shop.update({
        where: { id: shop.id },
        data: { merchant_id: null },
        select: SHOP_PUBLIC_SELECT,
      })
    }

    const merchant = await this.prisma.merchant.findFirst({
      where: { id: dto.merchant_id, owner_id: userId },
      include: { shop: { select: { id: true } } },
    })
    if (!merchant) throw new BadRequestException('Établissement introuvable')
    if (merchant.shop && merchant.shop.id !== shop.id) {
      throw new BadRequestException('Cet établissement est déjà lié à une autre boutique')
    }

    return this.prisma.shop.update({
      where: { id: shop.id },
      data: { merchant_id: merchant.id },
      select: SHOP_PUBLIC_SELECT,
    })
  }

  async withOwnerShop<T>(
    userId: string,
    shopId: string,
    fn: (shop: Awaited<ReturnType<ShopsService['resolveOwnerShop']>>) => Promise<T>,
  ) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    return fn(shop)
  }

  async getForOwner(userId: string, shopId: string) {
    await this.resolveOwnerShop(userId, shopId)
    return this.prisma.shop.findUnique({
      where: { id: shopId },
      select: SHOP_PUBLIC_SELECT,
    })
  }

  async getShopProductCategorySelection(userId: string, shopId: string, country = 'CI') {
    const shop = await this.resolveOwnerShop(userId, shopId)
    const code = country.toUpperCase().slice(0, 2)

    const [categories, enabledRows] = await Promise.all([
      this.prisma.productCategory.findMany({
        where: {
          is_active: true,
          OR: [
            { countries: { none: {} } },
            { countries: { some: { country_code: code } } },
          ],
        },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          parent_id: true,
          sort_order: true,
        },
      }),
      this.prisma.shopProductCategory.findMany({
        where: { shop_id: shop.id },
        select: { category_id: true },
      }),
    ])

    const enabledSet = new Set(enabledRows.map(r => r.category_id))
    return categories.map(c => ({
      ...c,
      enabled: enabledSet.has(c.id),
    }))
  }

  async setShopProductCategories(userId: string, shopId: string, categoryIds: string[]) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    const uniqueIds = [...new Set(categoryIds)]

    if (uniqueIds.length) {
      const valid = await this.prisma.productCategory.findMany({
        where: { id: { in: uniqueIds }, is_active: true },
        select: { id: true },
      })
      if (valid.length !== uniqueIds.length) {
        throw new BadRequestException('Une ou plusieurs catégories sont invalides')
      }
    }

    await this.prisma.$transaction([
      this.prisma.shopProductCategory.deleteMany({ where: { shop_id: shop.id } }),
      ...(uniqueIds.length
        ? [
            this.prisma.shopProductCategory.createMany({
              data: uniqueIds.map(category_id => ({ shop_id: shop.id, category_id })),
            }),
          ]
        : []),
    ])

    return { category_ids: uniqueIds }
  }

  async getEnabledProductCategoryIds(shopId: string) {
    const rows = await this.prisma.shopProductCategory.findMany({
      where: { shop_id: shopId, category: { is_active: true } },
      select: { category_id: true },
    })
    return rows.map(r => r.category_id)
  }

  async getCRM(userId: string, shopId: string) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    return this.crm.getShopCRM(shop.id, { includeMerchantSignals: true })
  }

  async getCRMDetail(userId: string, shopId: string, customerId: string) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    const detail = await this.crm.getCustomerDetail(customerId, {
      merchantId: shop.merchant_id ?? undefined,
      shopId: shop.id,
    })
    if (!detail) throw new NotFoundException('Contact introuvable')
    return detail
  }

  async uploadShopImage(userId: string, shopId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier requis')
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format accepté : JPEG, PNG ou WebP')
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Taille maximale : 5 Mo')
    }

    const shop = await this.resolveOwnerShop(userId, shopId)
    const url = await this.storage.uploadImage(
      file.buffer,
      file.mimetype,
      `shops/${shop.id}`,
      'general',
    )

    const order = await this.prisma.shopMedia.count({ where: { shop_id: shop.id } })
    const media = await this.prisma.shopMedia.create({
      data: {
        shop_id: shop.id,
        url,
        uploaded_by: userId,
        order,
      },
      select: { id: true, url: true, type: true, order: true, created_at: true },
    })

    return { url: media.url, id: media.id, media }
  }

  async listShopMedia(
    userId: string,
    shopId: string,
    opts?: { page?: number; limit?: number },
  ) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    const page = Math.max(1, opts?.page ?? 1)
    const limit = Math.min(48, Math.max(1, opts?.limit ?? 24))
    const skip = (page - 1) * limit

    const where = { shop_id: shop.id, type: 'IMAGE' as const }
    const [gallery, total] = await Promise.all([
      this.prisma.shopMedia.findMany({
        where,
        orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
        skip,
        take: limit,
        select: { id: true, url: true, type: true, order: true, created_at: true },
      }),
      this.prisma.shopMedia.count({ where }),
    ])

    return {
      logo: shop.logo,
      cover_image: shop.cover_image,
      gallery,
      pagination: {
        page,
        limit,
        total,
        has_more: skip + gallery.length < total,
      },
    }
  }

  async deleteShopMedia(userId: string, shopId: string, mediaId: string) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    const media = await this.prisma.shopMedia.findFirst({
      where: { id: mediaId, shop_id: shop.id },
    })
    if (!media) throw new NotFoundException('Image introuvable')
    await this.prisma.shopMedia.delete({ where: { id: mediaId } })
    return { deleted: true }
  }

  async assertProductCategoryAllowed(shopId: string, categoryId: string | null | undefined) {
    if (!categoryId) return
    const enabledIds = await this.getEnabledProductCategoryIds(shopId)
    if (!enabledIds.length) return
    if (!enabledIds.includes(categoryId)) {
      throw new BadRequestException('Catégorie non activée pour votre boutique')
    }
  }
}
