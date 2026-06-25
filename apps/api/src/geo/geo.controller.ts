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

  @Get('countries')
  findCountries() {
    return this.geoService.findCountriesPublic()
  }

  @Get('places/search')
  searchPlaces(
    @Query('q') q: string,
    @Query('country') country: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('lng') lng: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: RequestWithCountry,
  ) {
    return this.geoService.searchPlaces(q ?? '', {
      country: country ?? req.countryCode ?? DEFAULT_COUNTRY,
      lat: lat != null && lat !== '' ? Number(lat) : undefined,
      lng: lng != null && lng !== '' ? Number(lng) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }
}
