import { Controller, Get, Query } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { SearchService } from './search.service'

@Public()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
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

  @Get('autocomplete')
  async autocomplete(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.autocomplete(q ?? '', limit ? Number(limit) : 6)
  }

  @Get('trending')
  async trending(@Query('limit') limit?: string) {
    return this.searchService.trendingSearches(limit ? Number(limit) : 8)
  }
}
