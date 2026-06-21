import { Module } from '@nestjs/common'
import { ShopsController } from './shops.controller'
import { ShopsService } from './shops.service'
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module'

@Module({
  imports: [DeliveryZonesModule],
  controllers: [ShopsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
