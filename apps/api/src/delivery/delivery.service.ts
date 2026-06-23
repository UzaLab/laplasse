import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import { DeliveryOfferService } from './delivery-offer.service'
import { DeliveryProofService } from './delivery-proof.service'
import { DeliveryEtaService } from './delivery-eta.service'
import { DeliveryFeeSplitService } from './delivery-fee-split.service'
import { LogisticsPartnersService } from '../logistics/logistics-partners.service'
import { orderStatusLabelFr } from '../common/order-status-labels'
import { coordsFromCityName, courierCoordsForStatus } from './delivery-gps.util'
import { DeliveryJobStatus, OrderStatus } from '../../generated/prisma/client'

const DELIVERY_JOB_MESSAGES: Partial<Record<DeliveryJobStatus, string>> = {
  ASSIGNED: 'Un livreur a été assigné à votre commande.',
  PICKED_UP: 'Votre commande a été récupérée par le livreur.',
  IN_TRANSIT: 'Votre commande est en route.',
  DELIVERED: 'Votre commande a été livrée.',
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
    private readonly offerService: DeliveryOfferService,
    private readonly proofService: DeliveryProofService,
    private readonly etaService: DeliveryEtaService,
    private readonly feeSplit: DeliveryFeeSplitService,
    @Inject(forwardRef(() => LogisticsPartnersService))
    private readonly logisticsPartners: LogisticsPartnersService,
  ) {}

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
        shop: { select: { address: true, district: true, city: true, country: true, name: true, delivery_fulfilment_default: true } },
        merchant: {
          select: {
            business_name: true,
            location: { select: { address: true, district: true, city: true, latitude: true, longitude: true } },
          },
        },
      },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (order.delivery_type !== 'DELIVERY') {
      throw new BadRequestException('Cette commande n\'est pas en livraison')
    }

    const fulfilmentMode = order.delivery_fulfilment_mode
      ?? order.shop?.delivery_fulfilment_default
      ?? 'PLATFORM_RIDER'

    const existing = await this.prisma.deliveryJob.findUnique({ where: { order_id: orderId } })
    if (existing) {
      if (existing.status === 'PENDING' && !existing.courier_profile_id) {
        if (fulfilmentMode === 'PLATFORM_RIDER' || fulfilmentMode === 'LOGISTICS_PARTNER') {
          if (fulfilmentMode === 'LOGISTICS_PARTNER') {
            const autoAssigned = await this.logisticsPartners.autoDispatchJobIfEnabled(existing.id).catch(() => false)
            if (!autoAssigned) {
              await this.offerService.startOffering(existing.id).catch(err => {
                this.logger.warn(`Re-offer failed for job ${existing.id}: ${(err as Error).message}`)
              })
            }
          } else {
            await this.offerService.startOffering(existing.id).catch(err => {
              this.logger.warn(`Re-offer failed for job ${existing.id}: ${(err as Error).message}`)
            })
          }
        }
      }
      return existing
    }

    let dropoffLat = order.delivery_latitude
    let dropoffLng = order.delivery_longitude
    if ((dropoffLat == null || dropoffLng == null) && order.delivery_commune_id) {
      const commune = await this.prisma.geoCommune.findUnique({
        where: { id: order.delivery_commune_id },
        select: { latitude: true, longitude: true, city: { select: { latitude: true, longitude: true, slug: true, country: true } } },
      })
      if (commune?.latitude != null && commune.longitude != null) {
        dropoffLat = commune.latitude
        dropoffLng = commune.longitude
      } else if (commune?.city) {
        const base = coordsFromCityName(commune.city.slug, commune.city.country)
        dropoffLat = base.lat
        dropoffLng = base.lng
      }
    }

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

    const pickupCoords = this.etaService.resolvePickupCoords({
      shopCity: order.shop?.city,
      shopCountry: order.shop?.country,
      merchantLat: order.merchant?.location?.latitude,
      merchantLng: order.merchant?.location?.longitude,
    })

    const job = await this.prisma.deliveryJob.create({
      data: {
        order_id: orderId,
        fulfilment_mode: fulfilmentMode,
        logistics_partner_id: order.logistics_partner_id ?? undefined,
        pickup_address: pickup || undefined,
        pickup_latitude: pickupCoords.lat,
        pickup_longitude: pickupCoords.lng,
        dropoff_address: order.delivery_address ?? undefined,
        dropoff_latitude: dropoffLat ?? undefined,
        dropoff_longitude: dropoffLng ?? undefined,
        eta_minutes: 45,
      },
    })

    void this.etaService.refreshOrderEta(orderId).catch(() => {})

    if (fulfilmentMode === 'PLATFORM_RIDER' || fulfilmentMode === 'LOGISTICS_PARTNER') {
      if (fulfilmentMode === 'LOGISTICS_PARTNER') {
        const autoAssigned = await this.logisticsPartners.autoDispatchJobIfEnabled(job.id).catch(() => false)
        if (!autoAssigned) {
          await this.offerService.startOffering(job.id).catch(err => {
            this.logger.warn(`Offer start failed for job ${job.id}: ${(err as Error).message}`)
          })
        }
      } else {
        await this.offerService.startOffering(job.id).catch(err => {
          this.logger.warn(`Offer start failed for job ${job.id}: ${(err as Error).message}`)
        })
      }
    }
    return job
  }

  async assignCourier(jobId: string, courierId: string) {
    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Course introuvable')

    const courier = await this.prisma.deliveryCourier.findFirst({
      where: { id: courierId, is_active: true },
    })
    if (!courier) throw new NotFoundException('Coursier introuvable')

    const base = coordsFromCityName(courier.city, courier.country)
    const coords = courierCoordsForStatus(base, 'ASSIGNED')

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        courier_id: courierId,
        status: 'ASSIGNED',
        assigned_at: new Date(),
        courier_latitude: coords.lat,
        courier_longitude: coords.lng,
      },
      include: {
        courier: true,
        order: { select: { id: true, status: true, user_id: true } },
      },
    })

    await this.notifyDeliveryUpdate(updated.order.user_id, updated.order.id, 'ASSIGNED')
    void this.etaService.refreshOrderEta(updated.order.id).catch(() => {})
    return updated
  }

  async assignCourierProfile(jobId: string, courierProfileId: string) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { id: true, user_id: true, status: true } } },
    })
    if (!job) throw new NotFoundException('Course introuvable')
    if (job.status !== 'PENDING' || job.courier_profile_id) {
      throw new BadRequestException('Course déjà assignée ou indisponible')
    }

    const profile = await this.prisma.courierProfile.findFirst({
      where: { id: courierProfileId, status: 'ACTIVE' },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')

    let lat: number
    let lng: number
    if (profile.current_latitude != null && profile.current_longitude != null) {
      lat = profile.current_latitude
      lng = profile.current_longitude
    } else {
      const base = coordsFromCityName(profile.city, profile.country)
      const coords = courierCoordsForStatus(base, 'ASSIGNED')
      lat = coords.lat
      lng = coords.lng
    }

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        courier_profile_id: courierProfileId,
        status: 'ASSIGNED',
        assigned_at: new Date(),
        courier_latitude: lat,
        courier_longitude: lng,
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            delivery_fee: true,
            delivery_address: true,
            delivery_district: true,
            customer_phone: true,
            created_at: true,
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                district: true,
                city: true,
                country: true,
              },
            },
            _count: { select: { items: true } },
          },
        },
      },
    })

    await this.notifyDeliveryUpdate(job.order.user_id, updated.order.id, 'ASSIGNED')
    void this.etaService.refreshOrderEta(job.order.id).catch(() => {})
    return updated
  }

  async updateJobStatusForProfile(
    jobId: string,
    courierProfileId: string,
    status: DeliveryJobStatus,
  ) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { id: true, user_id: true, status: true } } },
    })
    if (!job) throw new NotFoundException('Course introuvable')
    if (job.courier_profile_id !== courierProfileId) {
      throw new BadRequestException('Course non assignée à ce livreur')
    }

    const profile = await this.prisma.courierProfile.findUnique({
      where: { id: courierProfileId },
    })

    const now = new Date()
    const data: {
      status: DeliveryJobStatus
      picked_up_at?: Date
      delivered_at?: Date
      courier_latitude?: number
      courier_longitude?: number
    } = { status }

    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      data.picked_up_at = job.picked_up_at ?? now
    }
    if (status === 'DELIVERED') {
      data.delivered_at = now
    }

    if (profile?.current_latitude != null && profile.current_longitude != null) {
      data.courier_latitude = profile.current_latitude
      data.courier_longitude = profile.current_longitude
    } else {
      const base = coordsFromCityName(profile?.city, profile?.country)
      const coords = courierCoordsForStatus(base, status)
      data.courier_latitude = coords.lat
      data.courier_longitude = coords.lng
    }

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            delivery_fee: true,
            delivery_address: true,
            delivery_district: true,
            customer_phone: true,
            created_at: true,
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                district: true,
                city: true,
                country: true,
              },
            },
            _count: { select: { items: true } },
          },
        },
      },
    })

    let orderStatus: OrderStatus | null = null
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') orderStatus = 'OUT_FOR_DELIVERY'
    if (status === 'DELIVERED') orderStatus = 'DELIVERED'

    if (orderStatus && job.order.status !== orderStatus) {
      await this.prisma.order.update({
        where: { id: job.order_id },
        data: { status: orderStatus },
      })
    }

    if (orderStatus) {
      await this.notifyDeliveryUpdate(job.order.user_id, job.order_id, status, orderStatus)
      if (updated.order) {
        updated.order.status = orderStatus
      }
    } else {
      await this.notifyDeliveryUpdate(job.order.user_id, job.order_id, status)
    }

    if (status === 'DELIVERED' && profile) {
      await this.prisma.courierProfile.update({
        where: { id: profile.id },
        data: { completed_jobs: { increment: 1 } },
      })
      await this.feeSplit.persistForJob(jobId).catch(() => {})
    }

    if (status !== 'DELIVERED') {
      void this.etaService.refreshOrderEta(job.order_id).catch(() => {})
    }

    if (status === 'IN_TRANSIT') {
      await this.proofService.issueForJob(jobId)
    }

    return updated
  }

  async updateJobStatus(jobId: string, status: DeliveryJobStatus) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { id: true, user_id: true, status: true } } },
    })
    if (!job) throw new NotFoundException('Course introuvable')

    const now = new Date()
    const data: {
      status: DeliveryJobStatus
      picked_up_at?: Date
      delivered_at?: Date
      courier_latitude?: number
      courier_longitude?: number
    } = { status }

    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      data.picked_up_at = job.picked_up_at ?? now
    }
    if (status === 'DELIVERED') {
      data.delivered_at = now
    }

    const courier = job.courier_id
      ? await this.prisma.deliveryCourier.findUnique({ where: { id: job.courier_id } })
      : null
    const base = coordsFromCityName(courier?.city, courier?.country)
    const coords = courierCoordsForStatus(base, status)
    data.courier_latitude = coords.lat
    data.courier_longitude = coords.lng

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data,
      include: { courier: true },
    })

    let orderStatus: OrderStatus | null = null
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') orderStatus = 'OUT_FOR_DELIVERY'
    if (status === 'DELIVERED') orderStatus = 'DELIVERED'

    if (orderStatus && job.order.status !== orderStatus) {
      await this.prisma.order.update({
        where: { id: job.order_id },
        data: { status: orderStatus },
      })
    }

    if (orderStatus) {
      await this.notifyDeliveryUpdate(job.order.user_id, job.order_id, status, orderStatus)
    } else {
      await this.notifyDeliveryUpdate(job.order.user_id, job.order_id, status)
    }

    if (status === 'DELIVERED') {
      await this.feeSplit.persistForJob(jobId).catch(() => {})
    } else {
      void this.etaService.refreshOrderEta(job.order_id).catch(() => {})
    }

    return updated
  }

  private async notifyDeliveryUpdate(
    userId: string,
    orderId: string,
    jobStatus: DeliveryJobStatus,
    orderStatus?: OrderStatus,
  ) {
    const body =
      DELIVERY_JOB_MESSAGES[jobStatus]
      ?? (orderStatus
        ? `Votre commande est maintenant : ${orderStatusLabelFr(orderStatus)}.`
        : 'Mise à jour de votre livraison.')

    await this.notificationQueue.enqueuePush({
      userId,
      type: 'delivery_status',
      title: 'Suivi livraison',
      body,
      data: {
        order_id: orderId,
        delivery_status: jobStatus,
        order_status: orderStatus ?? null,
      },
    })
  }

  /** Notifie owner + staff partenaire qu'une course est à dispatcher manuellement. */
  private async notifyLogisticsPartnerStaff(partnerId: string, jobId: string, shopName: string) {
    const [staff, partner] = await Promise.all([
      this.prisma.logisticsPartnerStaff.findMany({
        where: { logistics_partner_id: partnerId },
        select: { user_id: true },
      }),
      this.prisma.logisticsPartner.findUnique({
        where: { id: partnerId },
        select: { owner_user_id: true },
      }),
    ])

    const userIds = new Set<string>()
    for (const s of staff) userIds.add(s.user_id)
    if (partner) userIds.add(partner.owner_user_id)

    await Promise.all(
      [...userIds].map(userId =>
        this.notificationQueue.enqueuePush({
          userId,
          type: 'logistics_dispatch',
          title: 'Nouvelle course à dispatcher',
          body: `${shopName} — assignez un livreur depuis le dispatch`,
          data: { job_id: jobId, logistics_partner_id: partnerId, href: '/logistics/dispatch' },
        }),
      ),
    )
  }

  async getTrackEta(token: string) {
    return this.etaService.getTrackEta(token)
  }

  async trackByToken(token: string) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { tracking_token: token },
      include: {
        courier: { select: { full_name: true, phone: true, vehicle: true, city: true, country: true } },
        courier_profile: {
          select: {
            phone: true,
            vehicle: true,
            rating_avg: true,
            rating_count: true,
            user: { select: { full_name: true } },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            delivery_address: true,
            delivery_latitude: true,
            delivery_longitude: true,
            shop: { select: { name: true } },
            created_at: true,
          },
        },
      },
    })
    if (!job) throw new NotFoundException('Suivi introuvable')

    const courier = job.courier ?? (job.courier_profile ? {
      full_name: job.courier_profile.user.full_name ?? 'Livreur LaPlasse',
      phone: job.courier_profile.phone,
      vehicle: job.courier_profile.vehicle,
      rating_avg: job.courier_profile.rating_avg,
      rating_count: job.courier_profile.rating_count,
    } : null)

    let lat = job.courier_latitude
    let lng = job.courier_longitude
    if (lat == null || lng == null) {
      const base = coordsFromCityName(job.courier?.city, job.courier?.country)
      const coords = courierCoordsForStatus(base, job.status)
      lat = coords.lat
      lng = coords.lng
    }

    let dropoffLat = job.dropoff_latitude ?? job.order.delivery_latitude
    let dropoffLng = job.dropoff_longitude ?? job.order.delivery_longitude

    const eta = await this.etaService.getTrackEta(token)

    return {
      tracking_token: job.tracking_token,
      status: job.status,
      eta_minutes: eta?.eta_minutes ?? job.eta_minutes,
      eta_arrival_at: eta?.eta_arrival_at ?? job.eta_arrival_at?.toISOString() ?? null,
      prep_remaining_minutes: eta?.prep_remaining_minutes ?? 0,
      travel_minutes: eta?.travel_minutes ?? job.eta_travel_minutes,
      pickup_address: job.pickup_address,
      dropoff_address: job.dropoff_address,
      dropoff_latitude: dropoffLat,
      dropoff_longitude: dropoffLng,
      assigned_at: job.assigned_at,
      picked_up_at: job.picked_up_at,
      delivered_at: job.delivered_at,
      updated_at: job.updated_at,
      courier_latitude: lat,
      courier_longitude: lng,
      courier,
      delivery_code: this.proofService.clientDeliveryCode(job),
      order: {
        ...job.order,
        status: job.status === 'DELIVERED' ? 'DELIVERED' : job.order.status,
      },
    }
  }

  async dispatchOrder(
    orderId: string,
    dto: {
      fulfilment_mode?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'
      courier_profile_id?: string
      logistics_partner_id?: string
      courier_id?: string
    } = {},
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { select: { id: true, name: true, delivery_fulfilment_default: true } } },
    })
    if (!order) throw new NotFoundException('Commande introuvable')
    if (order.delivery_type !== 'DELIVERY') {
      throw new BadRequestException('Commande non livrable')
    }

    const mode = dto.fulfilment_mode
      ?? order.delivery_fulfilment_mode
      ?? order.shop?.delivery_fulfilment_default
      ?? 'PLATFORM_RIDER'

    let partnerId = dto.logistics_partner_id ?? order.logistics_partner_id ?? null
    if (mode === 'LOGISTICS_PARTNER') {
      if (!partnerId && order.shop_id) {
        const contract = await this.prisma.deliveryPartnerContract.findFirst({
          where: { shop_id: order.shop_id, status: 'ACTIVE' },
          orderBy: { signed_at: 'desc' },
        })
        partnerId = contract?.logistics_partner_id ?? null
      }
      if (!partnerId) {
        throw new BadRequestException('Sélectionnez un partenaire logistique ou activez un contrat')
      }
      const active = await this.prisma.deliveryPartnerContract.findFirst({
        where: {
          shop_id: order.shop_id ?? undefined,
          logistics_partner_id: partnerId,
          status: 'ACTIVE',
        },
      })
      if (!active) throw new BadRequestException('Contrat partenaire non actif pour cette boutique')
    }

    if (mode === 'MERCHANT_OWN' && dto.courier_profile_id && order.shop_id) {
      const staff = await this.prisma.courierProfile.findFirst({
        where: {
          id: dto.courier_profile_id,
          shop_id: order.shop_id,
          kind: 'MERCHANT_STAFF',
          status: 'ACTIVE',
        },
      })
      if (!staff) throw new BadRequestException('Livreur interne invalide pour cette boutique')
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'OUT_FOR_DELIVERY',
        delivery_fulfilment_mode: mode,
        logistics_partner_id: mode === 'LOGISTICS_PARTNER' ? partnerId : null,
      },
    })

    let job = await this.prisma.deliveryJob.findUnique({ where: { order_id: orderId } })
    if (job) {
      job = await this.prisma.deliveryJob.update({
        where: { id: job.id },
        data: {
          fulfilment_mode: mode,
          logistics_partner_id: mode === 'LOGISTICS_PARTNER' ? partnerId : null,
        },
      })
    } else {
      job = await this.createJobForOrder(orderId)
    }

    if (dto.courier_id) {
      await this.assignCourier(job.id, dto.courier_id)
      await this.updateJobStatus(job.id, 'PICKED_UP')
    } else if (mode === 'MERCHANT_OWN' && dto.courier_profile_id) {
      await this.assignCourierProfile(job.id, dto.courier_profile_id)
      await this.notifyDeliveryUpdate(order.user_id, orderId, 'ASSIGNED', 'OUT_FOR_DELIVERY')
    } else if (mode === 'PLATFORM_RIDER' || mode === 'LOGISTICS_PARTNER') {
      if (mode === 'LOGISTICS_PARTNER') {
        const autoAssigned = await this.logisticsPartners.autoDispatchJobIfEnabled(job.id).catch(() => false)
        if (!autoAssigned) {
          await this.offerService.startOffering(job.id)
        }
      } else {
        await this.offerService.startOffering(job.id)
      }
      await this.notifyDeliveryUpdate(order.user_id, orderId, 'ASSIGNED', 'OUT_FOR_DELIVERY')
      if (mode === 'LOGISTICS_PARTNER' && partnerId) {
        await this.notifyLogisticsPartnerStaff(
          partnerId,
          job.id,
          order.shop?.name ?? 'Commerce',
        )
      }
    } else {
      await this.notifyDeliveryUpdate(order.user_id, orderId, 'ASSIGNED', 'OUT_FOR_DELIVERY')
    }

    return this.prisma.deliveryJob.findUnique({
      where: { id: job.id },
      include: {
        courier: true,
        courier_profile: {
          select: { phone: true, user: { select: { full_name: true } } },
        },
      },
    })
  }

  async listJobsForAdmin(filter?: string) {
    const activeStatuses: DeliveryJobStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
    const where = filter === 'active'
      ? { status: { in: activeStatuses } }
      : {}

    return this.prisma.deliveryJob.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            delivery_fulfilment_mode: true,
            shop: { select: { name: true } },
          },
        },
        courier_profile: {
          select: {
            id: true,
            phone: true,
            user: { select: { full_name: true, email: true } },
          },
        },
        offered_to: {
          select: {
            id: true,
            user: { select: { full_name: true } },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 60,
    })
  }

  async reassignJobToCourierProfile(jobId: string, courierProfileId: string) {
    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { id: true, user_id: true, status: true } } },
    })
    if (!job) throw new NotFoundException('Course introuvable')
    if (!['PENDING', 'ASSIGNED'].includes(job.status)) {
      throw new BadRequestException('Réassignation possible uniquement avant la collecte')
    }

    const profile = await this.prisma.courierProfile.findFirst({
      where: { id: courierProfileId, status: 'ACTIVE' },
    })
    if (!profile) throw new NotFoundException('Livreur introuvable ou inactif')

    const active = await this.prisma.deliveryJob.findFirst({
      where: {
        courier_profile_id: profile.id,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        id: { not: jobId },
      },
    })
    if (active) {
      throw new BadRequestException('Ce livreur a déjà une mission en cours')
    }

    const now = new Date()
    const base = coordsFromCityName(profile.city, profile.country)
    const coords = courierCoordsForStatus(base, 'ASSIGNED')

    const updated = await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        courier_profile_id: profile.id,
        status: 'ASSIGNED',
        assigned_at: now,
        offered_to_profile_id: null,
        offered_at: null,
        offer_expires_at: null,
        courier_latitude: profile.current_latitude ?? coords.lat,
        courier_longitude: profile.current_longitude ?? coords.lng,
      },
      include: {
        order: { select: { id: true, user_id: true } },
        courier_profile: {
          select: { phone: true, user: { select: { full_name: true } } },
        },
      },
    })

    if (job.order.status !== 'OUT_FOR_DELIVERY') {
      await this.prisma.order.update({
        where: { id: job.order_id },
        data: { status: 'OUT_FOR_DELIVERY' },
      })
    }

    await this.notifyDeliveryUpdate(
      job.order.user_id,
      job.order_id,
      'ASSIGNED',
      'OUT_FOR_DELIVERY',
    )

    void this.etaService.refreshOrderEta(job.order_id).catch(() => {})

    return updated
  }
}
