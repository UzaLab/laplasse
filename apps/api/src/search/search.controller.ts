import { Controller, Get, Query, Req } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { DEFAULT_COUNTRY, type RequestWithCountry } from '../common/country/country.interceptor'
import { SearchService } from './search.service'

@Public()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('country') country?: string,
    @Query('verified') verified?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.searchService.search({
      q,
      category,
      city,
      district,
      country: country ?? req.countryCode ?? DEFAULT_COUNTRY,
      verified: verified === 'true',
      sort: sort as 'trust_score' | 'created_at' | undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    })

    if (q?.trim()) {
      this.searchService.logSearch(q, city, result.meta.total).catch(() => {})
    }

    return result
  }

  @Get('autocomplete/unified')
  async autocompleteUnified(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
  ) {
    return this.searchService.autocompleteUnified(
      q ?? '',
      limit ? Number(limit) : 6,
      country ?? req.countryCode ?? DEFAULT_COUNTRY,
    )
  }

  @Get('autocomplete')
  async autocomplete(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
  ) {
    return this.searchService.autocomplete(
      q ?? '',
      limit ? Number(limit) : 6,
      country ?? req.countryCode ?? DEFAULT_COUNTRY,
    )
  }

  @Get('autocomplete/products')
  autocompleteProducts(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
  ) {
    return this.searchService.autocompleteProducts(
      q ?? '',
      limit ? Number(limit) : 8,
      country ?? req.countryCode ?? DEFAULT_COUNTRY,
    )
  }

  @Get('trending')
  async trending(@Query('limit') limit?: string) {
    return this.searchService.trendingSearches(limit ? Number(limit) : 8)
  }

  @Get('unified')
  async unifiedSearch(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('verified') verified?: string,
    @Query('sort') sort?: string,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('merchantOffset') merchantOffset?: string,
    @Query('productOffset') productOffset?: string,
  ) {
    const resolvedType =
      type === 'merchants' || type === 'products' ? type : 'all'

    const result = await this.searchService.unifiedSearch({
      q,
      type: resolvedType,
      category,
      city,
      district,
      verified: verified === 'true',
      sort: sort as 'trust_score' | 'created_at' | undefined,
      country: country ?? req.countryCode ?? DEFAULT_COUNTRY,
      limit: limit ? Number(limit) : 12,
      offset: offset ? Number(offset) : 0,
      merchantOffset: merchantOffset ? Number(merchantOffset) : undefined,
      productOffset: productOffset ? Number(productOffset) : undefined,
    })

    if (q?.trim()) {
      const total =
        result.merchants.meta.total + result.products.meta.total
      this.searchService.logSearch(q, city, total).catch(() => {})
    }

    return result
  }

  @Get('products')
  async searchProducts(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('shop') shop?: string,
    @Query('country') country?: string,
    @Query('sort') sort?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.searchService.searchProducts({
      q,
      category,
      shop,
      country: country ?? req.countryCode ?? DEFAULT_COUNTRY,
      sort: sort as 'price_asc' | 'price_desc' | 'newest' | undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    })

    return result
  }
}
