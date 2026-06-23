import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateUserAddressDto, UpdateUserAddressDto } from './dto/user-address.dto'
import { parseCoord } from '../geo/geo-coords.util'

const ADDRESS_INCLUDE = {
  city: { select: { id: true, name: true, slug: true, country: true, latitude: true, longitude: true } },
  commune: { select: { id: true, name: true, slug: true, latitude: true, longitude: true } },
} as const

const MAX_ADDRESSES = 10

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { user_id: userId },
      include: ADDRESS_INCLUDE,
      orderBy: [{ is_default: 'desc' }, { updated_at: 'desc' }],
    })
  }

  async create(userId: string, dto: CreateUserAddressDto) {
    await this.assertCommuneInCity(dto.city_id, dto.commune_id)

    const count = await this.prisma.userAddress.count({ where: { user_id: userId } })
    if (count >= MAX_ADDRESSES) {
      throw new BadRequestException(`Maximum ${MAX_ADDRESSES} adresses enregistrées`)
    }

    const makeDefault = dto.is_default ?? count === 0
    const coords = this.parseCoords(dto.latitude, dto.longitude)

    return this.prisma.$transaction(async tx => {
      if (makeDefault) {
        await tx.userAddress.updateMany({
          where: { user_id: userId, is_default: true },
          data: { is_default: false },
        })
      }

      return tx.userAddress.create({
        data: {
          user_id: userId,
          label: dto.label?.trim() || null,
          city_id: dto.city_id,
          commune_id: dto.commune_id,
          district: dto.district.trim(),
          address_detail: dto.address_detail?.trim() || null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          is_default: makeDefault,
        },
        include: ADDRESS_INCLUDE,
      })
    })
  }

  async update(userId: string, addressId: string, dto: UpdateUserAddressDto) {
    const existing = await this.findOwned(userId, addressId)

    const cityId = dto.city_id ?? existing.city_id
    const communeId = dto.commune_id ?? existing.commune_id
    if (dto.city_id || dto.commune_id) {
      await this.assertCommuneInCity(cityId, communeId)
    }

    const coords = dto.latitude !== undefined || dto.longitude !== undefined
      ? this.parseCoords(dto.latitude, dto.longitude)
      : undefined

    return this.prisma.$transaction(async tx => {
      if (dto.is_default) {
        await tx.userAddress.updateMany({
          where: { user_id: userId, is_default: true, id: { not: addressId } },
          data: { is_default: false },
        })
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined ? { label: dto.label?.trim() || null } : {}),
          ...(dto.city_id !== undefined ? { city_id: dto.city_id } : {}),
          ...(dto.commune_id !== undefined ? { commune_id: dto.commune_id } : {}),
          ...(dto.district !== undefined ? { district: dto.district.trim() } : {}),
          ...(dto.address_detail !== undefined
            ? { address_detail: dto.address_detail?.trim() || null }
            : {}),
          ...(dto.is_default !== undefined ? { is_default: dto.is_default } : {}),
          ...(coords !== undefined
            ? { latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }
            : {}),
        },
        include: ADDRESS_INCLUDE,
      })
    })
  }

  async remove(userId: string, addressId: string) {
    const existing = await this.findOwned(userId, addressId)

    await this.prisma.userAddress.delete({ where: { id: addressId } })

    if (existing.is_default) {
      const next = await this.prisma.userAddress.findFirst({
        where: { user_id: userId },
        orderBy: { updated_at: 'desc' },
      })
      if (next) {
        await this.prisma.userAddress.update({
          where: { id: next.id },
          data: { is_default: true },
        })
      }
    }

    return { success: true }
  }

  async setDefault(userId: string, addressId: string) {
    await this.findOwned(userId, addressId)

    return this.prisma.$transaction(async tx => {
      await tx.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      })
      return tx.userAddress.update({
        where: { id: addressId },
        data: { is_default: true },
        include: ADDRESS_INCLUDE,
      })
    })
  }

  private async findOwned(userId: string, addressId: string) {
    const row = await this.prisma.userAddress.findFirst({
      where: { id: addressId, user_id: userId },
    })
    if (!row) throw new NotFoundException('Adresse introuvable')
    return row
  }

  private async assertCommuneInCity(cityId: string, communeId: string) {
    const commune = await this.prisma.geoCommune.findFirst({
      where: { id: communeId, city_id: cityId, is_active: true },
    })
    if (!commune) {
      throw new BadRequestException('Commune invalide pour cette ville')
    }

    const city = await this.prisma.geoCity.findFirst({
      where: { id: cityId, is_active: true },
    })
    if (!city) {
      throw new BadRequestException('Ville invalide')
    }
  }

  private parseCoords(latitude?: number | null, longitude?: number | null) {
    if (latitude === undefined && longitude === undefined) return undefined
    try {
      const lat = parseCoord(latitude, 'lat')
      const lng = parseCoord(longitude, 'lng')
      if (lat == null || lng == null) return null
      return { latitude: lat, longitude: lng }
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }
  }
}
