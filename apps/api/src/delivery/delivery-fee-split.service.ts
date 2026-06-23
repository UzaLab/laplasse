import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryFulfilmentMode } from '../../generated/prisma/client'

/** Part livreur sur les frais de livraison (v1). */
export const COURIER_EARNING_RATE = 0.75

export interface DeliveryFeeSplitPayload {
  delivery_fee: number
  courier: number
  partner: number
  platform: number
  merchant: number
  computed_at: string
}

@Injectable()
export class DeliveryFeeSplitService {
  private readonly logger = new Logger(DeliveryFeeSplitService.name)

  constructor(private readonly prisma: PrismaService) {}

  compute(
    deliveryFee: number,
    fulfilmentMode: DeliveryFulfilmentMode,
    partnerCommissionRate = 0,
  ): DeliveryFeeSplitPayload {
    const fee = Math.max(0, deliveryFee)
    const courier = Math.round(fee * COURIER_EARNING_RATE)
    let partner = 0
    if (fulfilmentMode === 'LOGISTICS_PARTNER' && partnerCommissionRate > 0) {
      partner = Math.round(fee * partnerCommissionRate)
    }
    const platform = Math.max(0, fee - courier - partner)
    return {
      delivery_fee: fee,
      courier,
      partner,
      platform,
      merchant: 0,
      computed_at: new Date().toISOString(),
    }
  }

  async persistForJob(jobId: string): Promise<DeliveryFeeSplitPayload | null> {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: { select: { delivery_fee: true } },
        logistics_partner: { select: { commission_rate: true } },
      },
    })
    if (!job) return null

    const split = this.compute(
      job.order.delivery_fee ?? 0,
      job.fulfilment_mode,
      job.logistics_partner?.commission_rate ?? 0,
    )

    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: { delivery_fee_split: split as object },
    })

    this.logger.log(`Fee split job ${jobId}: courier=${split.courier} partner=${split.partner} platform=${split.platform}`)
    return split
  }
}
