import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryDisputeStatus } from '../../generated/prisma/client'

@Injectable()
export class DeliveryDisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForOrder(
    userId: string,
    orderId: string,
    input: { reason: string; description?: string },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, user_id: userId },
      include: { delivery_job: true, delivery_dispute: { select: { id: true } } },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (order.delivery_type !== 'DELIVERY') {
      throw new BadRequestException('Litige livraison réservé aux commandes livrées à domicile')
    }
    if (!order.delivery_job || order.delivery_job.status !== 'DELIVERED') {
      throw new BadRequestException('La livraison doit être terminée pour ouvrir un litige')
    }
    if (order.delivery_dispute) {
      throw new ForbiddenException('Un litige existe déjà pour cette commande')
    }

    const reason = input.reason.trim()
    if (!reason) throw new BadRequestException('Motif requis')

    return this.prisma.deliveryDispute.create({
      data: {
        order_id: orderId,
        job_id: order.delivery_job.id,
        user_id: userId,
        reason,
        description: input.description?.trim() || null,
        status: 'OPEN',
      },
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        created_at: true,
      },
    })
  }

  listForAdmin(filter?: string) {
    const where = filter === 'open' ? { status: 'OPEN' as const } : {}
    return this.prisma.deliveryDispute.findMany({
      where,
      include: {
        user: { select: { id: true, full_name: true, email: true } },
        order: {
          select: {
            id: true,
            total: true,
            shop: { select: { name: true } },
            delivery_job: { select: { proof_photo_url: true, proof_confirmed_at: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  }

  async resolve(id: string, status: DeliveryDisputeStatus, adminNote?: string) {
    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      throw new BadRequestException('Statut invalide')
    }
    return this.prisma.deliveryDispute.update({
      where: { id },
      data: {
        status,
        admin_note: adminNote?.trim() || null,
        resolved_at: new Date(),
      },
      select: { id: true, status: true, admin_note: true, resolved_at: true },
    })
  }
}
