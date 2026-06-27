import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryEtaService } from '../delivery/delivery-eta.service'

/**
 * Phase 3b §3.4 — Fermeture automatique temporaire.
 * Si un restaurant a ≥ 3 commandes FOOD PENDING depuis plus de 10 minutes
 * sans réaction, on le bascule en pause automatique de 30 min.
 */
@Injectable()
export class FoodCronService {
  private readonly logger = new Logger(FoodCronService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly etaService: DeliveryEtaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoPauseSluggishMerchants() {
    const threshold = new Date(Date.now() - 10 * 60 * 1000) // 10 min ago

    // Find merchants with ≥ 3 PENDING food orders older than 10 min
    const rows = await this.prisma.order.groupBy({
      by: ['merchant_id'],
      where: {
        order_source: 'FOOD',
        status: 'PENDING',
        created_at: { lte: threshold },
        merchant_id: { not: null },
      },
      _count: { id: true },
      having: { id: { _count: { gte: 3 } } },
    })

    if (rows.length === 0) return

    const merchantIds = rows.map(r => r.merchant_id as string)

    // Only auto-pause merchants that are currently open (not already paused/closed)
    const openMerchants = await this.prisma.merchant.findMany({
      where: {
        id: { in: merchantIds },
        food_is_paused: false,
        is_active: true,
      },
      select: { id: true, business_name: true },
    })

    if (openMerchants.length === 0) return

    const pauseUntil = new Date(Date.now() + 30 * 60 * 1000)

    await this.prisma.merchant.updateMany({
      where: { id: { in: openMerchants.map(m => m.id) } },
      data: {
        food_is_paused: true,
        food_pause_until: pauseUntil,
      },
    })

    for (const m of openMerchants) {
      this.logger.warn(
        `Auto-pause: restaurant "${m.business_name}" (${m.id}) — 3+ commandes PENDING non traitées. Pause jusqu'à ${pauseUntil.toISOString()}`,
      )
    }
  }

  /**
   * Phase 4 §16 — Notification retard automatique >15 min.
   * Pour les commandes food OUT_FOR_DELIVERY depuis plus de 15 min sans être livrées,
   * déclencher une notification de retard au client via DeliveryEtaService.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyLateDeliveries() {
    const threshold = new Date(Date.now() - 15 * 60 * 1000) // 15 min ago

    // Jobs IN_TRANSIT depuis > 15 min, pas encore livrés, pas encore notifiés du retard
    const lateJobs = await this.prisma.deliveryJob.findMany({
      where: {
        status: 'IN_TRANSIT',
        picked_up_at: { lte: threshold },
        order: {
          order_source: 'FOOD',
          status: 'OUT_FOR_DELIVERY',
          eta_delay_notified_at: null,
        },
      },
      select: { id: true, order: { select: { id: true } } },
      take: 50,
    })

    for (const job of lateJobs) {
      await this.etaService.refreshOrderEta(job.order.id).catch(err => {
        this.logger.warn(`notifyLateDeliveries: ETA refresh failed for order ${job.order.id}: ${(err as Error).message}`)
      })
    }

    if (lateJobs.length > 0) {
      this.logger.log(`Phase4 retard: notifié ${lateJobs.length} commandes food en retard >15 min`)
    }
  }
}
