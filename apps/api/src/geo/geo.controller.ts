import { Controller, Get, Param, Query, Req } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { GeoService } from './geo.service'
import { DEFAULT_COUNTRY, type RequestWithCountry } from '../common/country/country.interceptor'

@Public()
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('cities')
  findCities(@Query('country') country: string | undefined, @Req() req: RequestWithCountry) {
    return this.geoService.findCities(country ?? req.countryCode ?? DEFAULT_COUNTRY)
  }

  @Get('cities/:citySlug/communes')
  findCommunes(
    @Param('citySlug') citySlug: string,
    @Query('country') country: string | undefined,
    @Req() req: RequestWithCountry,
  ) {
    return this.geoService.findCommunesByCitySlug(
      country ?? req.countryCode ?? DEFAULT_COUNTRY,
      citySlug,
    )
  }
}
