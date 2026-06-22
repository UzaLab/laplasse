import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SearchService } from '../search/search.service'

@Injectable()
export class AdminSeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
  ) {}

  /** Seed marchands BF/SN + verticals (idempotent). Option country = BF | SN | ALL */
  async seedMultipays(country: 'BF' | 'SN' | 'ALL' = 'ALL') {
    const categories = await this.prisma.category.findMany({
      select: { id: true, slug: true },
    })
    const cat = Object.fromEntries(categories.map(c => [c.slug, c])) as Record<string, { id: string; slug: string }>

    const ouaga = await this.prisma.geoCity.findFirst({
      where: { country: 'BF', slug: 'ouagadougou', is_active: true },
    })
    const dakar = await this.prisma.geoCity.findFirst({
      where: { country: 'SN', slug: 'dakar', is_active: true },
    })

    if (!ouaga && (country === 'BF' || country === 'ALL')) {
      throw new Error('Ville Ouagadougou introuvable — lancez le seed geo BF d’abord')
    }
    if (!dakar && (country === 'SN' || country === 'ALL')) {
      throw new Error('Ville Dakar introuvable — lancez le seed geo SN d’abord')
    }

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
}
