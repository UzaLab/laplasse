import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../marketplace/marketplace.util'

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async findCities(country = 'CI') {
    return this.prisma.geoCity.findMany({
      where: { country: country.toUpperCase(), is_active: true },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        country: true,
        name: true,
        slug: true,
        is_default: true,
      },
    })
  }

  async findCommunesByCitySlug(country: string, citySlug: string) {
    const city = await this.prisma.geoCity.findFirst({
      where: {
        country: country.toUpperCase(),
        slug: citySlug,
        is_active: true,
      },
      select: { id: true, name: true, slug: true },
    })

    if (!city) {
      throw new NotFoundException(`Ville "${citySlug}" introuvable`)
    }

    const communes = await this.prisma.geoCommune.findMany({
      where: { city_id: city.id, is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        city_id: true,
      },
    })

    return { city, communes }
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
  }) {
    const country = data.country.toUpperCase().slice(0, 2)
    const name = data.name.trim()
    if (!name) throw new BadRequestException('Nom de ville requis')
    const slug = data.slug?.trim() || slugify(name)
    return this.prisma.geoCity.create({
      data: {
        country,
        name,
        slug,
        is_default: data.is_default ?? false,
      },
    })
  }

  async updateCity(
    id: string,
    data: { name?: string; slug?: string; is_active?: boolean; is_default?: boolean },
  ) {
    const city = await this.prisma.geoCity.findUnique({ where: { id } })
    if (!city) throw new NotFoundException('Ville introuvable')
    return this.prisma.geoCity.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        is_active: data.is_active,
        is_default: data.is_default,
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

  async createCommune(data: { city_id: string; name: string; slug?: string }) {
    const city = await this.prisma.geoCity.findUnique({ where: { id: data.city_id } })
    if (!city) throw new NotFoundException('Ville introuvable')
    const name = data.name.trim()
    if (!name) throw new BadRequestException('Nom de commune requis')
    const slug = data.slug?.trim() || slugify(name)
    return this.prisma.geoCommune.create({
      data: { city_id: data.city_id, name, slug },
    })
  }

  async updateCommune(id: string, data: { name?: string; slug?: string; is_active?: boolean }) {
    const commune = await this.prisma.geoCommune.findUnique({ where: { id } })
    if (!commune) throw new NotFoundException('Commune introuvable')
    return this.prisma.geoCommune.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        is_active: data.is_active,
      },
    })
  }
}
