import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { attachCardPreviewsToMerchants } from '../marketplace/vertical-preview'
import { isMenuMirrorProductSlug } from '../marketplace/marketplace.util'
import { AdsService } from '../ads/ads.service'

export interface SearchFilters {
  q?: string
  category?: string
  city?: string
  district?: string
  country?: string
  verified?: boolean
  sort?: 'trust_score' | 'created_at'
  limit?: number
  offset?: number
}

export interface ProductSearchFilters {
  q?: string
  category?: string
  shop?: string
  country?: string
  sort?: 'price_asc' | 'price_desc' | 'newest'
  maxPrice?: number
  limit?: number
  offset?: number
}

export interface UnifiedSearchFilters extends SearchFilters {
  type?: 'all' | 'merchants' | 'products'
  country?: string
  merchantOffset?: number
  productOffset?: number
}

type MeiliDocument = Record<string, unknown>

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name)
  private readonly INDEX_NAME = 'merchants'
  private readonly PRODUCTS_INDEX = 'products'
  private meiliHost: string
  private meiliKey: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ads: AdsService,
  ) {
    this.meiliHost = this.config.get('MEILI_HOST') ?? 'http://localhost:7700'
    this.meiliKey = this.config.get('MEILI_MASTER_KEY') ?? ''
  }

  async onModuleInit() {
    await this.ensureIndex()
    await this.ensureProductsIndex()
    await this.syncAllMerchants()
    await this.syncAllProducts()
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

  /** En production, Meilisearch est obligatoire — pas de fallback Prisma. */
  private isMeiliRequired(): boolean {
    return (
      this.config.get<string>('NODE_ENV') === 'production' ||
      this.config.get<string>('MEILI_REQUIRED') === 'true'
    )
  }

  private failMeiliRequired(error: unknown): never {
    const msg = error instanceof Error ? error.message : String(error)
    this.logger.error(`Meilisearch required but unavailable: ${msg}`)
    throw new ServiceUnavailableException('Moteur de recherche indisponible')
  }

  // ─── Index setup ──────────────────────────────────────────────────────────

  private async ensureIndex() {
    try {
      await this.meiliRequest('PATCH', `/indexes/${this.INDEX_NAME}/settings`, {
        searchableAttributes: [
          'business_name', 'description', 'category_name', 'district', 'city', 'tags',
        ],
        filterableAttributes: [
          'category_slug', 'city', 'district', 'country', 'verification_status', 'is_active',
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

  private async ensureProductsIndex() {
    try {
      await this.meiliRequest('PATCH', `/indexes/${this.PRODUCTS_INDEX}/settings`, {
        searchableAttributes: [
          'name', 'description', 'shop_name', 'category_name',
        ],
        filterableAttributes: [
          'category_slug', 'shop_slug', 'country', 'is_available',
        ],
        sortableAttributes: ['price', 'created_at'],
        rankingRules: [
          'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
        ],
      })
      this.logger.log(`Meilisearch index "${this.PRODUCTS_INDEX}" configured`)
    } catch (error) {
      this.logger.warn(`Meilisearch products index not available: ${(error as Error).message}`)
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
        country: m.location?.country ?? 'CI',
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
        country: m.location?.country ?? 'CI',
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
    const { q = '', category, city, district, country, verified, sort, limit = 20, offset = 0 } = filters

    try {
      const filterParts = ['is_active = true']
      if (category) filterParts.push(`category_slug = "${category}"`)
      if (city) filterParts.push(`city = "${city}"`)
      if (district) filterParts.push(`district = "${district}"`)
      if (country) filterParts.push(`country = "${country.toUpperCase()}"`)
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

      const searchBoostIds = await this.ads.getActiveMerchantIdsForPlacement('SEARCH')
      let hits = result.hits

      if (offset === 0 && searchBoostIds.size > 0) {
        const hitIds = new Set(hits.map(h => String(h.id)))
        const injected = await this.fetchInjectedSearchSponsors(searchBoostIds, filters, hitIds, 3)
        hits = [...injected, ...hits]
      }

      const sorted = this.sortSearchHitsWithBoost(hits, searchBoostIds).slice(0, limit)
      const injectedCount = offset === 0
        ? sorted.filter(h => searchBoostIds.has(String(h.id)) && !result.hits.some(r => String(r.id) === String(h.id))).length
        : 0

      const enriched = await attachCardPreviewsToMerchants(
        this.prisma,
        sorted as Array<{ id: string } & Record<string, unknown>>,
      )

      return {
        data: this.markSearchSponsors(enriched, searchBoostIds),
        meta: {
          total: (result.estimatedTotalHits ?? result.hits.length) + injectedCount,
          query: q,
          limit,
          offset,
          processing_time_ms: result.processingTimeMs,
        },
      }
    } catch (error) {
      if (this.isMeiliRequired()) this.failMeiliRequired(error)
      return this.fallbackSearch(filters)
    }
  }

  private isSearchHitBoosted(
    hit: { id?: unknown; is_sponsored?: unknown; verification_status?: unknown },
    searchBoostIds: Set<string>,
  ) {
    return (
      (searchBoostIds.has(String(hit.id)) || Boolean(hit.is_sponsored))
      && hit.verification_status === 'VERIFIED'
    )
  }

  private sortSearchHitsWithBoost(
    hits: MeiliDocument[],
    searchBoostIds: Set<string>,
  ): MeiliDocument[] {
    const isBoosted = (h: MeiliDocument) => this.isSearchHitBoosted(h, searchBoostIds)
    const sponsored = hits.filter(isBoosted)
    const regular = hits.filter(h => !isBoosted(h))
    const seen = new Set<string>()
    return [...sponsored.slice(0, 3), ...regular].filter(h => {
      const id = String(h.id)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  }

  private markSearchSponsors<T extends Record<string, unknown>>(
    items: Array<T & { id: string }>,
    searchBoostIds: Set<string>,
  ): Array<T & { id: string }> {
    return items.map(item => {
      const fromCampaign = searchBoostIds.has(String(item.id))
      const legacy = Boolean(item.is_sponsored)
      if ((fromCampaign || legacy) && item.verification_status === 'VERIFIED') {
        return { ...item, is_sponsored: true }
      }
      return item
    })
  }

  private merchantSearchSelect = {
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
    location: { select: { city: true, district: true, country: true } },
    _count: { select: { reviews: { where: { status: 'APPROVED' as const } } } },
  } as const

  private formatMerchantAsSearchHit(
    m: {
      id: string
      business_name: string
      slug: string
      description: string | null
      cover_image: string | null
      whatsapp: string | null
      verification_status: string
      trust_score: number
      is_sponsored: boolean
      category: { name: string; slug: string; icon: string | null }
      location: { city: string | null; district: string | null; country?: string | null } | null
      _count: { reviews: number }
    },
    forceSponsored = false,
  ): MeiliDocument {
    return {
      id: m.id,
      business_name: m.business_name,
      slug: m.slug,
      description: m.description ?? '',
      cover_image: m.cover_image,
      whatsapp: m.whatsapp,
      verification_status: m.verification_status,
      trust_score: m.trust_score,
      is_sponsored: forceSponsored || m.is_sponsored,
      category_name: m.category.name,
      category_slug: m.category.slug,
      category_icon: m.category.icon,
      city: m.location?.city ?? null,
      district: m.location?.district ?? null,
      country: m.location?.country ?? 'CI',
      review_count: m._count.reviews,
    }
  }

  private buildSearchSponsorWhere(filters: SearchFilters, candidateIds: string[]) {
    const { q, category, city, district, country, verified } = filters
    return {
      id: { in: candidateIds },
      is_active: true,
      verification_status: 'VERIFIED' as const,
      ...(category && { category: { slug: category } }),
      ...(country && { location: { country: country.toUpperCase() } }),
      ...(city && { location: { city: { equals: city, mode: 'insensitive' as const } } }),
      ...(district && { location: { district: { contains: district, mode: 'insensitive' as const } } }),
      ...(verified && { verification_status: 'VERIFIED' as const }),
      ...(q?.trim() && {
        OR: [
          { business_name: { contains: q.trim(), mode: 'insensitive' as const } },
          { description: { contains: q.trim(), mode: 'insensitive' as const } },
        ],
      }),
    }
  }

  private async fetchInjectedSearchMerchants(
    searchBoostIds: Set<string>,
    filters: SearchFilters,
    existingHitIds: Set<string>,
    max: number,
  ) {
    const candidateIds = [...searchBoostIds].filter(id => !existingHitIds.has(id))
    if (!candidateIds.length) return []

    return this.prisma.merchant.findMany({
      where: this.buildSearchSponsorWhere(filters, candidateIds),
      select: this.merchantSearchSelect,
      take: max,
      orderBy: { trust_score: 'desc' },
    })
  }

  private async fetchInjectedSearchSponsors(
    searchBoostIds: Set<string>,
    filters: SearchFilters,
    existingHitIds: Set<string>,
    max: number,
  ): Promise<MeiliDocument[]> {
    const merchants = await this.fetchInjectedSearchMerchants(
      searchBoostIds,
      filters,
      existingHitIds,
      max,
    )
    return merchants.map(m => this.formatMerchantAsSearchHit(m, true))
  }

  private async fallbackSearch(filters: SearchFilters) {
    const { q, category, city, district, country, verified, limit = 20, offset = 0 } = filters
    const searchBoostIds = await this.ads.getActiveMerchantIdsForPlacement('SEARCH')

    let merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        ...(q && {
          OR: [
            { business_name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category: { slug: category } }),
        ...(country && { location: { country: country.toUpperCase() } }),
        ...(city && { location: { city: { equals: city, mode: 'insensitive' } } }),
        ...(district && { location: { district: { contains: district, mode: 'insensitive' } } }),
        ...(verified && { verification_status: 'VERIFIED' }),
      },
      select: this.merchantSearchSelect,
      orderBy: { trust_score: 'desc' },
      take: limit,
      skip: offset,
    })

    if (offset === 0 && searchBoostIds.size > 0) {
      const pageIds = new Set(merchants.map(m => m.id))
      const injected = await this.fetchInjectedSearchMerchants(searchBoostIds, filters, pageIds, 3)
      if (injected.length) {
        merchants = [...injected, ...merchants]
      }
    }

    const isBoosted = (m: (typeof merchants)[number]) =>
      this.isSearchHitBoosted(m, searchBoostIds)
    const sponsored = merchants.filter(isBoosted)
    const regular = merchants.filter(m => !isBoosted(m))
    const merged = [...sponsored.slice(0, 3), ...regular].slice(0, limit)

    const formatted = merged.map(m => ({
      id: m.id,
      business_name: m.business_name,
      slug: m.slug,
      description: m.description,
      cover_image: m.cover_image,
      whatsapp: m.whatsapp,
      verification_status: m.verification_status,
      trust_score: m.trust_score,
      is_sponsored: searchBoostIds.has(m.id) || m.is_sponsored,
      category: m.category,
      category_name: m.category.name,
      category_slug: m.category.slug,
      category_icon: m.category.icon,
      location: m.location,
      city: m.location?.city ?? null,
      district: m.location?.district ?? null,
      review_count: m._count.reviews,
    }))

    const enriched = await attachCardPreviewsToMerchants(this.prisma, formatted)

    return {
      data: this.markSearchSponsors(enriched, searchBoostIds),
      meta: { total: merged.length, query: q ?? '', limit, offset, processing_time_ms: 0 },
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

  async autocomplete(q: string, limit = 6, country?: string) {
    if (!q || q.length < 2) return []

    try {
      const filterParts = ['is_active = true']
      if (country) filterParts.push(`country = "${country.toUpperCase()}"`)

      const result = await this.meiliRequest('POST', `/indexes/${this.INDEX_NAME}/search`, {
        q,
        limit,
        filter: filterParts.join(' AND '),
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
    } catch (error) {
      if (this.isMeiliRequired()) this.failMeiliRequired(error)
      return this.autocompleteMerchantsFallback(q, limit, country)
    }
  }

  private async autocompleteMerchantsFallback(q: string, limit: number, country?: string) {
    const merchants = await this.prisma.merchant.findMany({
      where: {
        is_active: true,
        business_name: { contains: q, mode: 'insensitive' },
        ...(country ? { location: { country: country.toUpperCase() } } : {}),
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

  async autocompleteProducts(q: string, limit = 3, country?: string) {
    if (!q || q.length < 2) return []

    try {
      const filterParts = ['is_available = true']
      if (country) filterParts.push(`country = "${country.toUpperCase()}"`)

      const result = await this.meiliRequest('POST', `/indexes/${this.PRODUCTS_INDEX}/search`, {
        q,
        limit,
        filter: filterParts.join(' AND '),
        attributesToRetrieve: ['id', 'name', 'slug', 'shop_name', 'shop_slug', 'category_name', 'price', 'currency'],
        attributesToHighlight: ['name'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        showRankingScore: false,
      }) as { hits: MeiliDocument[] }

      return result.hits.map(h => ({
        id: h['id'] as string,
        name: h['name'] as string,
        slug: h['slug'] as string,
        price: h['price'] as number,
        currency: (h['currency'] as string) ?? 'XOF',
        category_name: (h['category_name'] as string | null) ?? null,
        merchant: {
          business_name: h['shop_name'] as string,
          slug: h['shop_slug'] as string,
        },
        _highlight: (h['_formatted'] as Record<string, string> | undefined)?.['name'],
      }))
    } catch (error) {
      if (this.isMeiliRequired()) this.failMeiliRequired(error)
      return this.autocompleteProductsFallback(q, limit, country)
    }
  }

  private async autocompleteProductsFallback(q: string, limit: number, country?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        AND: [
          {
            OR: [
              { stock_quantity: { gt: 0 } },
              { variants: { some: { stock_quantity: { gt: 0 } } } },
            ],
          },
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
        shop: {
          is_active: true,
          status: 'ACTIVE',
          ...(country && { country: country.toUpperCase() }),
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        category: { select: { name: true } },
        shop: { select: { name: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      currency: p.currency,
      category_name: p.category?.name ?? null,
      merchant: {
        business_name: p.shop.name,
        slug: p.shop.slug,
      },
      _highlight: null,
    }))
  }

  async autocompleteUnified(q: string, limit = 6, country?: string) {
    const merchantLimit = Math.ceil(limit / 2)
    const productLimit = Math.floor(limit / 2)

    const [merchants, products] = await Promise.all([
      this.autocomplete(q, merchantLimit, country),
      this.autocompleteProducts(q, productLimit, country),
    ])

    return { merchants, products }
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

  // ─── Products index ────────────────────────────────────────────────────────

  private productSyncInclude = {
    category: { select: { id: true, name: true, slug: true } },
    shop: {
      select: {
        id: true, name: true, slug: true, logo: true, country: true,
        is_active: true, status: true,
      },
    },
    variants: { select: { stock_quantity: true } },
  } as const

  private isProductAvailable(product: {
    slug: string
    status: string
    stock_quantity: number
    variants: { stock_quantity: number }[]
    shop: { is_active: boolean; status: string }
  }): boolean {
    if (isMenuMirrorProductSlug(product.slug)) return false
    if (product.status !== 'ACTIVE') return false
    if (!product.shop.is_active || product.shop.status !== 'ACTIVE') return false
    if (product.stock_quantity > 0) return true
    return product.variants.some(v => v.stock_quantity > 0)
  }

  private buildProductDocument(product: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    currency: string
    image_url: string | null
    created_at: Date
    status: string
    stock_quantity: number
    category: { id: string; name: string; slug: string } | null
    shop: { id: string; name: string; slug: string; logo: string | null; country: string; is_active: boolean; status: string }
    variants: { stock_quantity: number }[]
  }): MeiliDocument {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: product.price,
      currency: product.currency,
      image_url: product.image_url ?? null,
      shop_id: product.shop.id,
      shop_name: product.shop.name,
      shop_slug: product.shop.slug,
      shop_logo: product.shop.logo ?? null,
      category_id: product.category?.id ?? null,
      category_slug: product.category?.slug ?? null,
      category_name: product.category?.name ?? null,
      country: product.shop.country,
      is_available: this.isProductAvailable(product),
      created_at: product.created_at.getTime(),
    }
  }

  async syncAllProducts() {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          slug: { not: { startsWith: 'menu-item-' } },
        },
        include: this.productSyncInclude,
      })

      if (products.length === 0) return

      const documents = products.map(p => this.buildProductDocument(p))
      await this.meiliRequest(
        'POST',
        `/indexes/${this.PRODUCTS_INDEX}/documents?primaryKey=id`,
        documents,
      )
      this.logger.log(`Synced ${documents.length} products to Meilisearch`)
    } catch (error) {
      this.logger.warn(`Meilisearch products sync skipped: ${(error as Error).message}`)
    }
  }

  async syncProduct(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: this.productSyncInclude,
      })
      if (!product) return

      if (isMenuMirrorProductSlug(product.slug) || !this.isProductAvailable(product)) {
        await this.removeProduct(productId)
        return
      }

      await this.meiliRequest(
        'POST',
        `/indexes/${this.PRODUCTS_INDEX}/documents?primaryKey=id`,
        [this.buildProductDocument(product)],
      )
    } catch (error) {
      this.logger.warn(`Meilisearch product sync ${productId}: ${(error as Error).message}`)
    }
  }

  async removeProduct(productId: string) {
    try {
      await this.meiliRequest(
        'DELETE',
        `/indexes/${this.PRODUCTS_INDEX}/documents/${productId}`,
      )
    } catch (error) {
      this.logger.warn(`Meilisearch product remove ${productId}: ${(error as Error).message}`)
    }
  }

  async unifiedSearch(filters: UnifiedSearchFilters) {
    const {
      type = 'all',
      country,
      limit = 20,
      offset = 0,
      merchantOffset,
      productOffset,
      ...rest
    } = filters
    const pageSize = limit

    const resolvedMerchantOffset =
      type === 'products'
        ? 0
        : merchantOffset ?? (type === 'merchants' ? offset : 0)
    const resolvedProductOffset =
      type === 'merchants'
        ? 0
        : productOffset ?? (type === 'products' ? offset : 0)

    const emptyProducts = {
      data: [] as Awaited<ReturnType<SearchService['searchProducts']>>['data'],
      meta: {
        total: 0,
        query: rest.q ?? '',
        limit: pageSize,
        offset: 0,
        processing_time_ms: 0,
      },
    }

    const [merchants, products] = await Promise.all([
      type !== 'products'
        ? this.search({
            ...rest,
            country,
            limit: pageSize,
            offset: resolvedMerchantOffset,
          })
        : Promise.resolve(null),
      type !== 'merchants'
        ? this.searchProducts({
            q: rest.q,
            country,
            limit: pageSize,
            offset: resolvedProductOffset,
          })
        : Promise.resolve(null),
    ])

    return {
      merchants: merchants ?? {
        data: [],
        meta: {
          total: 0,
          query: rest.q ?? '',
          limit: pageSize,
          offset: 0,
          processing_time_ms: 0,
        },
      },
      products: products ?? emptyProducts,
      meta: {
        query: rest.q ?? '',
        type,
        processing_time_ms:
          (merchants?.meta.processing_time_ms ?? 0) +
          (products?.meta.processing_time_ms ?? 0),
      },
    }
  }

  async searchProducts(filters: ProductSearchFilters) {
    const {
      q = '',
      category,
      shop,
      country,
      sort,
      maxPrice,
      limit = 50,
      offset = 0,
    } = filters

    try {
      const filterParts = ['is_available = true']
      if (category) filterParts.push(`category_slug = "${category}"`)
      if (shop) filterParts.push(`shop_slug = "${shop}"`)
      if (country) filterParts.push(`country = "${country}"`)
      if (maxPrice != null && maxPrice > 0) filterParts.push(`price <= ${maxPrice}`)

      const sortParam =
        sort === 'price_asc'
          ? ['price:asc']
          : sort === 'price_desc'
            ? ['price:desc']
            : q
              ? undefined
              : ['created_at:desc']

      const result = await this.meiliRequest(
        'POST',
        `/indexes/${this.PRODUCTS_INDEX}/search`,
        {
          q,
          filter: filterParts.join(' AND '),
          limit,
          offset,
          sort: sortParam,
          attributesToHighlight: ['name', 'description'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
        },
      ) as {
        hits: MeiliDocument[]
        estimatedTotalHits?: number
        processingTimeMs: number
      }

      return {
        data: result.hits.map(h => this.formatProductHit(h)),
        meta: {
          total: result.estimatedTotalHits ?? result.hits.length,
          query: q,
          limit,
          offset,
          processing_time_ms: result.processingTimeMs,
        },
      }
    } catch (error) {
      if (this.isMeiliRequired()) this.failMeiliRequired(error)
      return this.fallbackProductSearch(filters)
    }
  }

  private async fallbackProductSearch(filters: ProductSearchFilters) {
    const { q, category, shop, country, sort, maxPrice, limit = 50, offset = 0 } = filters

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        slug: { not: { startsWith: 'menu-item-' } },
        OR: [
          { stock_quantity: { gt: 0 } },
          { variants: { some: { stock_quantity: { gt: 0 } } } },
        ],
        shop: {
          is_active: true,
          status: 'ACTIVE',
          ...(country && { country: country.toUpperCase() }),
          ...(shop && { slug: shop }),
        },
        ...(category && { category: { slug: category } }),
        ...(maxPrice != null && maxPrice > 0 && { price: { lte: maxPrice } }),
        ...(q && {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }),
      },
      include: this.productSyncInclude,
      orderBy:
        sort === 'price_asc'
          ? { price: 'asc' }
          : sort === 'price_desc'
            ? { price: 'desc' }
            : { created_at: 'desc' },
      take: limit,
      skip: offset,
    })

    const available = products.filter(p => this.isProductAvailable(p))

    return {
      data: available.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        currency: p.currency,
        image_url: p.image_url,
        created_at: p.created_at.toISOString(),
        category: p.category,
        merchant: {
          business_name: p.shop.name,
          slug: p.shop.slug,
          logo: p.shop.logo,
        },
      })),
      meta: {
        total: available.length,
        query: q ?? '',
        limit,
        offset,
        processing_time_ms: 0,
      },
    }
  }

  private formatProductHit(h: MeiliDocument) {
    return {
      id: h['id'] as string,
      name: h['name'] as string,
      slug: h['slug'] as string,
      price: h['price'] as number,
      currency: (h['currency'] as string) ?? 'XOF',
      image_url: (h['image_url'] as string | null) ?? null,
      created_at: h['created_at']
        ? new Date(h['created_at'] as number).toISOString()
        : undefined,
      category: h['category_id']
        ? {
            id: h['category_id'] as string,
            name: h['category_name'] as string,
            slug: h['category_slug'] as string,
          }
        : null,
      merchant: {
        business_name: h['shop_name'] as string,
        slug: h['shop_slug'] as string,
        logo: (h['shop_logo'] as string | null) ?? null,
      },
      _formatted: h['_formatted'] as Record<string, string> | undefined,
    }
  }
}
