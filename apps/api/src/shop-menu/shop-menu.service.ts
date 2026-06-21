import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateMenuItemDto,
  CreateMenuSectionDto,
  UpdateMenuItemDto,
  UpdateMenuSectionDto,
} from './dto/shop-menu.dto'

@Injectable()
export class ShopMenuService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMyMerchant(ownerId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: ownerId } : { owner_id: ownerId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  async listPublicByMerchantSlug(merchantSlug: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { slug: merchantSlug, is_active: true },
      select: { id: true, business_name: true, slug: true },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')

    const [sections, items] = await Promise.all([
      this.prisma.menuSection.findMany({
        where: { merchant_id: merchant.id, is_active: true },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { merchant_id: merchant.id, is_available: true },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
    ])

    return {
      merchant: {
        id: merchant.id,
        name: merchant.business_name,
        slug: merchant.slug,
      },
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        sort_order: s.sort_order,
        items: items
          .filter(i => i.section_id === s.id)
          .map(i => this.formatItem(i)),
      })),
      uncategorized: items
        .filter(i => !i.section_id)
        .map(i => this.formatItem(i)),
    }
  }

  /** @deprecated Utiliser listPublicByMerchantSlug */
  async listPublic(shopSlug: string) {
    return this.listPublicByMerchantSlug(shopSlug)
  }

  private formatItem(row: {
    id: string
    section_id: string | null
    name: string
    description: string | null
    price: number
    currency: string
    image_url: string | null
    is_available: boolean
    sort_order: number
  }) {
    return {
      id: row.id,
      section_id: row.section_id,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      image_url: row.image_url,
      is_available: row.is_available,
      sort_order: row.sort_order,
    }
  }

  async listMine(userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const [sections, items] = await Promise.all([
      this.prisma.menuSection.findMany({
        where: { merchant_id: merchant.id },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { merchant_id: merchant.id },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
    ])
    return {
      sections,
      items: items.map(i => this.formatItem(i)),
    }
  }

  async createSection(userId: string, dto: CreateMenuSectionDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    return this.prisma.menuSection.create({
      data: {
        merchant_id: merchant.id,
        name: dto.name.trim(),
        sort_order: dto.sort_order ?? 0,
      },
    })
  }

  async updateSection(
    userId: string,
    sectionId: string,
    dto: UpdateMenuSectionDto,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const existing = await this.prisma.menuSection.findFirst({
      where: { id: sectionId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Section introuvable')
    return this.prisma.menuSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
        ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
      },
    })
  }

  async deleteSection(userId: string, sectionId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const existing = await this.prisma.menuSection.findFirst({
      where: { id: sectionId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Section introuvable')
    await this.prisma.menuItem.updateMany({
      where: { section_id: sectionId },
      data: { section_id: null },
    })
    await this.prisma.menuSection.delete({ where: { id: sectionId } })
    return { success: true }
  }

  async createItem(userId: string, dto: CreateMenuItemDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    if (dto.section_id) {
      const section = await this.prisma.menuSection.findFirst({
        where: { id: dto.section_id, merchant_id: merchant.id },
      })
      if (!section) throw new NotFoundException('Section introuvable')
    }
    const row = await this.prisma.menuItem.create({
      data: {
        merchant_id: merchant.id,
        section_id: dto.section_id ?? null,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        price: dto.price,
        image_url: dto.image_url?.trim() || null,
        sort_order: dto.sort_order ?? 0,
      },
    })
    return this.formatItem(row)
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateMenuItemDto,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Plat introuvable')
    if (dto.section_id) {
      const section = await this.prisma.menuSection.findFirst({
        where: { id: dto.section_id, merchant_id: merchant.id },
      })
      if (!section) throw new NotFoundException('Section introuvable')
    }
    const row = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.section_id !== undefined ? { section_id: dto.section_id } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.image_url !== undefined ? { image_url: dto.image_url?.trim() || null } : {}),
        ...(dto.is_available !== undefined ? { is_available: dto.is_available } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
      },
    })
    return this.formatItem(row)
  }

  async deleteItem(userId: string, itemId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const existing = await this.prisma.menuItem.findFirst({
      where: { id: itemId, merchant_id: merchant.id },
    })
    if (!existing) throw new NotFoundException('Plat introuvable')
    await this.prisma.menuItem.delete({ where: { id: itemId } })
    return { success: true }
  }
}
