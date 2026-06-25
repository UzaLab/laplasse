import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { DeliveryService } from '../delivery/delivery.service'
import { DeliveryOfferService } from '../delivery/delivery-offer.service'
import { CourierWalletService } from './courier-wallet.service'
import { DeliveryProofService } from '../delivery/delivery-proof.service'
import { DeliveryFeeSplitService } from '../delivery/delivery-fee-split.service'
import { DeliveryEtaService } from '../delivery/delivery-eta.service'
import { StorageService } from '../storage/storage.service'
import { DeliveryJobStatus } from '../../generated/prisma/client'
import { COURIER_ADVANCE_STATUSES } from './dto/update-courier-job-status.dto'

const ACTIVE_JOB_STATUSES: DeliveryJobStatus[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']

const JOB_INCLUDE = {
  order: {
    select: {
      id: true,
      status: true,
      total: true,
      delivery_fee: true,
      delivery_address: true,
      delivery_district: true,
      delivery_city_id: true,
      delivery_commune_id: true,
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
} as const

@Injectable()
export class CourierJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
    private readonly offerService: DeliveryOfferService,
    private readonly wallet: CourierWalletService,
    private readonly proof: DeliveryProofService,
    private readonly storage: StorageService,
    private readonly feeSplit: DeliveryFeeSplitService,
    private readonly etaService: DeliveryEtaService,
  ) {}

  private async requireOnlineCourier(userId: string) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')
    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Profil livreur non actif')
    }
    return profile
  }

  private async orderMatchesZones(
    order: {
      delivery_city_id: string | null
      delivery_commune_id: string | null
      shop: { city: string | null; country: string | null } | null
    },
    profileId: string,
    profileCountry: string,
  ): Promise<boolean> {
    if (order.shop?.country && order.shop.country.toUpperCase() !== profileCountry.toUpperCase()) {
      return false
    }

    const zones = await this.prisma.courierServiceZone.findMany({
      where: { courier_id: profileId, is_active: true },
      include: {
        communes: { select: { commune_id: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
    })
    if (!zones.length) return false

    if (order.delivery_city_id) {
      for (const zone of zones) {
        if (zone.city_id !== order.delivery_city_id) continue
        if (zone.all_communes) return true
        if (
          order.delivery_commune_id
          && zone.communes.some(c => c.commune_id === order.delivery_commune_id)
        ) {
          return true
        }
      }
      return false
    }

    const shopCity = order.shop?.city?.toLowerCase().trim()
    if (!shopCity) return false
    return zones.some(z => {
      const name = z.city.name.toLowerCase()
      const slug = z.city.slug.toLowerCase()
      return shopCity.includes(name) || name.includes(shopCity) || shopCity === slug
    })
  }

  async listAvailable(userId: string) {
    const profile = await this.requireOnlineCourier(userId)
    if (!profile.is_online) {
      return []
    }
    if (profile.kind === 'MERCHANT_STAFF') {
      return []
    }

    await this.offerService.processExpiredOffers()

    const fulfilmentFilter =
      profile.kind === 'PARTNER_FLEET'
        ? { fulfilment_mode: 'LOGISTICS_PARTNER' as const, logistics_partner_id: profile.logistics_partner_id ?? undefined }
        : { fulfilment_mode: 'PLATFORM_RIDER' as const }

    const pending = await this.prisma.deliveryJob.findMany({
      where: {
        status: 'PENDING',
        courier_profile_id: null,
        ...fulfilmentFilter,
        order: {
          delivery_type: 'DELIVERY',
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
        },
      },
      include: JOB_INCLUDE,
      orderBy: { created_at: 'asc' },
      take: 30,
    })

    const matched = []
    for (const job of pending) {
      if (profile.kind === 'INDEPENDENT') {
        if (!(await this.orderMatchesZones(job.order, profile.id, profile.country))) continue
      } else if (profile.kind === 'PARTNER_FLEET') {
        if (job.logistics_partner_id !== profile.logistics_partner_id) continue
      }

      const hasActiveOffer = this.offerService.isOfferActive(job)
      if (job.offered_to_profile_id && job.offered_to_profile_id !== profile.id && hasActiveOffer) {
        continue
      }

      const rejected = await this.prisma.deliveryJobOfferRejection.findUnique({
        where: {
          job_id_courier_profile_id: {
            job_id: job.id,
            courier_profile_id: profile.id,
          },
        },
      })
      if (rejected) continue

      matched.push(this.serializeJob(job, profile.id))
    }
    return matched
  }

  async getActive(userId: string) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')

    const job = await this.prisma.deliveryJob.findFirst({
      where: {
        courier_profile_id: profile.id,
        status: { in: ACTIVE_JOB_STATUSES },
      },
      include: JOB_INCLUDE,
      orderBy: { assigned_at: 'desc' },
    })

    return job ? this.serializeJob(job, profile.id) : null
  }

  async listHistory(userId: string, limit = 25) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')

    const jobs = await this.prisma.deliveryJob.findMany({
      where: {
        courier_profile_id: profile.id,
        status: { in: ['DELIVERED', 'FAILED', 'CANCELLED'] },
      },
      include: JOB_INCLUDE,
      orderBy: { updated_at: 'desc' },
      take: Math.min(limit, 50),
    })

    return jobs.map(j => this.serializeJob(j, profile.id))
  }

  async accept(userId: string, jobId: string) {
    const profile = await this.requireOnlineCourier(userId)
    if (!profile.is_online) {
      throw new BadRequestException('Passez en ligne pour accepter une mission')
    }

    const active = await this.prisma.deliveryJob.findFirst({
      where: {
        courier_profile_id: profile.id,
        status: { in: ACTIVE_JOB_STATUSES },
      },
    })
    if (active) {
      throw new BadRequestException('Terminez votre mission en cours avant d\'en accepter une nouvelle')
    }

    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { include: { shop: { select: { city: true, country: true } } } } },
    })
    if (!job) throw new NotFoundException('Mission introuvable')
    if (job.status !== 'PENDING' || job.courier_profile_id) {
      throw new BadRequestException('Cette mission n\'est plus disponible')
    }

    if (!this.offerService.canCourierAccept(job, profile.id)) {
      throw new BadRequestException('Cette offre a expiré ou est destinée à un autre livreur')
    }

    if (profile.kind === 'INDEPENDENT') {
      const matches = await this.orderMatchesZones(job.order, profile.id, profile.country)
      if (!matches) {
        throw new ForbiddenException('Cette mission est hors de vos zones de service')
      }
    } else if (profile.kind === 'PARTNER_FLEET') {
      if (job.fulfilment_mode !== 'LOGISTICS_PARTNER' || job.logistics_partner_id !== profile.logistics_partner_id) {
        throw new ForbiddenException('Cette mission n\'est pas disponible pour votre flotte')
      }
    } else {
      throw new ForbiddenException('Votre profil ne peut pas accepter cette mission')
    }

    await this.offerService.clearOfferOnAccept(jobId)
    const updated = await this.delivery.assignCourierProfile(jobId, profile.id)
    void this.etaService.refreshOrderEta(updated.order.id).catch(() => {})
    return this.serializeJob(updated, profile.id)
  }

  async reject(userId: string, jobId: string) {
    await this.requireOnlineCourier(userId)
    await this.offerService.rejectOffer(userId, jobId)
    return { ok: true }
  }

  async advanceStatus(userId: string, jobId: string, status: DeliveryJobStatus, proofOtp?: string) {
    if (!COURIER_ADVANCE_STATUSES.includes(status)) {
      throw new BadRequestException('Transition de statut non autorisée')
    }

    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')

    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Mission introuvable')
    if (job.courier_profile_id !== profile.id) {
      throw new ForbiddenException('Cette mission ne vous est pas assignée')
    }

    this.assertValidTransition(job.status, status)

    if (status === 'DELIVERED') {
      await this.proof.verifyAndConfirm(jobId, proofOtp)
    }

    const updated = await this.delivery.updateJobStatusForProfile(jobId, profile.id, status)

    if (status === 'DELIVERED') {
      await this.wallet.creditForDeliveredJob(jobId, profile.id)
      await this.feeSplit.persistForJob(jobId).catch(() => {})
    } else {
      void this.etaService.refreshOrderEta(updated.order.id).catch(() => {})
    }

    return this.serializeJob(updated, profile.id)
  }

  async uploadProofPhoto(userId: string, jobId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('Fichier requis')

    const profile = await this.prisma.courierProfile.findUnique({ where: { user_id: userId } })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')

    const job = await this.prisma.deliveryJob.findUnique({ where: { id: jobId } })
    if (!job) throw new NotFoundException('Mission introuvable')
    if (job.courier_profile_id !== profile.id) {
      throw new ForbiddenException('Cette mission ne vous est pas assignée')
    }
    if (!['IN_TRANSIT', 'DELIVERED'].includes(job.status)) {
      throw new BadRequestException('Photo disponible en route ou après livraison')
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Format image non supporté')
    }

    const url = await this.storage.uploadImage(
      file.buffer,
      file.mimetype,
      `delivery-proof/${profile.id}`,
      'proof',
    )
    await this.prisma.deliveryJob.update({
      where: { id: jobId },
      data: { proof_photo_url: url },
    })

    return { proof_photo_url: url }
  }

  private assertValidTransition(current: DeliveryJobStatus, next: DeliveryJobStatus) {
    const allowed: Partial<Record<DeliveryJobStatus, DeliveryJobStatus[]>> = {
      ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED'],
    }
    const ok = allowed[current]?.includes(next)
    if (!ok) {
      throw new BadRequestException(`Impossible de passer de ${current} à ${next}`)
    }
  }

  private serializeJob(
    job: {
      id: string
      status: DeliveryJobStatus
      tracking_token: string
      pickup_address: string | null
      dropoff_address: string | null
      eta_minutes: number | null
      assigned_at: Date | null
      picked_up_at: Date | null
      delivered_at: Date | null
      created_at: Date
      proof_photo_url?: string | null
      offered_to_profile_id?: string | null
      offer_expires_at?: Date | null
      order: {
        id: string
        status: string
        total: number
        delivery_fee: number
        delivery_address: string | null
        delivery_district: string | null
        customer_phone: string | null
        created_at: Date
        shop: {
          id: string
          name: string
          slug: string
          address: string | null
          district: string | null
          city: string | null
          country: string
        } | null
        _count: { items: number }
      }
    },
    profileId: string,
  ) {
    const offeredToMe = job.offered_to_profile_id === profileId
    const offerActive = offeredToMe && this.offerService.isOfferActive({
      offered_to_profile_id: job.offered_to_profile_id ?? null,
      offer_expires_at: job.offer_expires_at ?? null,
    })
    const secondsLeft = offerActive && job.offer_expires_at
      ? Math.max(0, Math.ceil((job.offer_expires_at.getTime() - Date.now()) / 1000))
      : null

    return {
      id: job.id,
      status: job.status,
      tracking_token: job.tracking_token,
      pickup_address: job.pickup_address,
      dropoff_address: job.dropoff_address,
      eta_minutes: job.eta_minutes,
      assigned_at: job.assigned_at,
      picked_up_at: job.picked_up_at,
      delivered_at: job.delivered_at,
      created_at: job.created_at,
      proof_photo_url: job.proof_photo_url ?? null,
      offered_to_me: offeredToMe,
      offer_expires_at: job.offer_expires_at,
      offer_seconds_left: secondsLeft,
      order: {
        id: job.order.id,
        status: job.order.status,
        total: job.order.total,
        delivery_fee: job.order.delivery_fee,
        delivery_address: job.order.delivery_address,
        delivery_district: job.order.delivery_district,
        customer_phone: job.order.customer_phone,
        item_count: job.order._count.items,
        shop_name: job.order.shop?.name ?? 'Commerce',
        shop_address: job.order.shop
          ? [job.order.shop.address, job.order.shop.district, job.order.shop.city].filter(Boolean).join(', ')
          : null,
        created_at: job.order.created_at,
      },
    }
  }
}
