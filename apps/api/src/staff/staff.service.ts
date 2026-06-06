import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPlanLimits } from '../common/plan-limits'
import { CreateServiceDto, CreateStaffDto } from './dto/staff.dto'

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMerchant(userId: string, merchantId?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: merchantId ? { id: merchantId, owner_id: userId } : { owner_id: userId },
    })
    if (!merchant) throw new NotFoundException('Établissement introuvable')
    return merchant
  }

  private assertStaffPlan(merchant: { subscription_plan: Parameters<typeof getPlanLimits>[0] }) {
    if (!getPlanLimits(merchant.subscription_plan).staffManagement) {
      throw new ForbiddenException('La gestion d\'équipe nécessite le plan Growth ou supérieur.')
    }
  }

  private assertBookingPlan(merchant: { subscription_plan: Parameters<typeof getPlanLimits>[0] }) {
    if (!getPlanLimits(merchant.subscription_plan).booking) {
      throw new ForbiddenException('Les prestations nécessitent un plan avec réservations actives.')
    }
  }

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

  async listServices(userId: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertBookingPlan(merchant)
    return this.prisma.merchantService.findMany({
      where: { merchant_id: merchant.id },
      orderBy: { name: 'asc' },
    })
  }

  async createService(userId: string, dto: CreateServiceDto, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertBookingPlan(merchant)
    return this.prisma.merchantService.create({
      data: {
        merchant_id: merchant.id,
        name: dto.name,
        duration_min: dto.duration_min,
        price: dto.price,
      },
    })
  }

  async updateService(
    userId: string,
    id: string,
    dto: Partial<CreateServiceDto & { is_active: boolean }>,
    merchantId?: string,
  ) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertBookingPlan(merchant)
    const row = await this.prisma.merchantService.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Prestation introuvable')
    return this.prisma.merchantService.update({ where: { id }, data: dto })
  }

  async deleteService(userId: string, id: string, merchantId?: string) {
    const merchant = await this.resolveMerchant(userId, merchantId)
    this.assertBookingPlan(merchant)
    const row = await this.prisma.merchantService.findFirst({ where: { id, merchant_id: merchant.id } })
    if (!row) throw new NotFoundException('Prestation introuvable')
    await this.prisma.merchantService.delete({ where: { id } })
    return { success: true }
  }
}
