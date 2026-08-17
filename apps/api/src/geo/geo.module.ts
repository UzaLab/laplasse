import { Module } from '@nestjs/common'
import { GeoController } from './geo.controller'
import { GeoService } from './geo.service'
import { GoogleMapsService } from './google-maps.service'

@Module({
  controllers: [GeoController],
  providers: [GeoService, GoogleMapsService],
  exports: [GeoService, GoogleMapsService],
})
export class GeoModule {}
