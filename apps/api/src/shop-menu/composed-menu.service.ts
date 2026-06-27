import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateComposedMenuDto, UpdateComposedMenuDto } from './dto/composed-menu.dto'

@Injectable()
export class ComposedMenuService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMyMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  async listMine(userId: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    return this.prisma.composedMenu.findMany({
      where: { merchant_id: merchant.id },
      include: { items: { orderBy: { sort_order: 'asc' } } },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    })
  }

  async listPublic(merchantId: string) {
    return this.prisma.composedMenu.findMany({
      where: { merchant_id: merchantId, is_available: true },
      include: { items: { orderBy: { sort_order: 'asc' } } },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    })
  }

  async create(userId: string, dto: CreateComposedMenuDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    return this.prisma.composedMenu.create({
      data: {
        merchant_id: merchant.id,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        image_url: dto.image_url ?? null,
        is_available: dto.is_available ?? true,
        sort_order: dto.sort_order ?? 0,
        items: dto.slots
          ? {
              create: dto.slots.map(s => ({
                label: s.label,
                sort_order: s.sort_order ?? 0,
                required: s.required ?? true,
                item_choices: s.item_choices,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { sort_order: 'asc' } } },
    })
  }

  async update(userId: string, id: string, dto: UpdateComposedMenuDto, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const menu = await this.prisma.composedMenu.findUnique({ where: { id } })
    if (!menu || menu.merchant_id !== merchant.id) throw new NotFoundException('Formule introuvable')

    // Delete + recreate slots if provided
    if (dto.slots !== undefined) {
      await this.prisma.composedMenuSlot.deleteMany({ where: { composed_menu_id: id } })
    }

    return this.prisma.composedMenu.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.is_available !== undefined && { is_available: dto.is_available }),
        ...(dto.sort_order !== undefined && { sort_order: dto.sort_order }),
        ...(dto.slots !== undefined && {
          items: {
            create: dto.slots.map(s => ({
              label: s.label,
              sort_order: s.sort_order ?? 0,
              required: s.required ?? true,
              item_choices: s.item_choices,
            })),
          },
        }),
      },
      include: { items: { orderBy: { sort_order: 'asc' } } },
    })
  }

  async remove(userId: string, id: string, merchantId?: string) {
    const merchant = await this.resolveMyMerchant(userId, merchantId)
    const menu = await this.prisma.composedMenu.findUnique({ where: { id } })
    if (!menu || menu.merchant_id !== merchant.id) throw new NotFoundException('Formule introuvable')
    await this.prisma.composedMenu.delete({ where: { id } })
    return { ok: true }
  }
}
