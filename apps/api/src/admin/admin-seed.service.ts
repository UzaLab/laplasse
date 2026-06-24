import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SearchService } from '../search/search.service'
import { GeoService } from '../geo/geo.service'

function communeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

@Injectable()
export class AdminSeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
    private readonly geo: GeoService,
  ) {}

  private async ensureMultipaysGeo() {
    const specs: Array<{
      country: string
      name: string
      slug: string
      is_default?: boolean
      communes: string[]
    }> = [
      {
        country: 'BF',
        name: 'Ouagadougou',
        slug: 'ouagadougou',
        is_default: true,
        communes: ['Centre', 'Cissin', 'Dassasgho', 'Gounghin', 'Koulouba', 'Ouaga 2000', "Patte d'Oie", 'Zogona'],
      },
      {
        country: 'BF',
        name: 'Bobo-Dioulasso',
        slug: 'bobo-dioulasso',
        communes: ['Centre', 'Dafra', 'Koko', 'Sarfalao'],
      },
      {
        country: 'SN',
        name: 'Dakar',
        slug: 'dakar',
        is_default: true,
        communes: ['Plateau', 'Almadies', 'Médina', 'Yoff', 'Parcelles Assainies'],
      },
    ]

    const cityIds: Record<string, string> = {}

    for (const spec of specs) {
      let city = await this.prisma.geoCity.findFirst({
        where: { country: spec.country, slug: spec.slug },
      })
      if (!city) {
        city = await this.geo.createCity({
          country: spec.country,
          name: spec.name,
          slug: spec.slug,
          is_default: spec.is_default,
        })
      }
      cityIds[spec.slug] = city.id

      for (const communeName of spec.communes) {
        const slug = communeSlug(communeName)
        const existing = await this.prisma.geoCommune.findFirst({
          where: { city_id: city.id, slug },
        })
        if (!existing) {
          await this.geo.createCommune({ city_id: city.id, name: communeName, slug })
        }
      }
    }

    return cityIds
  }

  /** Seed marchands BF/SN + verticals (idempotent). Option country = BF | SN | ALL */
  async seedMultipays(country: 'BF' | 'SN' | 'ALL' = 'ALL') {
    const cityIds = await this.ensureMultipaysGeo()
    const ouaga = await this.prisma.geoCity.findUnique({ where: { id: cityIds.ouagadougou } })
    const dakar = await this.prisma.geoCity.findUnique({ where: { id: cityIds.dakar } })

    if (!ouaga && (country === 'BF' || country === 'ALL')) {
      throw new Error('Ville Ouagadougou introuvable après ensureMultipaysGeo')
    }
    if (!dakar && (country === 'SN' || country === 'ALL')) {
      throw new Error('Ville Dakar introuvable après ensureMultipaysGeo')
    }

    const categories = await this.prisma.category.findMany({
      select: { id: true, slug: true },
    })
    const cat = Object.fromEntries(categories.map(c => [c.slug, c])) as Record<string, { id: string; slug: string }>

    const { seedMultipays } = await import('../../prisma/seed-multipays')
    const { seedVerticals } = await import('../../prisma/seed-verticals')

    const testUser = await this.prisma.user.findFirst({
      where: { email: 'ksouary@gmail.com' },
      select: { id: true },
    })

    let merchantMap: Record<string, string> = {}

    if (country === 'ALL' || country === 'BF' || country === 'SN') {
      merchantMap = await seedMultipays({
        prisma: this.prisma,
        cat,
        ouagaCityId: ouaga?.id ?? '',
        dakarCityId: dakar?.id ?? '',
      })
    }

    if (testUser) {
      await seedVerticals({
        prisma: this.prisma,
        merchantMap,
        testUserId: testUser.id,
      })
    }

    const slugsToSync =
      country === 'BF'
        ? Object.keys(merchantMap).filter(s => merchantMap[s] && ['maquis-ouaga-centre', 'hotel-siloam-ouaga', 'boutique-wax-ouaga', 'pharmacie-du-faso'].includes(s))
        : country === 'SN'
          ? Object.keys(merchantMap).filter(s => ['restaurant-thieb-dakar', 'cafe-almadies', 'spa-teranga-dakar', 'burger-fast-dakar'].includes(s))
          : Object.keys(merchantMap)

    for (const slug of slugsToSync) {
      const id = merchantMap[slug]
      if (id) await this.search.syncMerchant(id).catch(() => {})
    }

    return {
      ok: true,
      country,
      merchants_seeded: slugsToSync.length,
      slugs: slugsToSync,
      meilisearch: 'synced',
    }
  }

  /** Catalogue e-commerce produit (catégories + sous-catégories, idempotent). */
  async seedProductCategories() {
    const { seedProductCategories } = await import('../../prisma/seed-product-categories')
    const stats = await seedProductCategories(this.prisma)
    return { ok: true, ...stats }
  }
}
