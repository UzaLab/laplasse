import { Module } from '@nestjs/common'
import { DeliveryZonesService } from './delivery-zones.service'

@Module({
  providers: [DeliveryZonesService],
  exports: [DeliveryZonesService],
})
export class DeliveryZonesModule {}
