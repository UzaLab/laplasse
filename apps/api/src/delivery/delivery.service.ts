import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryJobStatus, OrderStatus } from '../../generated/prisma/client'

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async listCouriers(country?: string, city?: string) {
    return this.prisma.deliveryCourier.findMany({
      where: {
        is_active: true,
        ...(country ? { country: country.toUpperCase() } : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      },
      orderBy: { full_name: 'asc' },
    })
  }

  async createJobForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: { select: { address: true, district: true, city: true, name: true } },
        merchant: {
          select: {
            business_name: true,
            location: { select: { address: true, district: true, city: true } },
          },
        },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (order.delivery_type !== 'DELIVERY') {
      throw new BadRequestException('Cette commande n\'est pas en livraison')
    }

    const existing = await this.prisma.deliveryJob.findUnique({ where: { order_id: orderId } })
    if (existing) return existing

    let pickup: string
    if (order.shop) {
      pickup = [order.shop.name, order.shop.address, order.shop.district, order.shop.city]
        .filter(Boolean)
        .join(', ')
    } else if (order.merchant) {
      const loc = order.merchant.location
      pickup = [
        order.merchant.business_name,
        loc?.address,
        loc?.district,
        loc?.city,
      ]
        .filter(Boolean)
        .join(', ')
    } else {
      pickup = ''
    }

    return this.prisma.deliveryJob.create({
      data: {
        order_id: orderId,
        pickup_address: pickup || undefined,
        dropoff_address: order.delivery_address ?? undefined,
        eta_minutes: 45,
      },
    })
  }

  async assignCourier(jobId: string, courierId: string) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Course introuvable')

    const courier = await this.prisma.deliveryCourier.findFirst({
      where: { id: courierId, is_active: true },
    })
    if (!courier) throw new NotFoundException('Coursier introuvable')

    return this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        courier_id: courierId,
        status: 'ASSIGNED',
        assigned_at: new Date(),
      },
      include: { courier: true, order: { select: { id: true, status: true } } },
    })
  }

  async updateJobStatus(jobId: string, status: DeliveryJobStatus) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: true },
    })
    if (!job) throw new NotFoundException('Course introuvable')

    const now = new Date()
    const data: {
      status: DeliveryJobStatus
      picked_up_at?: Date
      delivered_at?: Date
    } = { status }

    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      data.picked_up_at = job.picked_up_at ?? now
    }
    if (status === 'DELIVERED') {
      data.delivered_at = now
    }

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data,
      include: { courier: true },
    })

    let orderStatus: OrderStatus | null = null
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') orderStatus = 'OUT_FOR_DELIVERY'
    if (status === 'DELIVERED') orderStatus = 'DELIVERED'

    if (orderStatus) {
      await this.prisma.order.update({
        where: { id: job.order_id },
        data: { status: orderStatus },
      })
    }

    return updated
  }

  async trackByToken(token: string) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { tracking_token: token },
      include: {
        courier: { select: { full_name: true, phone: true, vehicle: true } },
        order: {
          select: {
            id: true,
            status: true,
            delivery_address: true,
            shop: { select: { name: true } },
            created_at: true,
          },
        },
      },
    })
    if (!job) throw new NotFoundException('Suivi introuvable')
    return {
      tracking_token: job.tracking_token,
      status: job.status,
      eta_minutes: job.eta_minutes,
      pickup_address: job.pickup_address,
      dropoff_address: job.dropoff_address,
      assigned_at: job.assigned_at,
      picked_up_at: job.picked_up_at,
      delivered_at: job.delivered_at,
      courier: job.courier,
      order: job.order,
    }
  }

  async dispatchOrder(orderId: string, courierId?: string) {
    const job = await this.createJobForOrder(orderId)
    if (courierId) {
      await this.assignCourier(job.id, courierId)
      await this.updateJobStatus(job.id, 'PICKED_UP')
    }
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: courierId ? 'OUT_FOR_DELIVERY' : 'OUT_FOR_DELIVERY' },
    })
    return this.prisma.deliveryJob.findUnique({
      where: { id: job.id },
      include: { courier: true },
    })
  }
}
