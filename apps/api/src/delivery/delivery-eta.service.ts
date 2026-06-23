import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryJobStatus, DeliveryVehicle } from '../../generated/prisma/client'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { coordsFromCityName } from './delivery-gps.util'
import { haversineDistanceKm, travelMinutesForVehicle } from './delivery-geo.util'

export interface EtaSnapshot {
  prep_remaining_minutes: number
  travel_minutes: number
  eta_minutes: number
  eta_arrival_at: string | null
  eta_updated_at: string
}

const PICKUP_BUFFER_MIN = 3
const TRANSIT_BUFFER_MIN = 2
const DELAY_THRESHOLD_MS = 10 * 60_000
const ETA_WINDOW_CHANGE_MIN = 5

@Injectable()
export class DeliveryEtaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  prepRemainingMinutes(order: {
    prep_started_at: Date | null
    prep_eta_minutes: number | null
    status: string
  }): number {
    if (order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      return 0
    }
    if (!order.prep_started_at || order.prep_eta_minutes == null) return 0
    const elapsed = (Date.now() - order.prep_started_at.getTime()) / 60_000
    return Math.max(0, Math.ceil(order.prep_eta_minutes - elapsed))
  }

  async startPrepTimer(orderId: string, prepMinutes: number) {
    const now = new Date()
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        prep_started_at: now,
        prep_eta_minutes: prepMinutes,
        eta_updated_at: now,
      },
    })
    await this.refreshOrderEta(orderId)
  }

  async refreshOrderEta(orderId: string): Promise<EtaSnapshot | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: { select: { owner_id: true, name: true } },
        delivery_job: {
          include: {
            courier_profile: { select: { vehicle: true, current_latitude: true, current_longitude: true } },
          },
        },
      },
    })
    if (!order) return null

    const job = order.delivery_job
    const prepRemaining = this.prepRemainingMinutes(order)
    let travelMinutes = job?.eta_travel_minutes ?? 30

    if (job) {
      travelMinutes = this.computeJobTravelMinutes(job, order.delivery_latitude, order.delivery_longitude)
    }

    const etaMinutes = prepRemaining + travelMinutes
    const etaArrival = new Date(Date.now() + etaMinutes * 60_000)
    const now = new Date()
    const previousArrival = order.eta_arrival_at
    const initialArrival = order.eta_initial_arrival_at ?? etaArrival

    const updateData: {
      eta_arrival_at: Date
      eta_updated_at: Date
      eta_initial_arrival_at?: Date
      eta_delay_notified_at?: Date
      eta_delayed?: boolean
    } = {
      eta_arrival_at: etaArrival,
      eta_updated_at: now,
    }

    if (!order.eta_initial_arrival_at) {
      updateData.eta_initial_arrival_at = etaArrival
    }

    const isActive = !['DELIVERED', 'CANCELLED', 'REFUNDED', 'COMPLETED'].includes(order.status)
      && job?.status !== 'DELIVERED' && job?.status !== 'CANCELLED' && job?.status !== 'FAILED'

    if (
      isActive
      && !order.eta_delay_notified_at
      && etaArrival.getTime() > initialArrival.getTime() + DELAY_THRESHOLD_MS
    ) {
      updateData.eta_delay_notified_at = now
      updateData.eta_delayed = true
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    })

    if (job) {
      await this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: {
          eta_minutes: etaMinutes,
          eta_travel_minutes: travelMinutes,
          eta_arrival_at: etaArrival,
          eta_updated_at: now,
        },
      })
    }

    if (isActive) {
      void this.notifyEtaChanges({
        orderId,
        userId: order.user_id,
        shopOwnerId: order.shop?.owner_id,
        shopName: order.shop?.name,
        orderStatus: order.status,
        previousArrival,
        newArrival: etaArrival,
        initialArrival: order.eta_initial_arrival_at ?? etaArrival,
        prepRemaining,
        prepEtaMinutes: order.prep_eta_minutes,
        delayNotified: !!updateData.eta_delay_notified_at,
        delayAlreadyNotified: !!order.eta_delay_notified_at,
      }).catch(() => {})
    }

    return {
      prep_remaining_minutes: prepRemaining,
      travel_minutes: travelMinutes,
      eta_minutes: etaMinutes,
      eta_arrival_at: etaArrival.toISOString(),
      eta_updated_at: now.toISOString(),
    }
  }

  private async notifyEtaChanges(input: {
    orderId: string
    userId: string
    shopOwnerId?: string
    shopName?: string | null
    orderStatus: string
    previousArrival: Date | null
    newArrival: Date
    initialArrival: Date
    prepRemaining: number
    prepEtaMinutes: number | null
    delayNotified: boolean
    delayAlreadyNotified: boolean
  }) {
    const timeLabel = (d: Date) =>
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    if (input.delayNotified && !input.delayAlreadyNotified) {
      await this.notificationQueue.enqueuePush({
        userId: input.userId,
        type: 'delivery_eta_delay',
        title: 'Retard sur votre livraison',
        body: `Votre commande est retardée. Nouvelle arrivée estimée vers ${timeLabel(input.newArrival)}.`,
        data: {
          order_id: input.orderId,
          href: `/profile/orders/${input.orderId}`,
        },
      })
    }

    if (
      input.previousArrival
      && !input.delayNotified
      && Math.abs(input.newArrival.getTime() - input.previousArrival.getTime()) >= ETA_WINDOW_CHANGE_MIN * 60_000
    ) {
      const recent = await this.prisma.notification.findFirst({
        where: {
          user_id: input.userId,
          type: 'delivery_eta_updated',
          created_at: { gte: new Date(Date.now() - ETA_WINDOW_CHANGE_MIN * 60_000) },
          data: { path: ['order_id'], equals: input.orderId },
        },
        select: { id: true },
      })
      if (!recent) {
        await this.notificationQueue.enqueuePush({
          userId: input.userId,
          type: 'delivery_eta_updated',
          title: 'Mise à jour livraison',
          body: `Votre commande arrive vers ${timeLabel(input.newArrival)}.`,
          data: {
            order_id: input.orderId,
            href: `/profile/orders/${input.orderId}`,
          },
        })
      }
    }

    if (
      input.orderStatus === 'PREPARING'
      && input.prepRemaining === 0
      && input.prepEtaMinutes != null
      && input.shopOwnerId
    ) {
      const prepOverdue = await this.prisma.notification.findFirst({
        where: {
          type: 'order_prep_overdue',
          data: { path: ['order_id'], equals: input.orderId },
        },
        select: { id: true },
      })
      if (!prepOverdue) {
        await this.notificationQueue.enqueuePush({
          userId: input.shopOwnerId,
          type: 'order_prep_overdue',
          title: 'Préparation en retard',
          body: `Commande ${input.shopName ?? 'boutique'} — délai de préparation dépassé.`,
          data: {
            order_id: input.orderId,
            href: `/merchant/shop/orders/${input.orderId}`,
          },
        })
      }
    }
  }

  async refreshJobEta(jobId: string): Promise<EtaSnapshot | null> {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      select: { order_id: true },
    })
    if (!job) return null
    return this.refreshOrderEta(job.order_id)
  }

  async refreshOnCourierLocation(courierProfileId: string) {
    const activeJobs = await this.prisma.deliveryJob.findMany({
      where: {
        courier_profile_id: courierProfileId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
      },
      select: { id: true },
      take: 5,
    })
    await Promise.all(activeJobs.map(j => this.refreshJobEta(j.id)))
  }

  async getOrderEta(orderId: string, userId?: string): Promise<EtaSnapshot | null> {
    if (userId) {
      const order = await this.prisma.order.findFirst({
        where: { id: orderId, user_id: userId },
        select: { id: true },
      })
      if (!order) return null
    }
    return this.refreshOrderEta(orderId)
  }

  async getMerchantOrderEta(userId: string, orderId: string, shopId?: string): Promise<EtaSnapshot | null> {
    const shop = await this.prisma.shop.findFirst({
      where: shopId ? { id: shopId, owner_id: userId } : { owner_id: userId },
      select: { id: true },
    })
    if (!shop) return null
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, shop_id: shop.id },
      select: { id: true },
    })
    if (!order) return null
    return this.refreshOrderEta(orderId)
  }

  async getTrackEta(token: string): Promise<EtaSnapshot | null> {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { tracking_token: token },
      select: { order_id: true, status: true },
    })
    if (!job || job.status === 'DELIVERED' || job.status === 'CANCELLED' || job.status === 'FAILED') {
      return null
    }
    return this.refreshOrderEta(job.order_id)
  }

  private computeJobTravelMinutes(
    job: {
      status: DeliveryJobStatus
      pickup_latitude: number | null
      pickup_longitude: number | null
      dropoff_latitude: number | null
      dropoff_longitude: number | null
      courier_latitude: number | null
      courier_longitude: number | null
      courier_profile: {
        vehicle: DeliveryVehicle
        current_latitude: number | null
        current_longitude: number | null
      } | null
    },
    orderDropLat: number | null,
    orderDropLng: number | null,
  ): number {
    const vehicle = job.courier_profile?.vehicle ?? 'MOTO'
    const dropLat = job.dropoff_latitude ?? orderDropLat
    const dropLng = job.dropoff_longitude ?? orderDropLng
    const courierLat = job.courier_profile?.current_latitude ?? job.courier_latitude
    const courierLng = job.courier_profile?.current_longitude ?? job.courier_longitude
    const pickupLat = job.pickup_latitude
    const pickupLng = job.pickup_longitude

    if (job.status === 'PICKED_UP' || job.status === 'IN_TRANSIT') {
      if (courierLat != null && courierLng != null && dropLat != null && dropLng != null) {
        const km = haversineDistanceKm(courierLat, courierLng, dropLat, dropLng)
        return travelMinutesForVehicle(km, vehicle, TRANSIT_BUFFER_MIN)
      }
    }

    if (job.status === 'ASSIGNED' || job.status === 'PENDING') {
      if (courierLat != null && courierLng != null && pickupLat != null && pickupLng != null) {
        const toPickup = haversineDistanceKm(courierLat, courierLng, pickupLat, pickupLng)
        const pickupToDrop =
          dropLat != null && dropLng != null
            ? haversineDistanceKm(pickupLat, pickupLng, dropLat, dropLng)
            : 3
        return travelMinutesForVehicle(toPickup, vehicle, PICKUP_BUFFER_MIN)
          + travelMinutesForVehicle(pickupToDrop, vehicle, TRANSIT_BUFFER_MIN)
      }
    }

    if (pickupLat != null && pickupLng != null && dropLat != null && dropLng != null) {
      const km = haversineDistanceKm(pickupLat, pickupLng, dropLat, dropLng)
      return travelMinutesForVehicle(km, vehicle, PICKUP_BUFFER_MIN + TRANSIT_BUFFER_MIN)
    }

    return job.status === 'IN_TRANSIT' ? 15 : 30
  }

  resolvePickupCoords(input: {
    shopCity?: string | null
    shopCountry?: string | null
    merchantLat?: number | null
    merchantLng?: number | null
  }): { lat: number; lng: number } {
    if (input.merchantLat != null && input.merchantLng != null) {
      return { lat: input.merchantLat, lng: input.merchantLng }
    }
    return coordsFromCityName(input.shopCity, input.shopCountry)
  }
}
