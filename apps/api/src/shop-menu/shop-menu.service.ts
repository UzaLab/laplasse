import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateMenuItemDto,
  CreateMenuSectionDto,
  MenuModifierGroupDto,
  UpdateMenuItemDto,
  UpdateMenuSectionDto,
  UpdateMenuSettingsDto,
} from './dto/shop-menu.dto'

type ModifierGroupWithOptions = {
  id: string
  name: string
  min_select: number
  max_select: number
  sort_order: number
  options: Array<{
    id: string
    name: string
    price_delta: number
    is_available: boolean
    sort_order: number
  }>
}

@Injectable()
export class ShopMenuService {
  constructor(private readonly prisma: PrismaService) {}

  private modifierInclude = {
    modifier_groups: {
      orderBy: [{ sort_order: 'asc' as const }, { name: 'asc' as const }],
      include: {
        options: {
          orderBy: [{ sort_order: 'asc' as const }, { name: 'asc' as const }],
        },
      },
    },
  }

  private async resolveMyMerchant(ownerId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: ownerId } : { owner_id: ownerId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  private formatModifierGroups(groups: ModifierGroupWithOptions[]) {
    return groups.map(group => ({
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
    prep_minutes: number | null
    sort_order: number
    modifier_groups?: ModifierGroupWithOptions[]
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
      prep_minutes: row.prep_minutes,
      sort_order: row.sort_order,
      modifier_groups: this.formatModifierGroups(row.modifier_groups ?? []),
    }
  }

  private normalizeModifierGroups(groups: MenuModifierGroupDto[] | undefined) {
    if (!groups?.length) return []
    return groups
      .map((group, groupIndex) => {
        const name = group.name?.trim()
        if (!name) return null
        const minSelect = Math.max(0, group.min_select ?? 0)
        const maxSelect = Math.max(1, group.max_select ?? 1)
        if (minSelect > maxSelect) {
          throw new BadRequestException(`Groupe « ${name} » : min_select > max_select`)
        }
        const options = (group.options ?? [])
          .map((option, optionIndex) => {
            const optionName = option.name?.trim()
            if (!optionName) return null
            return {
              name: optionName,
              price_delta: option.price_delta ?? 0,
              is_available: option.is_available ?? true,
              sort_order: option.sort_order ?? optionIndex,
            }
          })
          .filter((v): v is NonNullable<typeof v> => v != null)
        if (!options.length) return null
        return {
          name,
          min_select: minSelect,
          max_select: maxSelect,
          sort_order: group.sort_order ?? groupIndex,
          options,
        }
      })
      .filter((v): v is NonNullable<typeof v> => v != null)
  }

  private async replaceModifierGroups(menuItemId: string, groups: MenuModifierGroupDto[] | undefined) {
    if (groups === undefined) return
    const normalized = this.normalizeModifierGroups(groups)
    await this.prisma.menuModifierGroup.deleteMany({ where: { menu_item_id: menuItemId } })
    for (const group of normalized) {
      await this.prisma.menuModifierGroup.create({
        data: {
          menu_item_id: menuItemId,
          name: group.name,
          min_select: group.min_select,
          max_select: group.max_select,
          sort_order: group.sort_order,
          options: {
            create: group.options.map(option => ({
              name: option.name,
              price_delta: option.price_delta,
              is_available: option.is_available,
              sort_order: option.sort_order,
            })),
          },
        },
      })
    }
  }

  async listPublicByMerchantSlug(merchantSlug: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { slug: merchantSlug, is_active: true },
      select: {
        id: true,
        business_name: true,
        slug: true,
        food_prep_minutes: true,
      },
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
        include: this.modifierInclude,
      }),
    ])

    return {
      merchant: {
        id: merchant.id,
        name: merchant.business_name,
        slug: merchant.slug,
        food_prep_minutes: merchant.food_prep_minutes,
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
        include: this.modifierInclude,
      }),
    ])
    return {
      food_prep_minutes: merchant.food_prep_minutes,
      sections,
      items: items.map(i => this.formatItem(i)),
    }
  }

  async updateSettings(userId: string, dto: UpdateMenuSettingsDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    if (dto.food_prep_minutes === undefined) {
      return { food_prep_minutes: merchant.food_prep_minutes }
    }
    const updated = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { food_prep_minutes: dto.food_prep_minutes },
      select: { food_prep_minutes: true },
    })
    return updated
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
        prep_minutes: dto.prep_minutes ?? null,
      },
    })
    await this.replaceModifierGroups(row.id, dto.modifier_groups)
    const full = await this.prisma.menuItem.findUniqueOrThrow({
      where: { id: row.id },
      include: this.modifierInclude,
    })
    return this.formatItem(full)
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
    await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.section_id !== undefined ? { section_id: dto.section_id } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.image_url !== undefined ? { image_url: dto.image_url?.trim() || null } : {}),
        ...(dto.is_available !== undefined ? { is_available: dto.is_available } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
        ...(dto.prep_minutes !== undefined ? { prep_minutes: dto.prep_minutes } : {}),
      },
    })
    await this.replaceModifierGroups(itemId, dto.modifier_groups)
    const full = await this.prisma.menuItem.findUniqueOrThrow({
      where: { id: itemId },
      include: this.modifierInclude,
    })
    return this.formatItem(full)
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
