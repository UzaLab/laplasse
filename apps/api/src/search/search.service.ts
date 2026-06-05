import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'

export interface SearchFilters {
  q?: string
  category?: string
  city?: string
  district?: string
  verified?: boolean
  sort?: 'trust_score' | 'created_at'
  limit?: number
  offset?: number
}

type MeiliDocument = Record<string, unknown>

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name)
  private readonly INDEX_NAME = 'merchants'
  private meiliHost: string
  private meiliKey: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.meiliHost = this.config.get('MEILI_HOST') ?? 'http://localhost:7700'
    this.meiliKey = this.config.get('MEILI_MASTER_KEY') ?? ''
  }

  async onModuleInit() {
    await this.ensureIndex()
    await this.syncAllMerchants()
  }

  // ─── Meilisearch REST helpers ──────────────────────────────────────────────

  private async meiliRequest(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const res = await fetch(`${this.meiliHost}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.meiliKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`Meilisearch ${method} ${path} → ${res.status}`)
    return res.json()
  }

  // ─── Index setup ──────────────────────────────────────────────────────────

  private async ensureIndex() {
    try {
      await this.meiliRequest('PATCH', `/indexes/${this.INDEX_NAME}/settings`, {
        searchableAttributes: [
          'business_name', 'description', 'category_name', 'district', 'city', 'tags',
        ],
        filterableAttributes: [
          'category_slug', 'city', 'district', 'verification_status', 'is_active',
        ],
        sortableAttributes: ['trust_score', 'created_at'],
        rankingRules: [
          'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
        },
      })
      this.logger.log(`Meilisearch index "${this.INDEX_NAME}" configured`)
    } catch (error) {
      this.logger.warn(`Meilisearch not available: ${(error as Error).message}`)
    }
  }

  // ─── Sync merchants → Meilisearch ─────────────────────────────────────────

  async syncAllMerchants() {
    try {
      const merchants = await this.prisma.merchant.findMany({
        where: { is_active: true },
        include: {
          category: true,
          location: true,
          tags: { include: { tag: true } },
          _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
        },
      })

      if (merchants.length === 0) return

      const documents: MeiliDocument[] = merchants.map(m => ({
        id: m.id,
        business_name: m.business_name,
        slug: m.slug,
        description: m.description ?? '',
        logo: m.logo ?? null,
        cover_image: m.cover_image ?? null,
        whatsapp: m.whatsapp ?? null,
        verification_status: m.verification_status,
        trust_score: m.trust_score,
        is_active: m.is_active,
        is_sponsored: m.is_sponsored,
        category_id: m.category.id,
        category_name: m.category.name,
        category_slug: m.category.slug,
        category_icon: m.category.icon ?? null,
        city: m.location?.city ?? null,
        district: m.location?.district ?? null,
        address: m.location?.address ?? null,
        latitude: m.location?.latitude ?? null,
        longitude: m.location?.longitude ?? null,
        tags: m.tags.map(t => t.tag.name),
        review_count: (m._count as { reviews: number }).reviews,
        created_at: m.created_at.getTime(),
      }))

      await this.meiliRequest('POST', `/indexes/${this.INDEX_NAME}/documents?primaryKey=id`, documents)
      this.logger.log(`Synced ${documents.length} merchants to Meilisearch`)
    } catch (error) {
      this.logger.warn(`Meilisearch sync skipped: ${(error as Error).message}`)
    }
  }

  async syncMerchant(merchantId: string) {
    try {
      const m = await this.prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          category: true,
          location: true,
          tags: { include: { tag: true } },
          _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
        },
      })
      if (!m) return

      await this.meiliRequest('POST', `/indexes/${this.INDEX_NAME}/documents?primaryKey=id`, [{
        id: m.id,
        business_name: m.business_name,
        slug: m.slug,
        description: m.description ?? '',
        cover_image: m.cover_image ?? null,
        whatsapp: m.whatsapp ?? null,
        verification_status: m.verification_status,
        trust_score: m.trust_score,
        is_active: m.is_active,
        is_sponsored: m.is_sponsored,
        category_slug: m.category.slug,
        category_name: m.category.name,
        category_icon: m.category.icon ?? null,
        city: m.location?.city ?? null,
        district: m.location?.district ?? null,
        tags: m.tags.map(t => t.tag.name),
        review_count: (m._count as { reviews: number }).reviews,
        created_at: m.created_at.getTime(),
      }])
    } catch (error) {
      this.logger.warn(`Meilisearch sync ${merchantId}: ${(error as Error).message}`)
    }
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async search(filters: SearchFilters) {
    const { q = '', category, city, district, verified, sort, limit = 20, offset = 0 } = filters

    try {
      const filterParts = ['is_active = true']
      if (category) filterParts.push(`category_slug = "${category}"`)
      if (city) filterParts.push(`city = "${city}"`)
      if (district) filterParts.push(`district = "${district}"`)
      if (verified) filterParts.push(`verification_status = "VERIFIED"`)

      const sortField = sort ?? 'trust_score'
      const searchBody: Record<string, unknown> = {
        q,
        filter: filterParts.join(' AND '),
        limit,
        offset,
        sort: q ? undefined : [`${sortField}:desc`],
        attributesToHighlight: ['business_name', 'description'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      }

      const result = await this.meiliRequest(
        'POST',
        `/indexes/${this.INDEX_NAME}/search`,
        searchBody,
      ) as {
        hits: MeiliDocument[]
        estimatedTotalHits?: number
        processingTimeMs: number
      }

      // Sponsored merchants bubble up (max 2 slots), only when relevant (verified)
      const sponsored = result.hits.filter(h => h['is_sponsored'] && h['verification_status'] === 'VERIFIED')
      const regular   = result.hits.filter(h => !h['is_sponsored'] || h['verification_status'] !== 'VERIFIED')
      const sorted    = [...sponsored.slice(0, 2), ...regular]

      return {
        data: sorted,
        meta: {
          total: result.estimatedTotalHits ?? result.hits.length,
          query: q,
          limit,
          offset,
          processing_time_ms: result.processingTimeMs,
        },
      }
    } catch {
      return this.fallbackSearch(filters)
    }
  }

  private async fallbackSearch(filters: SearchFilters) {
    const { q, category, city, district, verified, limit = 20, offset = 0 } = filters
    const merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        ...(q && {
          OR: [
            { business_name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category: { slug: category } }),
        ...(city && { location: { city: { equals: city, mode: 'insensitive' } } }),
        ...(district && { location: { district: { contains: district, mode: 'insensitive' } } }),
        ...(verified && { verification_status: 'VERIFIED' }),
      },
      select: {
        id: true,
        business_name: true,
        slug: true,
        description: true,
        cover_image: true,
        whatsapp: true,
        verification_status: true,
        trust_score: true,
        is_sponsored: true,
        category: { select: { name: true, slug: true, icon: true } },
        location: { select: { city: true, district: true } },
        _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
      },
      orderBy: { trust_score: 'desc' },
      take: limit,
      skip: offset,
    })

    return {
      data: merchants,
      meta: { total: merchants.length, query: q ?? '', limit, offset, processing_time_ms: 0 },
    }
  }

  async logSearch(query: string, city?: string, resultsCount = 0, userId?: string) {
    try {
      await this.prisma.searchHistory.create({
        data: { query, city: city ?? 'Abidjan', results_count: resultsCount, user_id: userId ?? null },
      })
    } catch { /* non-blocking */ }
  }

  // ─── Autocomplete ──────────────────────────────────────────────────────────

  async autocomplete(q: string, limit = 6) {
    if (!q || q.length < 2) return []

    try {
      const result = await this.meiliRequest('POST', `/indexes/${this.INDEX_NAME}/search`, {
        q,
        limit,
        filter: 'is_active = true',
        attributesToRetrieve: ['id', 'business_name', 'slug', 'category_name', 'category_slug', 'district', 'verification_status'],
        attributesToHighlight: ['business_name'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        showRankingScore: false,
      }) as { hits: MeiliDocument[] }

      return result.hits.map(h => ({
        id: h['id'] as string,
        business_name: h['business_name'] as string,
        slug: h['slug'] as string,
        category_name: h['category_name'] as string,
        category_slug: h['category_slug'] as string,
        district: (h['district'] as string | null) ?? null,
        verification_status: h['verification_status'] as string,
        _highlight: (h['_formatted'] as Record<string, string> | undefined)?.['business_name'],
      }))
    } catch {
      // Fallback Prisma
      const merchants = await this.prisma.merchant.findMany({
        where: {
          is_active: true,
          business_name: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true, business_name: true, slug: true,
          verification_status: true,
          category: { select: { name: true, slug: true } },
          location: { select: { district: true } },
        },
        orderBy: { trust_score: 'desc' },
        take: limit,
      })
      return merchants.map(m => ({
        id: m.id,
        business_name: m.business_name,
        slug: m.slug,
        category_name: m.category.name,
        category_slug: m.category.slug,
        district: m.location?.district ?? null,
        verification_status: m.verification_status,
        _highlight: null,
      }))
    }
  }

  // ─── Trending searches ─────────────────────────────────────────────────────

  async trendingSearches(limit = 8) {
    try {
      const rows = await this.prisma.searchHistory.groupBy({
        by: ['query'],
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: limit,
        where: {
          created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          results_count: { gt: 0 },
          NOT: { query: { in: ['', ' '] } },
        },
      })
      return rows.map(r => ({ query: r.query, count: r._count.query }))
    } catch {
      return []
    }
  }
}
