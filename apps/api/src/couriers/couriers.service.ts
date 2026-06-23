import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterCourierDto } from './dto/register-courier.dto'
import { UpsertCourierZoneDto } from './dto/upsert-courier-zone.dto'
import { UpdateCourierLocationDto } from './dto/update-courier-location.dto'
import { parseCoord } from '../geo/geo-coords.util'
import { DeliveryVehicle, Role } from '../../generated/prisma/client'
import { DeliveryOfferService } from '../delivery/delivery-offer.service'
import { DeliveryEtaService } from '../delivery/delivery-eta.service'
import { haversineDistanceKm } from '../delivery/delivery-geo.util'

const COURIER_PROFILE_SELECT = {
  id: true,
  user_id: true,
  kind: true,
  country: true,
  city: true,
  phone: true,
  vehicle: true,
  plate_number: true,
  status: true,
  is_online: true,
  current_latitude: true,
  current_longitude: true,
  last_location_at: true,
  rating_avg: true,
  rating_count: true,
  completed_jobs: true,
  created_at: true,
} as const

@Injectable()
export class CouriersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly offerService: DeliveryOfferService,
    private readonly etaService: DeliveryEtaService,
  ) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
      select: COURIER_PROFILE_SELECT,
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')
    return profile
  }

  async register(userId: string, dto: RegisterCourierDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, phone: true, full_name: true },
    })
    if (!user) throw new NotFoundException('Utilisateur introuvable')

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR') {
      throw new ForbiddenException('Ce type de compte ne peut pas devenir livreur')
    }

    const existing = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (existing) {
      throw new ConflictException('Vous avez déjà un profil livreur')
    }

    const country = (dto.country_code ?? 'CI').toUpperCase()
    const phone = dto.phone.trim()

    const profile = await this.prisma.$transaction(async (tx) => {
      const created = await tx.courierProfile.create({
        data: {
          user_id: userId,
          country,
          city: dto.city.trim(),
          phone,
          vehicle: dto.vehicle ?? DeliveryVehicle.MOTO,
          plate_number: dto.plate_number?.trim() || null,
          status: 'PENDING_REVIEW',
        },
        select: COURIER_PROFILE_SELECT,
      })

      if (user.role === Role.USER) {
        await tx.user.update({
          where: { id: userId },
          data: { role: Role.COURIER, phone: user.phone ?? phone },
        })
      } else if (!user.phone && phone) {
        await tx.user.update({
          where: { id: userId },
          data: { phone },
        })
      }

      return created
    })

    const updatedRole = user.role === Role.USER ? Role.COURIER : user.role

    return {
      profile,
      role: updatedRole,
    }
  }

  async setOnline(userId: string, isOnline: boolean) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')
    if (profile.status !== 'ACTIVE') {
      throw new BadRequestException('Votre profil doit être validé avant de passer en ligne')
    }

    const updated = await this.prisma.courierProfile.update({
      where: { user_id: userId },
      data: { is_online: isOnline },
      select: COURIER_PROFILE_SELECT,
    })

    if (isOnline) {
      void this.offerService.reofferPendingJobs().catch(() => {})
    }

    return updated
  }

  async updateLocation(userId: string, dto: UpdateCourierLocationDto) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
      select: COURIER_PROFILE_SELECT,
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')
    if (profile.status !== 'ACTIVE') {
      throw new BadRequestException('Profil non actif')
    }

    let latitude: number
    let longitude: number
    try {
      latitude = parseCoord(dto.latitude, 'lat') as number
      longitude = parseCoord(dto.longitude, 'lng') as number
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    if (
      profile.current_latitude != null
      && profile.current_longitude != null
      && haversineDistanceKm(profile.current_latitude, profile.current_longitude, latitude, longitude) < 0.1
    ) {
      return profile
    }

    const updated = await this.prisma.courierProfile.update({
      where: { user_id: userId },
      data: {
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_at: new Date(),
      },
      select: COURIER_PROFILE_SELECT,
    })

    void this.etaService.refreshOnCourierLocation(profile.id).catch(() => {})
    return updated
  }

  private async requireProfile(userId: string) {
    const profile = await this.prisma.courierProfile.findUnique({
      where: { user_id: userId },
    })
    if (!profile) throw new NotFoundException('Profil livreur introuvable')
    return profile
  }

  async listServiceZones(userId: string) {
    const profile = await this.requireProfile(userId)
    return this.prisma.courierServiceZone.findMany({
      where: { courier_id: profile.id },
      orderBy: { updated_at: 'desc' },
      include: {
        city: { select: { id: true, name: true, slug: true, country: true, latitude: true, longitude: true } },
        communes: {
          include: {
            commune: { select: { id: true, name: true, slug: true, latitude: true, longitude: true } },
          },
        },
      },
    })
  }

  async upsertServiceZone(userId: string, dto: UpsertCourierZoneDto) {
    const profile = await this.requireProfile(userId)

    const city = await this.prisma.geoCity.findFirst({
      where: { id: dto.city_id, country: profile.country, is_active: true },
      include: {
        communes: {
          where: { is_active: true },
          select: { id: true },
        },
      },
    })
    if (!city) throw new BadRequestException('Ville invalide pour votre pays')

    const validCommuneIds = new Set(city.communes.map(c => c.id))
    const communeIds = dto.all_communes
      ? []
      : (dto.commune_ids ?? []).filter(id => validCommuneIds.has(id))

    if (!dto.all_communes && communeIds.length === 0) {
      throw new BadRequestException('Sélectionnez au moins une commune valide')
    }

    return this.prisma.$transaction(async (tx) => {
      const zone = await tx.courierServiceZone.upsert({
        where: {
          courier_id_city_id: {
            courier_id: profile.id,
            city_id: city.id,
          },
        },
        create: {
          courier_id: profile.id,
          city_id: city.id,
          all_communes: dto.all_communes,
          is_active: true,
        },
        update: {
          all_communes: dto.all_communes,
          is_active: true,
        },
      })

      await tx.courierServiceZoneCommune.deleteMany({ where: { zone_id: zone.id } })

      if (!dto.all_communes && communeIds.length > 0) {
        await tx.courierServiceZoneCommune.createMany({
          data: communeIds.map(commune_id => ({ zone_id: zone.id, commune_id })),
          skipDuplicates: true,
        })
      }

      return tx.courierServiceZone.findUnique({
        where: { id: zone.id },
        include: {
          city: { select: { id: true, name: true, slug: true, country: true, latitude: true, longitude: true } },
          communes: {
            include: {
              commune: { select: { id: true, name: true, slug: true, latitude: true, longitude: true } },
            },
          },
        },
      })
    })
  }

  async deleteServiceZone(userId: string, zoneId: string) {
    const profile = await this.requireProfile(userId)
    const zone = await this.prisma.courierServiceZone.findFirst({
      where: { id: zoneId, courier_id: profile.id },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    await this.prisma.courierServiceZone.delete({ where: { id: zoneId } })
    return { ok: true }
  }
}
