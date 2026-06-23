import { ConfigService } from '@nestjs/config'
import { SearchService } from './search.service'
import { PrismaService } from '../prisma/prisma.service'
import { AdsService } from '../ads/ads.service'

describe('SearchService', () => {
  let service: SearchService
  let prisma: {
    merchant: { findMany: jest.Mock; findUnique: jest.Mock }
    shop: { findMany: jest.Mock }
    menuItem: { findMany: jest.Mock }
    searchHistory: { create: jest.Mock }
  }
  const originalFetch = global.fetch

  beforeEach(() => {
    prisma = {
      merchant: { findMany: jest.fn(), findUnique: jest.fn() },
      shop: { findMany: jest.fn().mockResolvedValue([]) },
      menuItem: { findMany: jest.fn().mockResolvedValue([]) },
      searchHistory: { create: jest.fn() },
    }

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'MEILI_HOST') return 'http://localhost:7700'
        if (key === 'MEILI_MASTER_KEY') return 'test-key'
        return undefined
      }),
    }

    service = new SearchService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
      { getActiveMerchantIdsForPlacement: jest.fn().mockResolvedValue(new Set()) } as unknown as AdsService,
    )
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  describe('search', () => {
    it('retourne les résultats Meilisearch quand disponible', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hits: [{ id: 'm1', business_name: 'Bushman Café' }],
          estimatedTotalHits: 1,
          processingTimeMs: 12,
        }),
      }) as unknown as typeof fetch

      const result = await service.search({ q: 'cafe' })

      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
      expect(result.meta.processing_time_ms).toBe(12)
    })

    it('bascule sur Prisma si Meilisearch échoue', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }) as unknown as typeof fetch

      prisma.merchant.findMany.mockResolvedValue([
        {
          id: 'm1',
          business_name: 'Bushman Café',
          slug: 'le-bushman-cafe',
          description: 'Café',
          cover_image: null,
          whatsapp: null,
          verification_status: 'VERIFIED',
          trust_score: 80,
          is_sponsored: false,
          category: { name: 'Cafés', slug: 'cafes', icon: null },
          location: { city: 'Abidjan', district: 'Zone 4' },
          _count: { reviews: 2 },
        },
      ])

      const result = await service.search({ q: 'bushman' })

      expect(prisma.merchant.findMany).toHaveBeenCalled()
      expect(result.data).toHaveLength(1)
      expect(result.meta.processing_time_ms).toBe(0)
    })
  })

  describe('logSearch', () => {
    it('enregistre une recherche sans bloquer en cas d\'erreur', async () => {
      prisma.searchHistory.create.mockRejectedValue(new Error('db down'))

      await expect(
        service.logSearch('restaurant', 'Abidjan', 3, 'u1'),
      ).resolves.toBeUndefined()
    })
  })
})
