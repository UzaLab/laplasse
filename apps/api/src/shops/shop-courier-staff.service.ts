import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CourierKind } from '../../generated/prisma/client'

@Injectable()
export class ShopCourierStaffService {
  constructor(private readonly prisma: PrismaService) {}

  async listForShop(shopId: string) {
    return this.prisma.courierProfile.findMany({
      where: { shop_id: shopId, kind: 'MERCHANT_STAFF' },
      select: {
        id: true,
        phone: true,
        vehicle: true,
        status: true,
        is_online: true,
        rating_avg: true,
        completed_jobs: true,
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async listForMerchant(merchantId: string) {
    return this.prisma.courierProfile.findMany({
      where: { merchant_id: merchantId, kind: 'MERCHANT_STAFF' },
      select: {
        id: true,
        phone: true,
        vehicle: true,
        status: true,
        is_online: true,
        rating_avg: true,
        completed_jobs: true,
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async linkByEmail(shopId: string, email: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, merchant_id: true, name: true },
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')

    const normalized = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { courier_profile: true },
    })
    if (!user) {
      throw new NotFoundException('Aucun compte avec cet email — le livreur doit d\'abord s\'inscrire sur /courier/signup')
    }
    if (!user.courier_profile) {
      throw new BadRequestException('Ce compte n\'a pas encore de profil livreur')
    }
    if (user.courier_profile.status !== 'ACTIVE') {
      throw new BadRequestException('Le profil livreur doit être validé (KYC) avant d\'être rattaché')
    }
    if (user.courier_profile.kind === 'PARTNER_FLEET') {
      throw new BadRequestException('Ce livreur est rattaché à une structure logistique')
    }
    if (
      user.courier_profile.kind === 'MERCHANT_STAFF'
      && user.courier_profile.shop_id
      && user.courier_profile.shop_id !== shopId
    ) {
      throw new ConflictException('Ce livreur est déjà rattaché à une autre boutique')
    }

    return this.prisma.courierProfile.update({
      where: { id: user.courier_profile.id },
      data: {
        kind: 'MERCHANT_STAFF' as CourierKind,
        shop_id: shopId,
        merchant_id: shop.merchant_id,
        logistics_partner_id: null,
      },
      select: {
        id: true,
        phone: true,
        vehicle: true,
        status: true,
        is_online: true,
        user: { select: { full_name: true, email: true } },
      },
    })
  }

  async getFleetInviteLink(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { slug: true, name: true },
    })
    if (!shop) throw new NotFoundException('Boutique introuvable')
    const baseUrl = (process.env.WEB_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    return {
      slug: shop.slug,
      shop_name: shop.name,
      url: `${baseUrl}/courier/signup?ref=shop:${shop.slug}`,
    }
  }

  async getFleetInviteLinkForMerchant(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { slug: true, business_name: true },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    const baseUrl = (process.env.WEB_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    return {
      slug: merchant.slug,
      shop_name: merchant.business_name,
      url: `${baseUrl}/courier/signup?ref=merchant:${merchant.slug}`,
    }
  }

  async unlink(shopId: string, profileId: string) {
    const profile = await this.prisma.courierProfile.findFirst({
      where: { id: profileId, shop_id: shopId, kind: 'MERCHANT_STAFF' },
    })
    if (!profile) throw new NotFoundException('Livreur introuvable')

    await this.prisma.courierProfile.update({
      where: { id: profileId },
      data: {
        kind: 'INDEPENDENT',
        shop_id: null,
        merchant_id: null,
      },
    })
    return { ok: true }
  }

  async linkByEmailForMerchant(merchantId: string, email: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, business_name: true },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    const normalized = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      include: { courier_profile: true },
    })
    if (!user) {
      throw new NotFoundException('Aucun compte avec cet email — le livreur doit d\'abord s\'inscrire sur /courier/signup')
    }
    if (!user.courier_profile) {
      throw new BadRequestException('Ce compte n\'a pas encore de profil livreur')
    }
    if (user.courier_profile.status !== 'ACTIVE') {
      throw new BadRequestException('Le profil livreur doit être validé (KYC) avant d\'être rattaché')
    }
    if (user.courier_profile.kind === 'PARTNER_FLEET') {
      throw new BadRequestException('Ce livreur est rattaché à une structure logistique')
    }
    if (
      user.courier_profile.kind === 'MERCHANT_STAFF'
      && user.courier_profile.merchant_id
      && user.courier_profile.merchant_id !== merchantId
    ) {
      throw new ConflictException('Ce livreur est déjà rattaché à un autre établissement')
    }

    return this.prisma.courierProfile.update({
      where: { id: user.courier_profile.id },
      data: {
        kind: 'MERCHANT_STAFF' as CourierKind,
        shop_id: null,
        merchant_id: merchantId,
        logistics_partner_id: null,
      },
      select: {
        id: true,
        phone: true,
        vehicle: true,
        status: true,
        is_online: true,
        user: { select: { full_name: true, email: true } },
      },
    })
  }

  async unlinkForMerchant(merchantId: string, profileId: string) {
    const profile = await this.prisma.courierProfile.findFirst({
      where: { id: profileId, merchant_id: merchantId, kind: 'MERCHANT_STAFF' },
    })
    if (!profile) throw new NotFoundException('Livreur introuvable')

    await this.prisma.courierProfile.update({
      where: { id: profileId },
      data: {
        kind: 'INDEPENDENT',
        shop_id: null,
        merchant_id: null,
      },
    })
    return { ok: true }
  }
}
