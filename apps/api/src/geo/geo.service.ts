import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../marketplace/marketplace.util'
import {
  legacyCoordsFromCitySlug,
  parseCoord,
  resolveGeoCoords,
} from './geo-coords.util'

const CITY_PUBLIC_SELECT = {
  id: true,
  country: true,
  name: true,
  slug: true,
  latitude: true,
  longitude: true,
  is_default: true,
} as const

const COMMUNE_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  city_id: true,
  latitude: true,
  longitude: true,
} as const

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async findCities(country = 'CI') {
    return this.prisma.geoCity.findMany({
      where: { country: country.toUpperCase(), is_active: true },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      select: CITY_PUBLIC_SELECT,
    })
  }

  async findCommunesByCitySlug(country: string, citySlug: string) {
    const city = await this.prisma.geoCity.findFirst({
      where: {
        country: country.toUpperCase(),
        slug: citySlug,
        is_active: true,
      },
      select: CITY_PUBLIC_SELECT,
    })

    if (!city) {
      throw new NotFoundException(`Ville "${citySlug}" introuvable`)
    }

    const communes = await this.prisma.geoCommune.findMany({
      where: { city_id: city.id, is_active: true },
      orderBy: { name: 'asc' },
      select: COMMUNE_PUBLIC_SELECT,
    })

    return { city, communes }
  }

  async findCountriesPublic() {
    return this.prisma.geoCountry.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        code: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    })
  }

  async listCountriesAdmin() {
    return this.prisma.geoCountry.findMany({
      orderBy: { name: 'asc' },
    })
  }

  async updateCountry(
    code: string,
    data: { name?: string; latitude?: number | null; longitude?: number | null; is_active?: boolean },
  ) {
    const country = await this.prisma.geoCountry.findUnique({
      where: { code: code.toUpperCase() },
    })
    if (!country) throw new NotFoundException('Pays introuvable')

    let latitude: number | null | undefined
    let longitude: number | null | undefined
    try {
      latitude = parseCoord(data.latitude, 'lat')
      longitude = parseCoord(data.longitude, 'lng')
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    return this.prisma.geoCountry.update({
      where: { code: country.code },
      data: {
        name: data.name?.trim(),
        latitude,
        longitude,
        is_active: data.is_active,
      },
    })
  }

  async listCitiesAdmin(country = 'CI') {
    return this.prisma.geoCity.findMany({
      where: { country: country.toUpperCase() },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { communes: true } } },
    })
  }

  async createCity(data: {
    country: string
    name: string
    slug?: string
    is_default?: boolean
    latitude?: number | null
    longitude?: number | null
  }) {
    const country = data.country.toUpperCase().slice(0, 2)
    const name = data.name.trim()
    if (!name) throw new BadRequestException('Nom de ville requis')
    const slug = data.slug?.trim() || slugify(name)

    let latitude: number | null | undefined
    let longitude: number | null | undefined
    try {
      latitude = parseCoord(data.latitude, 'lat')
      longitude = parseCoord(data.longitude, 'lng')
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    return this.prisma.geoCity.create({
      data: {
        country,
        name,
        slug,
        is_default: data.is_default ?? false,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    })
  }

  async updateCity(
    id: string,
    data: {
      name?: string
      slug?: string
      is_active?: boolean
      is_default?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    const city = await this.prisma.geoCity.findUnique({ where: { id } })
    if (!city) throw new NotFoundException('Ville introuvable')

    let latitude: number | null | undefined
    let longitude: number | null | undefined
    try {
      latitude = parseCoord(data.latitude, 'lat')
      longitude = parseCoord(data.longitude, 'lng')
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    return this.prisma.geoCity.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        is_active: data.is_active,
        is_default: data.is_default,
        latitude,
        longitude,
      },
    })
  }

  async listCommunesAdmin(cityId: string) {
    const city = await this.prisma.geoCity.findUnique({ where: { id: cityId } })
    if (!city) throw new NotFoundException('Ville introuvable')
    return this.prisma.geoCommune.findMany({
      where: { city_id: cityId },
      orderBy: { name: 'asc' },
    })
  }

  async createCommune(data: {
    city_id: string
    name: string
    slug?: string
    latitude?: number | null
    longitude?: number | null
  }) {
    const city = await this.prisma.geoCity.findUnique({ where: { id: data.city_id } })
    if (!city) throw new NotFoundException('Ville introuvable')
    const name = data.name.trim()
    if (!name) throw new BadRequestException('Nom de commune requis')
    const slug = data.slug?.trim() || slugify(name)

    let latitude: number | null | undefined
    let longitude: number | null | undefined
    try {
      latitude = parseCoord(data.latitude, 'lat')
      longitude = parseCoord(data.longitude, 'lng')
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    return this.prisma.geoCommune.create({
      data: {
        city_id: data.city_id,
        name,
        slug,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    })
  }

  async updateCommune(
    id: string,
    data: {
      name?: string
      slug?: string
      is_active?: boolean
      latitude?: number | null
      longitude?: number | null
    },
  ) {
    const commune = await this.prisma.geoCommune.findUnique({ where: { id } })
    if (!commune) throw new NotFoundException('Commune introuvable')

    let latitude: number | null | undefined
    let longitude: number | null | undefined
    try {
      latitude = parseCoord(data.latitude, 'lat')
      longitude = parseCoord(data.longitude, 'lng')
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : 'Coordonnées invalides')
    }

    return this.prisma.geoCommune.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        is_active: data.is_active,
        latitude,
        longitude,
      },
    })
  }

  /** Résout les coords d'une commune ou ville (DB → fallback legacy). */
  async resolveCoordsForCommune(communeId: string) {
    const commune = await this.prisma.geoCommune.findUnique({
      where: { id: communeId },
      include: { city: { select: { slug: true, country: true, latitude: true, longitude: true } } },
    })
    if (!commune) return null

    const country = await this.prisma.geoCountry.findUnique({
      where: { code: commune.city.country },
      select: { latitude: true, longitude: true },
    })

    const countryFallback = resolveGeoCoords({
      latitude: country?.latitude,
      longitude: country?.longitude,
      fallback: legacyCoordsFromCitySlug(null, commune.city.country),
    })!

    const cityFallback = resolveGeoCoords({
      latitude: commune.city.latitude,
      longitude: commune.city.longitude,
      fallback: legacyCoordsFromCitySlug(commune.city.slug, commune.city.country),
    })!

    return resolveGeoCoords({
      latitude: commune.latitude,
      longitude: commune.longitude,
      fallback: cityFallback ?? countryFallback,
    })
  }
}
