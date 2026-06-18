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
  merchant_id: true,
  status: true,
  is_active: true,
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
  constructor(private readonly prisma: PrismaService) {}

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
      where: { owner_id: userId },
      orderBy: { created_at: 'asc' },
      select: SHOP_PUBLIC_SELECT,
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
      where: shopId ? { id: shopId, owner_id: userId } : { owner_id: userId },
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

  async update(userId: string, shopId: string, dto: UpdateShopDto) {
    const shop = await this.resolveOwnerShop(userId, shopId)
    return this.prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        logo: dto.logo,
        cover_image: dto.cover_image,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        city: dto.city,
        district: dto.district,
        address: dto.address,
        status: dto.status,
      },
      select: SHOP_PUBLIC_SELECT,
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
}
