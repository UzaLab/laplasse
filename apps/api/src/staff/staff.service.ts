import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPlanLimits } from '../common/plan-limits'
import { getCategoryBookingConfig } from '../common/booking-config'
import { ServiceKind } from '../../generated/prisma/client'
import { CreateServiceDto, CreateStaffDto } from './dto/staff.dto'
import { CreateAvailabilityBlockDto, UpdateBookingSettingsDto } from './dto/offerings.dto'

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
      include: { category: { select: { slug: true } } },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  private assertStaffPlan(merchant: { subscription_plan: Parameters<typeof getPlanLimits>[0] }) {
    if (!getPlanLimits(merchant.subscription_plan).staffManagement) {
      throw new ForbiddenException('La gestion d\'équipe nécessite le plan Growth ou supérieur.')
    }
  }

  private assertOfferingsPlan(merchant: { subscription_plan: Parameters<typeof getPlanLimits>[0] }) {
    if (!getPlanLimits(merchant.subscription_plan).offeringsManagement) {
      throw new ForbiddenException('Les offres & disponibilités nécessitent le plan Premium.')
    }
  }

  private assertBookingPlan(merchant: { subscription_plan: Parameters<typeof getPlanLimits>[0] }) {
    if (!getPlanLimits(merchant.subscription_plan).booking) {
      throw new ForbiddenException('Les prestations nécessitent un plan avec réservations actives.')
    }
  }

  private defaultServiceKind(categorySlug: string): ServiceKind {
    const cfg = getCategoryBookingConfig(categorySlug)
    switch (cfg.type) {
      case 'TABLE': return 'TABLE_MENU'
      case 'ROOM': return 'ROOM_TYPE'
      case 'CONSULTATION': return 'CONSULTATION'
      default: return 'APPOINTMENT'
    }
  }

  private defaultDuration(kind: ServiceKind): number {
    if (kind === 'ROOM_TYPE') return 1440
    if (kind === 'TABLE_MENU') return 120
    return 60
  }

  // ── Booking settings ───────────────────────────────────────────────────────

  async getBookingSettings(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    return this.prisma.merchantBookingSettings.upsert({
      where: { merchant_id: merchant.id },
      create: { merchant_id: merchant.id },
      update: {},
    })
  }

  async updateBookingSettings(userId: string, dto: UpdateBookingSettingsDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    return this.prisma.merchantBookingSettings.upsert({
      where: { merchant_id: merchant.id },
      create: { merchant_id: merchant.id, ...dto },
      update: dto,
    })
  }

  // ── Availability blocks ────────────────────────────────────────────────────

  async listBlocks(userId: string, merchantId?: string, from?: string, to?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const where: Record<string, unknown> = { merchant_id: merchant.id }
    if (from && to) {
      where.AND = [
        { starts_at: { lt: new Date(to) } },
        { ends_at: { gt: new Date(from) } },
      ]
    }
    return this.prisma.merchantAvailabilityBlock.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      include: {
        staff: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    })
  }

  async createBlock(userId: string, dto: CreateAvailabilityBlockDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const startsAt = new Date(dto.starts_at)
    const endsAt = new Date(dto.ends_at)
    if (endsAt <= startsAt) {
      throw new BadRequestException('La fin doit être après le début')
    }
    if (dto.staff_id) {
      const staff = await this.prisma.merchantStaff.findFirst({
        where: { id: dto.staff_id, merchant_id: merchant.id },
      })
      if (!staff) throw new NotFoundException('Membre d\'équipe introuvable')
    }
    if (dto.service_id) {
      const service = await this.prisma.merchantService.findFirst({
        where: { id: dto.service_id, merchant_id: merchant.id },
      })
      if (!service) throw new NotFoundException('Prestation introuvable')
    }
    return this.prisma.merchantAvailabilityBlock.create({
      data: {
        merchant_id: merchant.id,
        starts_at: startsAt,
        ends_at: endsAt,
        all_day: dto.all_day ?? false,
        staff_id: dto.staff_id || null,
        service_id: dto.service_id || null,
        reason: dto.reason || null,
      },
      include: {
        staff: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    })
  }

  async deleteBlock(userId: string, blockId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const block = await this.prisma.merchantAvailabilityBlock.findFirst({
      where: { id: blockId, merchant_id: merchant.id },
    })
    if (!block) throw new NotFoundException('Blocage introuvable')
    await this.prisma.merchantAvailabilityBlock.delete({ where: { id: blockId } })
    return { deleted: true }
  }

  // ── Staff ──────────────────────────────────────────────────────────────────

  async listStaff(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertStaffPlan(merchant)
    return this.prisma.merchantStaff.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { name: 'asc' },
    })
  }

  async createStaff(userId: string, dto: CreateStaffDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertStaffPlan(merchant)
    return this.prisma.merchantStaff.create({
      data: { merchant_id: merchant.id, name: dto.name, role: dto.role },
    })
  }

  async updateStaff(
    userId: string,
    id: string,
    dto: Partial<CreateStaffDto & { is_active: boolean }>,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertStaffPlan(merchant)
    const row = await this.prisma.merchantStaff.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Membre introuvable')
    return this.prisma.merchantStaff.update({ where: { id }, data: dto })
  }

  async deleteStaff(userId: string, id: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertStaffPlan(merchant)
    const row = await this.prisma.merchantStaff.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Membre introuvable')
    await this.prisma.merchantStaff.delete({ where: { id } })
    return { success: true }
  }

  // ── Services / offres ──────────────────────────────────────────────────────

  async listServices(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    return this.prisma.merchantService.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { name: 'asc' },
      include: { staff: { select: { id: true, name: true } } },
    })
  }

  async createService(userId: string, dto: CreateServiceDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const kind = dto.service_kind ?? this.defaultServiceKind(merchant.category.slug)
    return this.prisma.merchantService.create({
      data: {
        merchant_id: merchant.id,
        name: dto.name,
        service_kind: kind,
        description: dto.description,
        duration_min: dto.duration_min ?? this.defaultDuration(kind),
        price: dto.price,
        capacity: dto.capacity,
        staff_id: dto.staff_id || null,
      },
      include: { staff: { select: { id: true, name: true } } },
    })
  }

  async updateService(
    userId: string,
    id: string,
    dto: Partial<CreateServiceDto & { is_active: boolean }>,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const row = await this.prisma.merchantService.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Prestation introuvable')
    return this.prisma.merchantService.update({
      where: { id },
      data: {
        ...dto,
        staff_id: dto.staff_id !== undefined ? (dto.staff_id || null) : undefined,
      },
      include: { staff: { select: { id: true, name: true } } },
    })
  }

  async deleteService(userId: string, id: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertOfferingsPlan(merchant)
    const row = await this.prisma.merchantService.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Prestation introuvable')
    await this.prisma.merchantService.delete({ where: { id } })
    return { success: true }
  }
}
